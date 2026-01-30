/**
 * Citation Serialization Round-Trip Tests
 *
 * These tests verify that citation_type is preserved through:
 * 1. CitationAttrs → HTML → CitationAttrs
 * 2. UnifiedCitation → HTML → UnifiedCitation
 * 3. Database → Editor → Database
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  serializeCitationToHtml,
  deserializeHtmlToCitation,
  extractCitationsFromHtml,
  editorCitationToSourceLink,
  sourceLinkToEditorCitation,
} from '../citationSerializer';
import { UnifiedCitation, CitationAttrs, CitationType } from '../types';

// Setup mock DOM environment for tests
beforeEach(() => {
  if (typeof window === 'undefined') {
    global.DOMParser = require('jsdom').JSDOM.fragment as any;
  }
});

describe('Citation Type Preservation', () => {
  describe('HTML Serialization Round-Trip', () => {
    const citationTypes: CitationType[] = [
      'page',
      'chapter',
      'verse',
      'daf',
      'halacha',
      'custom',
      'section',
      'reference',
    ];

    citationTypes.forEach(citationType => {
      it(`should preserve citation_type="${citationType}" through HTML round-trip`, () => {
        const original: CitationAttrs = {
          source_id: 123,
          source_title: 'Test Source',
          citation_type: citationType,
          reference: 'Test Reference',
        };

        // Serialize to HTML
        const html = serializeCitationToHtml(original);

        // Verify HTML contains data-citation-type attribute
        expect(html).toContain(`data-citation-type="${citationType}"`);

        // Deserialize back
        const deserialized = deserializeHtmlToCitation(html);

        // Verify citation_type is preserved
        expect(deserialized).not.toBeNull();
        expect(deserialized!.citation_type).toBe(citationType);
      });
    });

    it('should preserve all reference fields through HTML round-trip', () => {
      const original: CitationAttrs = {
        source_id: 456,
        source_title: 'Tanya',
        citation_type: 'chapter',
        chapter_number: 1,
        section_number: 4,
        page_number: '12',
        reference: 'Chapter 1, Section 4',
        verse_number: '5',
        daf_number: '2b',
        halacha_number: 3,
        custom_reference: 'Custom ref',
        quote: 'Test quote',
        note: 'Test note',
        url: 'https://example.com',
      };

      const html = serializeCitationToHtml(original);
      const deserialized = deserializeHtmlToCitation(html);

      expect(deserialized).not.toBeNull();
      expect(deserialized!.citation_type).toBe('chapter');
      expect(deserialized!.chapter_number).toBe(1);
      expect(deserialized!.section_number).toBe(4);
      expect(deserialized!.page_number).toBe('12');
      expect(deserialized!.verse_number).toBe('5');
      expect(deserialized!.daf_number).toBe('2b');
      expect(deserialized!.halacha_number).toBe(3);
      expect(deserialized!.custom_reference).toBe('Custom ref');
    });
  });

  describe('UnifiedCitation Round-Trip', () => {
    it('should preserve citation_type through UnifiedCitation serialization', () => {
      const unified: UnifiedCitation = {
        id: 'cite_test123',
        sourceId: 789,
        sourceTitle: 'Likutei Sichos',
        citationType: 'verse',
        verseNumber: '12:34',
        reference: 'Verse 12:34',
      };

      const html = serializeCitationToHtml(unified);
      const deserialized = deserializeHtmlToCitation(html);

      expect(deserialized).not.toBeNull();
      expect(deserialized!.citation_type).toBe('verse');
      expect(deserialized!.verse_number).toBe('12:34');
    });
  });

  describe('Extract Citations from HTML', () => {
    it('should extract multiple citations with correct types', () => {
      const html = `
        <p>This is a statement with citations:
          <span class="citation-ref" data-type="citation" data-citation-type="chapter" data-source-id="1" data-source-title="Source 1" data-chapter-number="5">[Source 1, ch. 5]</span>
          and another
          <span class="citation-ref" data-type="citation" data-citation-type="verse" data-source-id="2" data-source-title="Source 2" data-verse-number="10:20">[Source 2, 10:20]</span>
        </p>
      `;

      const citations = extractCitationsFromHtml(html);

      expect(citations).toHaveLength(2);
      expect(citations[0].citation_type).toBe('chapter');
      expect(citations[0].chapter_number).toBe(5);
      expect(citations[1].citation_type).toBe('verse');
      expect(citations[1].verse_number).toBe('10:20');
    });
  });

  describe('Database Round-Trip', () => {
    it('should preserve citation_type through database conversion', () => {
      const citation: CitationAttrs = {
        source_id: 999,
        source_title: 'Shulchan Aruch',
        citation_type: 'halacha',
        chapter_number: 3,
        halacha_number: 7,
        reference: '3:7',
      };

      // Convert to database format
      const sourceLink = editorCitationToSourceLink(citation, 1, 100);

      expect(sourceLink.source_id).toBe(999);
      expect(sourceLink.statement_id).toBe(1);
      expect(sourceLink.topic_id).toBe(100);

      // Convert back to editor format
      const source = {
        id: 999,
        title: 'Shulchan Aruch',
      };

      const restored = sourceLinkToEditorCitation(sourceLink, source, 'halacha');

      // Verify citation_type is preserved when explicitly provided
      expect(restored.citation_type).toBe('halacha');
    });

    it('should infer citation_type from reference fields when not provided', () => {
      const sourceLink = {
        id: 1,
        source_id: 123,
        relationship_type: 'references' as const,
        verse_reference: 'Genesis 1:1',
        statement_id: 1,
        topic_id: 100,
      };

      const source = {
        id: 123,
        title: 'Torah',
      };

      const citation = sourceLinkToEditorCitation(sourceLink, source);

      // Should infer 'verse' from verse_reference field
      expect(citation.citation_type).toBe('verse');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing citation_type with fallback to reference', () => {
      const html = `<span class="citation-ref" data-type="citation" data-source-id="1" data-source-title="Source">[Source]</span>`;

      const deserialized = deserializeHtmlToCitation(html);

      expect(deserialized).not.toBeNull();
      expect(deserialized!.citation_type).toBe('reference');
    });

    it('should handle empty citation_type with fallback', () => {
      const citation: CitationAttrs = {
        source_id: 1,
        source_title: 'Test',
        citation_type: '',
        reference: 'ref',
      };

      const html = serializeCitationToHtml(citation);
      const deserialized = deserializeHtmlToCitation(html);

      expect(deserialized).not.toBeNull();
      // Empty string should become 'reference' through normalization
      expect(deserialized!.citation_type).toBeTruthy();
    });

    it('should preserve statementId for statement-level citations', () => {
      const unified: UnifiedCitation = {
        sourceId: 1,
        sourceTitle: 'Test Source',
        citationType: 'page',
        pageNumber: '10',
        statementId: 42, // Statement-level citation
        topicId: 100,
      };

      // Verify statement vs topic level distinction
      const sourceLink = editorCitationToSourceLink(unified, unified.statementId, unified.topicId);

      expect(sourceLink.statement_id).toBe(42);
      expect(sourceLink.topic_id).toBe(100);
    });

    it('should handle topic-level sources (statementId null)', () => {
      const unified: UnifiedCitation = {
        sourceId: 1,
        sourceTitle: 'Test Source',
        citationType: 'page',
        pageNumber: '10',
        statementId: null, // Topic-level source
        topicId: 100,
      };

      const sourceLink = editorCitationToSourceLink(unified, unified.statementId, unified.topicId);

      expect(sourceLink.statement_id).toBeNull();
      expect(sourceLink.topic_id).toBe(100);
    });
  });

  describe('Type-Specific Reference Fields', () => {
    it('should preserve page citation details', () => {
      const citation: CitationAttrs = {
        source_id: 1,
        source_title: 'Book',
        citation_type: 'page',
        page_number: '42',
        reference: 'p. 42',
      };

      const html = serializeCitationToHtml(citation);
      const deserialized = deserializeHtmlToCitation(html);

      expect(deserialized!.citation_type).toBe('page');
      expect(deserialized!.page_number).toBe('42');
    });

    it('should preserve daf citation details', () => {
      const citation: CitationAttrs = {
        source_id: 1,
        source_title: 'Talmud',
        citation_type: 'daf',
        daf_number: '2b',
        reference: 'Daf 2b',
      };

      const html = serializeCitationToHtml(citation);
      const deserialized = deserializeHtmlToCitation(html);

      expect(deserialized!.citation_type).toBe('daf');
      expect(deserialized!.daf_number).toBe('2b');
    });

    it('should preserve custom citation details', () => {
      const citation: CitationAttrs = {
        source_id: 1,
        source_title: 'Custom Source',
        citation_type: 'custom',
        custom_reference: 'Section Alpha, Paragraph 3',
        reference: 'Section Alpha, Paragraph 3',
      };

      const html = serializeCitationToHtml(citation);
      const deserialized = deserializeHtmlToCitation(html);

      expect(deserialized!.citation_type).toBe('custom');
      expect(deserialized!.custom_reference).toBe('Section Alpha, Paragraph 3');
    });
  });
});

describe('Backwards Compatibility', () => {
  it('should handle legacy citations without citation_type attribute', () => {
    const legacyHtml = `<span class="citation-ref" data-type="citation" data-source-id="1" data-source-title="Old Source" data-reference="page 10">[Old Source]</span>`;

    const deserialized = deserializeHtmlToCitation(legacyHtml);

    expect(deserialized).not.toBeNull();
    expect(deserialized!.citation_type).toBe('reference'); // Fallback
    expect(deserialized!.source_title).toBe('Old Source');
  });

  it('should handle quotes relationship_type', () => {
    const sourceLink = {
      id: 1,
      source_id: 1,
      relationship_type: 'quotes' as const,
      page_number: '10',
      notes: 'Direct quote',
      statement_id: null,
      topic_id: 1,
    };

    const source = {
      id: 1,
      title: 'Source',
    };

    const citation = sourceLinkToEditorCitation(sourceLink, source);

    // Should infer from page_number presence
    expect(citation.citation_type).toBe('page');
  });
});
