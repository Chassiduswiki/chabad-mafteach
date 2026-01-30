/**
 * Citation Type System Tests
 *
 * Tests for type converters, type guards, and utility functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  UnifiedCitation,
  CitationAttrs,
  CitationData,
  CitationSuggestion,
  CitationType,
  isUnifiedCitation,
  isCitationAttrs,
  isCitationData,
  isCitationSuggestion,
  attrsToUnified,
  unifiedToAttrs,
  dataToUnified,
  unifiedToData,
  suggestionToUnified,
  unifiedToSuggestion,
  toUnified,
  normalizeCitationType,
  formatCitationReference,
  isStatementLevel,
  isTopicLevel,
  getCitationContext,
} from '../types';

describe('Type Guards', () => {
  it('should identify UnifiedCitation', () => {
    const unified: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Test',
      citationType: 'page',
    };

    expect(isUnifiedCitation(unified)).toBe(true);
    expect(isCitationAttrs(unified)).toBe(false);
    expect(isCitationData(unified)).toBe(false);
    expect(isCitationSuggestion(unified)).toBe(false);
  });

  it('should identify CitationAttrs', () => {
    const attrs: CitationAttrs = {
      source_id: 1,
      source_title: 'Test',
      citation_type: 'page',
    };

    expect(isUnifiedCitation(attrs)).toBe(false);
    expect(isCitationAttrs(attrs)).toBe(true);
  });

  it('should identify CitationData', () => {
    const data: CitationData = {
      id: 'cite_123',
      sourceTitle: 'Test',
      reference: 'p. 10',
    };

    expect(isUnifiedCitation(data)).toBe(false);
    expect(isCitationData(data)).toBe(true);
  });

  it('should identify CitationSuggestion', () => {
    const suggestion: CitationSuggestion = {
      id: 'cite_123',
      sourceId: 1,
      sourceTitle: 'Test',
      reference: 'p. 10',
      relevanceScore: 0.85,
    };

    expect(isUnifiedCitation(suggestion)).toBe(false);
    expect(isCitationSuggestion(suggestion)).toBe(true);
  });
});

describe('Type Converters', () => {
  describe('CitationAttrs Conversion', () => {
    it('should convert CitationAttrs to UnifiedCitation', () => {
      const attrs: CitationAttrs = {
        source_id: 123,
        source_title: 'Tanya',
        citation_type: 'chapter',
        chapter_number: 5,
        section_number: 2,
        reference: 'Chapter 5, Section 2',
      };

      const unified = attrsToUnified(attrs);

      expect(unified.sourceId).toBe(123);
      expect(unified.sourceTitle).toBe('Tanya');
      expect(unified.citationType).toBe('chapter');
      expect(unified.chapterNumber).toBe(5);
      expect(unified.sectionNumber).toBe(2);
    });

    it('should convert UnifiedCitation to CitationAttrs', () => {
      const unified: UnifiedCitation = {
        sourceId: 456,
        sourceTitle: 'Likutei Sichos',
        citationType: 'verse',
        verseNumber: '10:20',
      };

      const attrs = unifiedToAttrs(unified);

      expect(attrs.source_id).toBe(456);
      expect(attrs.source_title).toBe('Likutei Sichos');
      expect(attrs.citation_type).toBe('verse');
      expect(attrs.verse_number).toBe('10:20');
    });

    it('should preserve all fields in round-trip conversion', () => {
      const original: CitationAttrs = {
        source_id: 1,
        source_title: 'Test',
        citation_type: 'halacha',
        chapter_number: 3,
        halacha_number: 7,
        quote: 'Test quote',
        note: 'Test note',
        url: 'https://example.com',
      };

      const unified = attrsToUnified(original);
      const restored = unifiedToAttrs(unified);

      expect(restored.citation_type).toBe('halacha');
      expect(restored.chapter_number).toBe(3);
      expect(restored.halacha_number).toBe(7);
      expect(restored.quote).toBe('Test quote');
      expect(restored.note).toBe('Test note');
      expect(restored.url).toBe('https://example.com');
    });
  });

  describe('CitationData Conversion', () => {
    it('should convert CitationData to UnifiedCitation', () => {
      const data: CitationData = {
        id: 'cite_abc',
        sourceId: '789',
        sourceTitle: 'Test Source',
        reference: 'p. 42',
        page: 42,
        verse: '1:1',
        url: 'https://example.com',
      };

      const unified = dataToUnified(data);

      expect(unified.id).toBe('cite_abc');
      expect(unified.sourceId).toBe('789');
      expect(unified.sourceTitle).toBe('Test Source');
      expect(unified.reference).toBe('p. 42');
      expect(unified.pageNumber).toBe('42');
      expect(unified.verseNumber).toBe('1:1');
      expect(unified.url).toBe('https://example.com');
    });

    it('should convert UnifiedCitation to CitationData', () => {
      const unified: UnifiedCitation = {
        id: 'cite_xyz',
        sourceId: 999,
        sourceTitle: 'Test',
        citationType: 'page',
        reference: 'p. 10',
        pageNumber: '10',
      };

      const data = unifiedToData(unified);

      expect(data.id).toBe('cite_xyz');
      expect(data.sourceId).toBe('999');
      expect(data.sourceTitle).toBe('Test');
      expect(data.reference).toBe('p. 10');
      expect(data.page).toBe(10);
    });
  });

  describe('CitationSuggestion Conversion', () => {
    it('should convert CitationSuggestion to UnifiedCitation', () => {
      const suggestion: CitationSuggestion = {
        id: 'cite_ai',
        sourceId: 555,
        sourceTitle: 'AI Suggested Source',
        reference: 'Chapter 3',
        relevanceScore: 0.92,
        quote: 'Suggested quote',
        url: 'https://source.com',
      };

      const unified = suggestionToUnified(suggestion);

      expect(unified.id).toBe('cite_ai');
      expect(unified.sourceId).toBe(555);
      expect(unified.sourceTitle).toBe('AI Suggested Source');
      expect(unified.reference).toBe('Chapter 3');
      expect(unified.relevanceScore).toBe(0.92);
      expect(unified.quote).toBe('Suggested quote');
    });

    it('should convert UnifiedCitation to CitationSuggestion', () => {
      const unified: UnifiedCitation = {
        id: 'cite_test',
        sourceId: 777,
        sourceTitle: 'Test Source',
        citationType: 'page',
        reference: 'p. 50',
        relevanceScore: 0.88,
      };

      const suggestion = unifiedToSuggestion(unified);

      expect(suggestion.id).toBe('cite_test');
      expect(suggestion.sourceId).toBe(777);
      expect(suggestion.sourceTitle).toBe('Test Source');
      expect(suggestion.reference).toBe('p. 50');
      expect(suggestion.relevanceScore).toBe(0.88);
    });
  });

  describe('Auto-Conversion (toUnified)', () => {
    it('should auto-convert CitationAttrs', () => {
      const attrs: CitationAttrs = {
        source_id: 1,
        source_title: 'Test',
        citation_type: 'page',
      };

      const unified = toUnified(attrs);

      expect(unified.sourceId).toBe(1);
      expect(unified.citationType).toBe('page');
    });

    it('should auto-convert CitationData', () => {
      const data: CitationData = {
        id: 'cite_1',
        sourceTitle: 'Test',
        reference: 'ref',
      };

      const unified = toUnified(data);

      expect(unified.sourceTitle).toBe('Test');
    });

    it('should auto-convert CitationSuggestion', () => {
      const suggestion: CitationSuggestion = {
        id: 'cite_1',
        sourceId: 1,
        sourceTitle: 'Test',
        reference: 'ref',
        relevanceScore: 0.5,
      };

      const unified = toUnified(suggestion);

      expect(unified.relevanceScore).toBe(0.5);
    });

    it('should pass through UnifiedCitation unchanged', () => {
      const unified: UnifiedCitation = {
        sourceId: 1,
        sourceTitle: 'Test',
        citationType: 'page',
      };

      const result = toUnified(unified);

      expect(result).toBe(unified);
    });

    it('should throw error for unknown format', () => {
      const invalid = { unknown: 'format' };

      expect(() => toUnified(invalid as any)).toThrow('Unknown citation format');
    });
  });
});

describe('Citation Type Normalization', () => {
  it('should normalize valid citation types', () => {
    expect(normalizeCitationType('page')).toBe('page');
    expect(normalizeCitationType('chapter')).toBe('chapter');
    expect(normalizeCitationType('verse')).toBe('verse');
    expect(normalizeCitationType('daf')).toBe('daf');
    expect(normalizeCitationType('halacha')).toBe('halacha');
    expect(normalizeCitationType('custom')).toBe('custom');
    expect(normalizeCitationType('section')).toBe('section');
  });

  it('should normalize case variations', () => {
    expect(normalizeCitationType('PAGE')).toBe('page');
    expect(normalizeCitationType('Chapter')).toBe('chapter');
    expect(normalizeCitationType('VERSE')).toBe('verse');
  });

  it('should normalize reference variations', () => {
    expect(normalizeCitationType('reference')).toBe('reference');
    expect(normalizeCitationType('references')).toBe('reference');
  });

  it('should fallback to reference for unknown types', () => {
    expect(normalizeCitationType('unknown')).toBe('reference');
    expect(normalizeCitationType('invalid')).toBe('reference');
    expect(normalizeCitationType('')).toBe('reference');
  });
});

describe('Citation Reference Formatting', () => {
  it('should format page citations', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Book Title',
      citationType: 'page',
      pageNumber: '42',
    };

    expect(formatCitationReference(citation)).toBe('Book Title p. 42');
  });

  it('should format chapter citations', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Tanya',
      citationType: 'chapter',
      chapterNumber: 5,
    };

    expect(formatCitationReference(citation)).toBe('Tanya ch. 5');
  });

  it('should format chapter with section', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Tanya',
      citationType: 'chapter',
      chapterNumber: 5,
      sectionNumber: 2,
    };

    expect(formatCitationReference(citation)).toBe('Tanya ch. 5:2');
  });

  it('should format verse citations', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Torah',
      citationType: 'verse',
      verseNumber: 'Genesis 1:1',
    };

    expect(formatCitationReference(citation)).toBe('Torah Genesis 1:1');
  });

  it('should format daf citations', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Talmud',
      citationType: 'daf',
      dafNumber: '2b',
    };

    expect(formatCitationReference(citation)).toBe('Talmud 2b');
  });

  it('should format halacha citations', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Shulchan Aruch',
      citationType: 'halacha',
      chapterNumber: 3,
      halachaNumber: 7,
    };

    expect(formatCitationReference(citation)).toBe('Shulchan Aruch 3:7');
  });

  it('should format custom citations', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Custom Work',
      citationType: 'custom',
      customReference: 'Section Alpha, Part 3',
    };

    expect(formatCitationReference(citation)).toBe('Custom Work Section Alpha, Part 3');
  });

  it('should fallback to reference field', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Source',
      citationType: 'reference',
      reference: 'Custom Reference',
    };

    expect(formatCitationReference(citation)).toBe('Source Custom Reference');
  });

  it('should handle missing reference details', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Bare Source',
      citationType: 'page',
    };

    expect(formatCitationReference(citation)).toBe('Bare Source');
  });
});

describe('Statement vs Topic Level', () => {
  it('should identify statement-level citations', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Test',
      citationType: 'page',
      statementId: 42,
    };

    expect(isStatementLevel(citation)).toBe(true);
    expect(isTopicLevel(citation)).toBe(false);
  });

  it('should identify topic-level sources', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Test',
      citationType: 'page',
      statementId: null,
    };

    expect(isStatementLevel(citation)).toBe(false);
    expect(isTopicLevel(citation)).toBe(true);
  });

  it('should treat undefined statementId as topic-level', () => {
    const citation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Test',
      citationType: 'page',
    };

    expect(isStatementLevel(citation)).toBe(false);
    expect(isTopicLevel(citation)).toBe(true);
  });

  it('should get correct citation context', () => {
    const statementCitation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Test',
      citationType: 'page',
      statementId: 10,
    };

    const topicCitation: UnifiedCitation = {
      sourceId: 1,
      sourceTitle: 'Test',
      citationType: 'page',
      statementId: null,
    };

    const stmtContext = getCitationContext(statementCitation);
    const topicContext = getCitationContext(topicCitation);

    expect(stmtContext.isStatementLevel).toBe(true);
    expect(stmtContext.contextLabel).toBe('Statement Citation');

    expect(topicContext.isStatementLevel).toBe(false);
    expect(topicContext.contextLabel).toBe('Topic Source');
  });
});

describe('Edge Cases', () => {
  it('should handle null values gracefully', () => {
    const citation: UnifiedCitation = {
      sourceId: null,
      sourceTitle: 'Test',
      citationType: 'page',
      pageNumber: null,
      reference: null,
    };

    const formatted = formatCitationReference(citation);
    expect(formatted).toBe('Test');
  });

  it('should handle numeric string source IDs', () => {
    const attrs: CitationAttrs = {
      source_id: '123',
      source_title: 'Test',
      citation_type: 'page',
    };

    const unified = attrsToUnified(attrs);
    expect(unified.sourceId).toBe('123');
  });

  it('should preserve zero values', () => {
    const citation: UnifiedCitation = {
      sourceId: 0,
      sourceTitle: 'Test',
      citationType: 'chapter',
      chapterNumber: 0,
      sectionNumber: 0,
    };

    const attrs = unifiedToAttrs(citation);
    expect(attrs.chapter_number).toBe(0);
    expect(attrs.section_number).toBe(0);
  });
});
