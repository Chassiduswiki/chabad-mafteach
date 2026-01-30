/**
 * Unified Citation Type System
 *
 * This module provides a single source of truth for citation types across the application.
 * It consolidates the previously fragmented types:
 * - CitationAttrs (legacy format)
 * - CitationData (unified citation format)
 * - CitationSuggestion (from SmartCitationExtension)
 * - CitationReference (legacy)
 *
 * CRITICAL: Preserves the semantic distinction between:
 * - Statement-level citations: statementId NOT NULL (backs specific statements)
 * - Topic-level sources: statementId NULL (broader research references)
 */

// ============================================================================
// CORE UNIFIED TYPE
// ============================================================================

export type CitationType =
  | 'page'
  | 'chapter'
  | 'verse'
  | 'daf'
  | 'halacha'
  | 'custom'
  | 'section'
  | 'reference'; // Legacy support

export type RelationshipType =
  | 'references'
  | 'quotes'
  | 'paraphrases'
  | 'supports'
  | 'contradicts';

/**
 * Unified citation interface that works across editor, database, and UI layers
 */
export interface UnifiedCitation {
  // Identity
  id?: string; // Editor-level ID (e.g., "cite_abc123")
  linkId?: number; // Database source_links.id

  // Source reference
  sourceId: number | string | null;
  sourceTitle: string;

  // Citation type and reference details
  citationType: CitationType;
  reference?: string | null; // Formatted reference text (e.g., "Chapter 1, Section 4")

  // CRITICAL: Preserves statement vs topic-level distinction
  statementId?: number | null; // NULL = topic-level source, SET = statement-level citation
  topicId?: number | null;

  // Type-specific reference fields
  pageNumber?: string | null;
  chapterNumber?: number | null;
  sectionNumber?: number | null;
  verseNumber?: string | null;
  dafNumber?: string | null;
  halachaNumber?: number | null;
  customReference?: string | null;

  // Additional metadata
  quote?: string | null; // Quoted text from source
  note?: string | null; // Editor's note about this citation
  url?: string | null; // Direct link to source
  relationshipType?: RelationshipType;
  confidenceLevel?: 'low' | 'medium' | 'high' | null;

  // AI suggestion metadata (when applicable)
  relevanceScore?: number;
}

// ============================================================================
// LEGACY TYPE ALIASES (DEPRECATED - Use UnifiedCitation)
// ============================================================================

/** @deprecated Use UnifiedCitation instead */
export interface CitationAttrs {
  source_id: number | string | null;
  source_title: string;
  citation_type: string;
  page_number?: string;
  chapter_number?: number | null;
  section_number?: number | null;
  daf_number?: string;
  halacha_number?: number | null;
  verse_number?: string;
  custom_reference?: string;
  reference?: string;
  quote?: string;
  note?: string;
  url?: string;
}

/** @deprecated Use UnifiedCitation instead */
export interface CitationData {
  id: string;
  sourceId?: string;
  sourceTitle: string;
  reference: string;
  url?: string;
  page?: number;
  verse?: string;
}

/** @deprecated Use UnifiedCitation instead */
export interface CitationSuggestion {
  id: string;
  sourceId: string | number;
  sourceTitle: string;
  reference: string;
  relevanceScore: number;
  quote?: string;
  url?: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isUnifiedCitation(obj: any): obj is UnifiedCitation {
  return (
    obj &&
    typeof obj === 'object' &&
    'sourceTitle' in obj &&
    'citationType' in obj
  );
}

export function isCitationAttrs(obj: any): obj is CitationAttrs {
  return (
    obj &&
    typeof obj === 'object' &&
    'source_title' in obj &&
    'citation_type' in obj
  );
}

export function isCitationData(obj: any): obj is CitationData {
  return (
    obj &&
    typeof obj === 'object' &&
    'sourceTitle' in obj &&
    'reference' in obj &&
    !('citationType' in obj)
  );
}

export function isCitationSuggestion(obj: any): obj is CitationSuggestion {
  return (
    obj &&
    typeof obj === 'object' &&
    'relevanceScore' in obj &&
    'sourceTitle' in obj
  );
}

// ============================================================================
// TYPE CONVERTERS
// ============================================================================

/**
 * Converts CitationAttrs (snake_case) to UnifiedCitation
 */
export function attrsToUnified(attrs: CitationAttrs): UnifiedCitation {
  return {
    sourceId: attrs.source_id,
    sourceTitle: attrs.source_title,
    citationType: normalizeCitationType(attrs.citation_type),
    reference: attrs.reference || null,
    pageNumber: attrs.page_number || null,
    chapterNumber: attrs.chapter_number || null,
    sectionNumber: attrs.section_number || null,
    verseNumber: attrs.verse_number || null,
    dafNumber: attrs.daf_number || null,
    halachaNumber: attrs.halacha_number || null,
    customReference: attrs.custom_reference || null,
    quote: attrs.quote || null,
    note: attrs.note || null,
    url: attrs.url || null,
  };
}

/**
 * Converts UnifiedCitation to CitationAttrs (for backwards compatibility)
 */
export function unifiedToAttrs(citation: UnifiedCitation): CitationAttrs {
  return {
    source_id: citation.sourceId,
    source_title: citation.sourceTitle,
    citation_type: citation.citationType,
    reference: citation.reference || undefined,
    page_number: citation.pageNumber || undefined,
    chapter_number: citation.chapterNumber || null,
    section_number: citation.sectionNumber || null,
    daf_number: citation.dafNumber || undefined,
    halacha_number: citation.halachaNumber || null,
    verse_number: citation.verseNumber || undefined,
    custom_reference: citation.customReference || undefined,
    quote: citation.quote || undefined,
    note: citation.note || undefined,
    url: citation.url || undefined,
  };
}

/**
 * Converts CitationData to UnifiedCitation
 */
export function dataToUnified(data: CitationData): UnifiedCitation {
  return {
    id: data.id,
    sourceId: data.sourceId || null,
    sourceTitle: data.sourceTitle,
    citationType: 'reference', // CitationData doesn't specify type
    reference: data.reference,
    pageNumber: data.page?.toString() || null,
    verseNumber: data.verse || null,
    url: data.url || null,
  };
}

/**
 * Converts UnifiedCitation to CitationData (for backwards compatibility)
 */
export function unifiedToData(citation: UnifiedCitation): CitationData {
  return {
    id: citation.id || `cite_${Math.random().toString(36).substring(2, 12)}`,
    sourceId: citation.sourceId?.toString(),
    sourceTitle: citation.sourceTitle,
    reference: citation.reference || '',
    url: citation.url || undefined,
    page: citation.pageNumber ? parseInt(citation.pageNumber) : undefined,
    verse: citation.verseNumber || undefined,
  };
}

/**
 * Converts CitationSuggestion to UnifiedCitation
 */
export function suggestionToUnified(suggestion: CitationSuggestion): UnifiedCitation {
  return {
    id: suggestion.id,
    sourceId: suggestion.sourceId,
    sourceTitle: suggestion.sourceTitle,
    citationType: 'reference', // Suggestions don't specify type
    reference: suggestion.reference,
    quote: suggestion.quote || null,
    url: suggestion.url || null,
    relevanceScore: suggestion.relevanceScore,
  };
}

/**
 * Converts UnifiedCitation to CitationSuggestion (for AI suggestions)
 */
export function unifiedToSuggestion(citation: UnifiedCitation): CitationSuggestion {
  return {
    id: citation.id || `cite_${Math.random().toString(36).substring(2, 12)}`,
    sourceId: citation.sourceId || '',
    sourceTitle: citation.sourceTitle,
    reference: citation.reference || '',
    relevanceScore: citation.relevanceScore || 0,
    quote: citation.quote || undefined,
    url: citation.url || undefined,
  };
}

/**
 * Auto-convert from any legacy citation format to UnifiedCitation
 */
export function toUnified(
  citation: UnifiedCitation | CitationAttrs | CitationData | CitationSuggestion
): UnifiedCitation {
  if (isUnifiedCitation(citation)) {
    return citation;
  }
  if (isCitationAttrs(citation)) {
    return attrsToUnified(citation);
  }
  if (isCitationSuggestion(citation)) {
    return suggestionToUnified(citation);
  }
  if (isCitationData(citation)) {
    return dataToUnified(citation);
  }
  throw new Error('Unknown citation format');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalizes citation type strings to valid CitationType
 */
export function normalizeCitationType(type: string): CitationType {
  const normalized = type.toLowerCase();

  switch (normalized) {
    case 'page':
    case 'chapter':
    case 'verse':
    case 'daf':
    case 'halacha':
    case 'custom':
    case 'section':
      return normalized as CitationType;
    case 'reference':
    case 'references':
      return 'reference';
    default:
      console.warn(`Unknown citation type: ${type}, defaulting to 'reference'`);
      return 'reference';
  }
}

/**
 * Formats a citation reference based on type
 * Handles null/undefined values gracefully
 */
export function formatCitationReference(citation: UnifiedCitation): string {
  const { citationType, sourceTitle } = citation;

  // Handle missing source title
  if (!sourceTitle || sourceTitle.trim() === '') {
    return 'Unknown Source';
  }

  let ref = '';

  // Handle null/undefined citationType
  const type = citationType || 'custom';

  switch (type) {
    case 'page':
      ref = citation.pageNumber ? ` p. ${citation.pageNumber}` : '';
      break;
    case 'chapter':
      if (citation.chapterNumber) {
        ref = ` ch. ${citation.chapterNumber}`;
        if (citation.sectionNumber) {
          ref += `:${citation.sectionNumber}`;
        }
      }
      break;
    case 'section':
      if (citation.sectionNumber) {
        ref = citation.chapterNumber
          ? ` ch. ${citation.chapterNumber}, §${citation.sectionNumber}`
          : ` §${citation.sectionNumber}`;
      }
      break;
    case 'daf':
      ref = citation.dafNumber ? ` ${citation.dafNumber}` : '';
      break;
    case 'verse':
      ref = citation.verseNumber ? ` ${citation.verseNumber}` : '';
      break;
    case 'halacha':
      if (citation.halachaNumber) {
        ref = citation.chapterNumber
          ? ` ${citation.chapterNumber}:${citation.halachaNumber}`
          : ` ${citation.halachaNumber}`;
      }
      break;
    case 'custom':
      ref = citation.customReference ? ` ${citation.customReference}` : '';
      break;
    default:
      // Fallback to reference field if present
      ref = citation.reference ? ` ${citation.reference}` : '';
  }

  return `${sourceTitle}${ref}`;
}

/**
 * Checks if citation is statement-level (vs topic-level)
 */
export function isStatementLevel(citation: UnifiedCitation): boolean {
  return citation.statementId !== null && citation.statementId !== undefined;
}

/**
 * Checks if citation is topic-level (vs statement-level)
 */
export function isTopicLevel(citation: UnifiedCitation): boolean {
  return !isStatementLevel(citation);
}

/**
 * Gets display context for UI
 */
export function getCitationContext(citation: UnifiedCitation): {
  isStatementLevel: boolean;
  contextLabel: string;
} {
  const isStmt = isStatementLevel(citation);
  return {
    isStatementLevel: isStmt,
    contextLabel: isStmt ? 'Statement Citation' : 'Topic Source',
  };
}
