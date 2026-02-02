/**
 * Utility functions for handling citation references between the editor,
 * database, and frontend rendering
 */

import { nanoid } from 'nanoid';

/**
 * Generate a unique citation ID
 * @returns A unique string ID for a citation
 */
export function generateCitationId(): string {
  return `cite_${nanoid(10)}`;
}

/**
 * Citation reference data structure
 */
export interface CitationReference {
  id: string;
  sourceId: string | number;
  sourceTitle: string;
  reference?: string;
  pageNumber?: string;
  chapterNumber?: number;
  sectionNumber?: number;
  verseNumber?: string;
  dafNumber?: string;
  halachaNumber?: number;
  customReference?: string;
}

/**
 * Parse HTML content for citation reference spans and plain text citations
 * @param htmlContent The HTML content to parse
 * @returns Array of citation references found in the content
 */
export function extractCitationReferences(htmlContent: string): CitationReference[] {
  // Use JSDOM to parse HTML properly (runs on server side only)
  if (typeof window === 'undefined') {
    // Only import JSDOM on the server
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    console.log('Extracting citations from HTML:', htmlContent.substring(0, 300));

    // Find all citation reference spans (from TipTap editor)
    const citationSpans = document.querySelectorAll('span.citation-ref, span[data-citation-id], span[data-type="citation"]');
    const citations: CitationReference[] = [];

    console.log('Found citation spans:', citationSpans.length);

    citationSpans.forEach((span: Element, index: number) => {
      console.log(`Processing span ${index}:`, span.outerHTML);
      
      const citation: CitationReference = {
        id: span.getAttribute('data-citation-id') || generateCitationId(),
        sourceId: span.getAttribute('data-source-id') || '',
        sourceTitle: span.getAttribute('data-source-title') || span.textContent?.replace(/^\[|\]$/g, '') || 'Unknown Source',
        reference: span.getAttribute('data-reference') || undefined,
        pageNumber: span.getAttribute('data-page-number') || undefined,
        chapterNumber: span.getAttribute('data-chapter-number') ?
          parseInt(span.getAttribute('data-chapter-number')!, 10) : undefined,
        sectionNumber: span.getAttribute('data-section-number') ?
          parseInt(span.getAttribute('data-section-number')!, 10) : undefined,
        verseNumber: span.getAttribute('data-verse-number') || undefined,
        dafNumber: span.getAttribute('data-daf-number') || undefined,
        halachaNumber: span.getAttribute('data-halacha-number') ?
          parseInt(span.getAttribute('data-halacha-number')!, 10) : undefined,
        customReference: span.getAttribute('data-custom-reference') || undefined,
      };

      console.log(`Extracted citation ${index}:`, citation);
      citations.push(citation);
    });

    // Also extract plain text citations in brackets [Source, p. 23]
    // This catches citations that haven't been converted to citation nodes yet
    const textContent = document.body.textContent || '';
    const bracketRegex = /\[([^\]]+)\]/g;
    let match;

    while ((match = bracketRegex.exec(textContent)) !== null) {
      const citationText = match[1];

      // Skip if this looks like it's just a number or very short text (likely not a citation)
      if (citationText.length < 3 || /^\d+$/.test(citationText)) {
        continue;
      }

      // Check if we already have a citation with this exact text (avoid duplicates)
      const isDuplicate = citations.some(c =>
        c.sourceTitle === citationText || c.reference === citationText
      );

      if (!isDuplicate) {
        citations.push({
          id: generateCitationId(),
          sourceId: '',
          sourceTitle: citationText,
          reference: citationText,
        });
      }
    }

    return citations;
  } else {
    // Fallback for client-side (should not be used)
    console.warn('extractCitationReferences should only be used on the server');
    return [];
  }
}

/**
 * Creates a citation map object from an array of citation references
 * @param citations Array of citation references
 * @returns Object mapping citation IDs to citation data
 */
export function createCitationMap(citations: CitationReference[]): Record<string, CitationReference> {
  return citations.reduce((map, citation) => {
    map[citation.id] = citation;
    return map;
  }, {} as Record<string, CitationReference>);
}
