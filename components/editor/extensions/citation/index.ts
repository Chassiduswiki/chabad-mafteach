/**
 * Citation Extension Module
 *
 * Exports the unified citation extension and related types
 */

export { UnifiedCitationNode as CitationExtension, citationPluginKey } from './CitationExtension';
export type { UnifiedCitationOptions } from './CitationExtension';

// Re-export citation types for convenience
export type {
  UnifiedCitation,
  CitationAttrs,
  CitationData,
  CitationSuggestion,
  CitationType,
  RelationshipType,
} from '@/lib/citations/types';

export {
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
} from '@/lib/citations/types';
