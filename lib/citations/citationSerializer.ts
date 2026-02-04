/**
 * Citation Serialization System
 *
 * This module provides bidirectional conversion between:
 * 1. Editor citation nodes (TipTap/ProseMirror format)
 * 2. Database records (Directus source_links format)
 * 3. Frontend display format (HTML with data attributes)
 */

import {
  UnifiedCitation,
  CitationAttrs,
  CitationData,
  toUnified,
  unifiedToAttrs
} from './types';

// Database interfaces matching Directus schema
export interface SourceLink {
  id?: number;
  relationship_type: 'quotes' | 'references';
  page_number?: string | null;
  section_reference?: string | null;
  verse_reference?: string | null;
  confidence_level?: 'low' | 'medium' | 'high' | null;
  notes?: string | null;
  statement_id?: number | null;
  source_id: number;
  topic_id?: number | null;
}

export interface Source {
  id: number;
  title: string;
  original_lang?: string | null;
  publication_year?: number | null;
  publisher?: string | null;
  isbn?: string | null;
  external_system?: string | null;
  external_url?: string | null;
  citation_text?: string | null;
  author_id?: number | null;
}

/**
 * Normalize citation data to unified format
 * Uses the new type system from lib/citations/types.ts
 */
function normalizeCitation(
  citation: CitationAttrs | CitationData | UnifiedCitation
): UnifiedCitation {
  return toUnified(citation);
}

/**
 * Converts editor citation data to database source_link format
 */
export function editorCitationToSourceLink(
  citation: CitationAttrs | CitationData | UnifiedCitation,
  statementId?: number | null,
  topicId?: number | null
): SourceLink {
  const normalized = normalizeCitation(citation);
  
  // Ensure source_id is a number
  let sourceId: number;
  if (typeof normalized.sourceId === 'string') {
    sourceId = parseInt(normalized.sourceId);
    if (isNaN(sourceId)) {
      throw new Error('Invalid source ID: must be a number or numeric string');
    }
  } else if (typeof normalized.sourceId === 'number') {
    sourceId = normalized.sourceId;
  } else {
    throw new Error('Source ID is required for citation serialization');
  }

  return {
    relationship_type: 'references',
    source_id: sourceId,
    statement_id: statementId ?? null,
    topic_id: topicId ?? null,
    page_number: normalized.pageNumber || null,
    section_reference: (normalized.reference || normalized.customReference) || null,
    verse_reference: normalized.verseNumber || null,
    notes: (normalized.note || normalized.quote) || null,
  };
}

/**
 * Converts database source_link to editor citation format
 * FIXED: No longer derives citation_type from relationship_type
 * Citation type should be stored separately in the database or inferred from reference fields
 */
export function sourceLinkToEditorCitation(
  sourceLink: SourceLink,
  source: Source,
  citationType?: string
): CitationAttrs {
  // Infer citation type from available reference fields if not provided
  let inferredType = citationType || 'reference';

  if (!citationType) {
    if (sourceLink.verse_reference) {
      inferredType = 'verse';
    } else if (sourceLink.page_number) {
      inferredType = 'page';
    } else if (sourceLink.section_reference) {
      inferredType = 'section';
    }
  }

  return {
    source_id: sourceLink.source_id,
    source_title: source.title,
    citation_type: inferredType,
    page_number: sourceLink.page_number ?? undefined,
    reference: sourceLink.section_reference || '',
    verse_number: sourceLink.verse_reference ?? undefined,
    note: sourceLink.notes ?? undefined,
    url: source.external_url ?? undefined,
  };
}

/**
 * Serializes citation to HTML format with data attributes
 * FIXED: Now includes data-citation-type to preserve citation type
 */
export function serializeCitationToHtml(
  citation: CitationAttrs | CitationData | UnifiedCitation
): string {
  const normalized = normalizeCitation(citation);
  const citationId = normalized.id || `cite_${Math.random().toString(36).substring(2, 12)}`;
  const displayText = normalized.reference ||
    (normalized.sourceTitle ? normalized.sourceTitle.slice(0, 15) : '†');

  return `<span
    class="citation-ref"
    data-type="citation"
    data-citation-id="${citationId}"
    data-citation-type="${normalized.citationType || 'reference'}"
    data-source-id="${normalized.sourceId || ''}"
    data-source-title="${normalized.sourceTitle || ''}"
    data-reference="${normalized.reference || ''}"
    ${normalized.pageNumber ? `data-page-number="${normalized.pageNumber}"` : ''}
    ${normalized.chapterNumber ? `data-chapter-number="${normalized.chapterNumber}"` : ''}
    ${normalized.sectionNumber ? `data-section-number="${normalized.sectionNumber}"` : ''}
    ${normalized.verseNumber ? `data-verse-number="${normalized.verseNumber}"` : ''}
    ${normalized.dafNumber ? `data-daf-number="${normalized.dafNumber}"` : ''}
    ${normalized.halachaNumber ? `data-halacha-number="${normalized.halachaNumber}"` : ''}
    ${normalized.customReference ? `data-custom-reference="${normalized.customReference}"` : ''}
    ${normalized.url ? `data-url="${normalized.url}"` : ''}
    ${normalized.quote ? `data-quote="${normalized.quote}"` : ''}
    ${normalized.note ? `data-note="${normalized.note}"` : ''}
  >[${displayText}]</span>`;
}

/**
 * Deserializes HTML citation to citation data object
 * FIXED: Now reads data-citation-type instead of hardcoding to 'reference'
 */
export function deserializeHtmlToCitation(html: string): CitationAttrs | null {
  let doc: Document;

  if (typeof window !== 'undefined') {
    doc = new DOMParser().parseFromString(html, 'text/html');
  } else {
    const { JSDOM } = require('jsdom');
    doc = new JSDOM(html).window.document;
  }

  const citationEl = doc.querySelector('[data-type="citation"]');

  if (!citationEl) return null;

  return {
    source_id: citationEl.getAttribute('data-source-id') || '',
    source_title: citationEl.getAttribute('data-source-title') || '',
    citation_type: citationEl.getAttribute('data-citation-type') || 'reference',
    reference: citationEl.getAttribute('data-reference') || '',
    page_number: citationEl.getAttribute('data-page-number') || '',
    chapter_number: citationEl.getAttribute('data-chapter-number')
      ? parseInt(citationEl.getAttribute('data-chapter-number')!)
      : null,
    section_number: citationEl.getAttribute('data-section-number')
      ? parseInt(citationEl.getAttribute('data-section-number')!)
      : null,
    verse_number: citationEl.getAttribute('data-verse-number') || '',
    daf_number: citationEl.getAttribute('data-daf-number') || '',
    halacha_number: citationEl.getAttribute('data-halacha-number')
      ? parseInt(citationEl.getAttribute('data-halacha-number')!)
      : null,
    custom_reference: citationEl.getAttribute('data-custom-reference') || '',
    url: citationEl.getAttribute('data-url') || '',
    quote: citationEl.getAttribute('data-quote') || '',
    note: citationEl.getAttribute('data-note') || '',
  };
}

/**
 * Processes HTML content to replace citation placeholders with rich citation nodes
 */
export function enrichHtmlWithCitations(
  html: string, 
  citations: Array<CitationAttrs | CitationData>
): string {
  if (!citations || citations.length === 0) return html;
  
  // Simple regex to find citation placeholders like [section 1, v4.]
  const citationRegex = /\[(.*?)\]/g;
  
  return html.replace(citationRegex, (match, reference) => {
    // Find matching citation by reference
    const citation = citations.find(c => {
      // Normalize the citation to access properties safely
      const normalized = normalizeCitation(c);
      return normalized.reference === reference || 
             normalized.customReference === reference;
    });
    
    if (!citation) return match; // Keep original if no match
    
    return serializeCitationToHtml(citation);
  });
}

/**
 * Extracts citation data from HTML content
 * FIXED: Now reads data-citation-type instead of hardcoding to 'reference'
 */
export function extractCitationsFromHtml(html: string): CitationAttrs[] {
  let doc: Document;

  if (typeof window !== 'undefined') {
    doc = new DOMParser().parseFromString(html, 'text/html');
  } else {
    // Server-side: use JSDOM (same approach as citation-utils.ts)
    const { JSDOM } = require('jsdom');
    doc = new JSDOM(html).window.document;
  }

  const citationEls = doc.querySelectorAll('[data-type="citation"]');

  return Array.from(citationEls).map(el => ({
    source_id: el.getAttribute('data-source-id') || '',
    source_title: el.getAttribute('data-source-title') || '',
    citation_type: el.getAttribute('data-citation-type') || 'reference',
    reference: el.getAttribute('data-reference') || '',
    page_number: el.getAttribute('data-page-number') || '',
    chapter_number: el.getAttribute('data-chapter-number')
      ? parseInt(el.getAttribute('data-chapter-number')!)
      : null,
    section_number: el.getAttribute('data-section-number')
      ? parseInt(el.getAttribute('data-section-number')!)
      : null,
    verse_number: el.getAttribute('data-verse-number') || '',
    daf_number: el.getAttribute('data-daf-number') || '',
    halacha_number: el.getAttribute('data-halacha-number')
      ? parseInt(el.getAttribute('data-halacha-number')!)
      : null,
    custom_reference: el.getAttribute('data-custom-reference') || '',
    url: el.getAttribute('data-url') || '',
    quote: el.getAttribute('data-quote') || '',
    note: el.getAttribute('data-note') || '',
  }));
}
