/**
 * Citation Serialization System
 * 
 * This module provides bidirectional conversion between:
 * 1. Editor citation nodes (TipTap/ProseMirror format)
 * 2. Database records (Directus source_links format)
 * 3. Frontend display format (HTML with data attributes)
 */

import { CitationAttrs } from '@/components/editor/plugins/citations/comprehensiveCitationPlugin';
import { CitationData } from '@/components/editor/extensions/AdvancedCitation';

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

// Create unified type for citation data that combines both formats
export type UnifiedCitation = {
  sourceId: number | string | null;
  sourceTitle: string;
  reference?: string | null;
  pageNumber?: string | null;
  verseNumber?: string | null;
  quote?: string | null;
  note?: string | null;
  url?: string | null;
  customReference?: string | null;
};

/**
 * Normalize citation data from either format to unified format
 */
function normalizeCitation(citation: CitationAttrs | CitationData): UnifiedCitation {
  // Type guard for CitationData
  const isCitationData = (c: any): c is CitationData => {
    return 'sourceId' in c && 'sourceTitle' in c;
  };

  // Type guard for CitationAttrs
  const isCitationAttrs = (c: any): c is CitationAttrs => {
    return 'source_id' in c && 'source_title' in c;
  };

  if (isCitationData(citation)) {
    // It's CitationData format
    return {
      sourceId: citation.sourceId || null,
      sourceTitle: citation.sourceTitle,
      reference: citation.reference || null,
      pageNumber: citation.page ? citation.page.toString() : null,
      verseNumber: citation.verse || null,
      url: citation.url || null
    };
  } else if (isCitationAttrs(citation)) {
    // It's CitationAttrs format
    return {
      sourceId: citation.source_id ?? null,
      sourceTitle: citation.source_title || 'Unknown Source',
      reference: citation.reference || null,
      pageNumber: citation.page_number || null,
      verseNumber: citation.verse_number || null,
      quote: citation.quote || null,
      note: citation.note || null,
      url: citation.url || null,
      customReference: citation.custom_reference || null
    };
  } else {
    // Fallback for unexpected format
    throw new Error('Invalid citation format');
  }
}

/**
 * Converts editor citation data to database source_link format
 */
export function editorCitationToSourceLink(
  citation: CitationAttrs | CitationData,
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
 */
export function sourceLinkToEditorCitation(
  sourceLink: SourceLink, 
  source: Source
): CitationAttrs {
  return {
    source_id: sourceLink.source_id,
    source_title: source.title,
    citation_type: sourceLink.relationship_type === 'quotes' ? 'quote' : 'reference',
    page_number: sourceLink.page_number ?? undefined,
    reference: sourceLink.section_reference || '',
    verse_number: sourceLink.verse_reference ?? undefined,
    note: sourceLink.notes ?? undefined,
    url: source.external_url ?? undefined,
  };
}

/**
 * Serializes citation to HTML format with data attributes
 */
export function serializeCitationToHtml(citation: CitationAttrs | CitationData): string {
  const normalized = normalizeCitation(citation);
  const citationId = `cite_${Math.random().toString(36).substring(2, 12)}`;
  const displayText = normalized.reference || 
    (normalized.sourceTitle ? normalized.sourceTitle.slice(0, 15) : '†');

  return `<span 
    class="citation-ref" 
    data-type="citation"
    data-citation-id="${citationId}"
    data-source-id="${normalized.sourceId || ''}"
    data-source-title="${normalized.sourceTitle || ''}"
    data-reference="${normalized.reference || ''}"
    ${normalized.pageNumber ? `data-page-number="${normalized.pageNumber}"` : ''}
    ${normalized.verseNumber ? `data-verse-number="${normalized.verseNumber}"` : ''}
    ${normalized.url ? `data-url="${normalized.url}"` : ''}
    ${normalized.quote ? `data-quote="${normalized.quote}"` : ''}
    ${normalized.note ? `data-note="${normalized.note}"` : ''}
  >[${displayText}]</span>`;
}

/**
 * Deserializes HTML citation to citation data object
 */
export function deserializeHtmlToCitation(html: string): CitationAttrs | null {
  if (typeof window === 'undefined') {
    console.warn('deserializeHtmlToCitation called in server context');
    return null;
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const citationEl = doc.querySelector('[data-type="citation"]');
  
  if (!citationEl) return null;
  
  return {
    source_id: citationEl.getAttribute('data-source-id') || '',
    source_title: citationEl.getAttribute('data-source-title') || '',
    citation_type: 'reference',
    reference: citationEl.getAttribute('data-reference') || '',
    page_number: citationEl.getAttribute('data-page-number') || '',
    verse_number: citationEl.getAttribute('data-verse-number') || '',
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
 */
export function extractCitationsFromHtml(html: string): CitationAttrs[] {
  // Use a safer approach for browser vs server environments
  if (typeof window === 'undefined') {
    // Server-side: can't use DOMParser
    // Return empty array or use a server-side HTML parser if needed
    console.warn('extractCitationsFromHtml called in server context');
    return [];
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const citationEls = doc.querySelectorAll('[data-type="citation"]');
  
  return Array.from(citationEls).map(el => ({
    source_id: el.getAttribute('data-source-id') || '',
    source_title: el.getAttribute('data-source-title') || '',
    citation_type: 'reference',
    reference: el.getAttribute('data-reference') || '',
    page_number: el.getAttribute('data-page-number') || '',
    verse_number: el.getAttribute('data-verse-number') || '',
    url: el.getAttribute('data-url') || '',
    quote: el.getAttribute('data-quote') || '',
    note: el.getAttribute('data-note') || '',
  }));
}
