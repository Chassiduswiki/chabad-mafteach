# Citation System Documentation

## Overview

The citation system provides a unified architecture for managing scholarly citations across the editor, database, and frontend. This document describes the refactored system that consolidates previously fragmented components.

## Key Concepts

### Unified Type System

All citation data now flows through a single `UnifiedCitation` type defined in `lib/citations/types.ts`. This eliminates data loss bugs and inconsistencies that occurred when converting between different citation formats.

```typescript
interface UnifiedCitation {
  // Identity
  id?: string;              // Editor-level ID
  linkId?: number;          // Database source_links.id

  // Source reference
  sourceId: number | string | null;
  sourceTitle: string;

  // Citation type and details
  citationType: CitationType;  // 'page' | 'chapter' | 'verse' | 'daf' | 'halacha' | 'custom' | 'section'

  // CRITICAL: Statement vs Topic distinction
  statementId?: number | null;  // NULL = topic-level, SET = statement-level
  topicId?: number | null;

  // Type-specific fields
  pageNumber?: string;
  chapterNumber?: number;
  // ... (see types.ts for full interface)
}
```

### Statement vs Topic Level Citations

**This is a critical semantic distinction preserved throughout the system:**

- **Statement-level citations** (`statementId` NOT NULL): Specific references that back individual statements
- **Topic-level sources** (`statementId` NULL): Broader sources for further research

This distinction is maintained through:

1. **Database schema**: `source_links.statement_id` field
2. **Type system**: `statementId` field in UnifiedCitation
3. **Serialization**: Preserved through HTML round-trips
4. **UI**: Context-aware display and editing

```typescript
// Check citation level
isStatementLevel(citation)  // true if statementId is set
isTopicLevel(citation)      // true if statementId is null/undefined

// Get context for UI
const { isStatementLevel, contextLabel } = getCitationContext(citation);
// contextLabel: "Statement Citation" or "Topic Source"
```

## Architecture

### Data Flow

```
User Input → Editor (TipTap) → UnifiedCitation
                                      ↓
                           HTML Serialization
                                      ↓
                              Database (Directus)
                                      ↓
                                source_links table
                                      ↓
                              API Response
                                      ↓
                           Frontend Display
```

### Type Converters

The system provides automatic conversion between legacy formats:

```typescript
// Legacy types (deprecated but supported)
CitationAttrs      // Snake_case format from editor plugins
CitationData       // TipTap extension format
CitationSuggestion // AI suggestion format

// Converters
attrsToUnified(attrs: CitationAttrs): UnifiedCitation
dataToUnified(data: CitationData): UnifiedCitation
suggestionToUnified(suggestion: CitationSuggestion): UnifiedCitation

// Auto-detect and convert
toUnified(citation: any): UnifiedCitation
```

## Citation Types

The system supports these citation types:

| Type | Description | Example Fields |
|------|-------------|----------------|
| `page` | Page number reference | `pageNumber: "42"` |
| `chapter` | Chapter and section | `chapterNumber: 5, sectionNumber: 2` |
| `verse` | Biblical verse | `verseNumber: "Genesis 1:1"` |
| `daf` | Talmudic page | `dafNumber: "2b"` |
| `halacha` | Halacha reference | `chapterNumber: 3, halachaNumber: 7` |
| `section` | Section reference | `sectionNumber: 4` |
| `custom` | Custom format | `customReference: "Appendix A"` |
| `reference` | Generic reference | `reference: "Introduction"` |

### Type Normalization

Citation types are automatically normalized:

```typescript
normalizeCitationType('PAGE')        // → 'page'
normalizeCitationType('references')  // → 'reference'
normalizeCitationType('unknown')     // → 'reference' (fallback)
```

## Serialization

### HTML Format

Citations are serialized to HTML with complete data attributes:

```html
<span
  class="citation-ref"
  data-type="citation"
  data-citation-id="cite_abc123"
  data-citation-type="chapter"
  data-source-id="42"
  data-source-title="Tanya"
  data-chapter-number="5"
  data-section-number="2"
  data-reference="Chapter 5, Section 2"
>[Tanya, ch. 5:2]</span>
```

**Critical Fix**: The `data-citation-type` attribute is now included and preserved during round-trips, preventing data loss.

### Round-Trip Guarantees

The serialization system guarantees data preservation:

```typescript
// Citation → HTML → Citation (preserves all fields)
const html = serializeCitationToHtml(citation);
const restored = deserializeHtmlToCitation(html);

// ✅ citation.citationType === restored.citation_type
// ✅ All reference fields preserved
// ✅ Statement/topic distinction maintained
```

## Database Integration

### Source Links Table

```typescript
interface SourceLink {
  id?: number;
  source_id: number;
  statement_id?: number | null;  // NULL = topic-level
  topic_id?: number | null;
  relationship_type: 'quotes' | 'references';
  page_number?: string;
  section_reference?: string;
  verse_reference?: string;
  notes?: string;
  confidence_level?: 'low' | 'medium' | 'high';
}
```

### Conversion Functions

```typescript
// Editor → Database
editorCitationToSourceLink(
  citation: CitationAttrs,
  statementId?: number | null,
  topicId?: number | null
): SourceLink

// Database → Editor
sourceLinkToEditorCitation(
  sourceLink: SourceLink,
  source: Source,
  citationType?: string  // Optional explicit type
): CitationAttrs
```

## Styling

All citations use consistent styling defined in `app/globals.css`:

```css
/* Standard font size across all displays */
.citation-ref, .citation-node {
  font-size: 0.75em;
  font-weight: 600;
  color: var(--color-primary);
}

/* Citation states */
.citation-synced    { color: var(--color-primary); }
.citation-unsynced  { color: #94a3b8; opacity: 0.7; }
.citation-error     { color: hsl(0 84% 60%); }

/* Hover effects */
.citation-ref:hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}
```

### Display Formats

- **Editor**: Descriptive format (e.g., `[Tanya, ch. 5]`)
- **Frontend**: Numbered format (e.g., `[1]`) with rich tooltip

## Migration Guide

### From Old Types to UnifiedCitation

If you have code using the old types:

```typescript
// OLD
import { CitationAttrs } from '@/components/editor/plugins/citations/comprehensiveCitationPlugin';

// NEW
import { CitationAttrs, UnifiedCitation, attrsToUnified } from '@/lib/citations/types';

// Convert when needed
const unified = attrsToUnified(oldCitation);
```

### Legacy Support

The old types are still exported for backwards compatibility:

```typescript
// These imports still work (deprecated)
import { CitationAttrs } from '@/components/editor/plugins/citations/comprehensiveCitationPlugin';
import { CitationData } from '@/components/editor/extensions/AdvancedCitation';
import { CitationSuggestion } from '@/components/editor/extensions/SmartCitationExtension';

// But prefer the new unified imports
import { CitationAttrs, CitationData, CitationSuggestion } from '@/lib/citations/types';
```

## Testing

### Round-Trip Tests

Comprehensive tests verify data preservation:

```typescript
// Run tests
npm test lib/citations/__tests__/citationSerializer.test.ts

// Key test cases:
// ✅ Citation type preservation through HTML round-trip
// ✅ All reference fields preserved
// ✅ Statement vs topic level distinction maintained
// ✅ Edge cases (null values, empty strings, etc.)
```

### Test Coverage

- ✅ All 8 citation types (page, chapter, verse, daf, halacha, section, custom, reference)
- ✅ HTML serialization/deserialization
- ✅ Database conversions
- ✅ Type guards and converters
- ✅ Citation reference formatting
- ✅ Statement/topic level utilities

## Best Practices

### 1. Always Use UnifiedCitation Internally

```typescript
// ✅ Good
function processCitation(citation: UnifiedCitation) {
  const formatted = formatCitationReference(citation);
  // ...
}

// ❌ Avoid
function processCitation(citation: CitationAttrs | CitationData) {
  // Type confusion
}
```

### 2. Preserve statementId

```typescript
// ✅ Good - Preserves statement vs topic distinction
const sourceLink = editorCitationToSourceLink(
  citation,
  citation.statementId,  // Pass through
  citation.topicId
);

// ❌ Bad - Loses distinction
const sourceLink = editorCitationToSourceLink(citation, null, topicId);
```

### 3. Use Type Guards

```typescript
// ✅ Good
if (isUnifiedCitation(citation)) {
  // TypeScript knows this is UnifiedCitation
  const ref = formatCitationReference(citation);
}

// ✅ Also good - auto-convert
const unified = toUnified(citation); // Works with any format
```

### 4. Leverage Utility Functions

```typescript
// Format for display
const displayText = formatCitationReference(citation);

// Check level
if (isStatementLevel(citation)) {
  // Handle statement-level citation
} else {
  // Handle topic-level source
}

// Get UI context
const { isStatementLevel, contextLabel } = getCitationContext(citation);
```

## API Endpoints (Future)

Planned unified endpoints:

### GET /api/citations/[id]/full
Returns complete citation data with context:

```typescript
{
  id: string;
  citation: UnifiedCitation;
  source: Source;
  context: {
    isStatementLevel: boolean;
    statementId?: number;
    topicId?: number;
  };
  preview: {
    formatted: string;    // Academic format
    displayText: string;  // For editor
    tooltip: string;      // For hover
  };
}
```

### GET /api/citations/[id]/hover
Fast, cached data for tooltips (<100ms):

```typescript
{
  formatted: string;
  quote?: string;
  sourceTitle: string;
}
```

## Troubleshooting

### Citation Type Becomes 'reference' on Reload

**Fixed**: This was caused by:
1. Missing `data-citation-type` in HTML serialization (line 192)
2. Hardcoded fallback to 'reference' in deserialization (line 248)
3. Schema parseDOM defaulting to 'page' instead of reading attribute (line 212)

All three issues are now resolved.

### Unsynced Citations Not Showing

Citations without a `sourceId` should display with gray color and reduced opacity:

```css
.citation-unsynced {
  color: #94a3b8;
  opacity: 0.7;
}
```

Check that the citation has the `citation-unsynced` class applied.

### Statement vs Topic Level Not Preserved

Verify that `statementId` is being passed through all conversions:

```typescript
// ✅ Correct
const sourceLink = editorCitationToSourceLink(citation, statementId, topicId);

// ❌ Wrong
const sourceLink = editorCitationToSourceLink(citation); // statementId lost
```

## Performance Considerations

### Tooltip Loading

Future hover endpoint (`/api/citations/[id]/hover`) should return in <100ms:

- Use caching (Redis or in-memory)
- Return minimal data (formatted string, quote, title)
- Separate from full citation data endpoint

### Serialization

- HTML serialization is synchronous and fast
- DOMParser is client-side only (check `typeof window !== 'undefined'`)
- Extract citations in batches for large documents

## Contributing

When adding new citation types:

1. Add to `CitationType` union in `types.ts`
2. Update `formatCitationReference()` switch statement
3. Add serialization in `serializeCitationToHtml()`
4. Update schema `parseDOM` and `toDOM`
5. Add round-trip test
6. Update this documentation

## Version History

### v1.0.0 - Citation System Refactor (2026-01-29)

- ✅ Created unified `UnifiedCitation` type
- ✅ Fixed citation_type serialization bug
- ✅ Added `data-citation-type` to HTML output
- ✅ Fixed schema parseDOM to read citation_type
- ✅ Added comprehensive round-trip tests
- ✅ Standardized styling to 0.75em
- ✅ Preserved statement vs topic-level distinction
- ✅ Created type converters and guards
- ✅ Added utility functions for formatting and context

## References

- Type definitions: `lib/citations/types.ts`
- Serialization: `lib/citations/citationSerializer.ts`
- Tests: `lib/citations/__tests__/`
- Schema: `components/editor/schema.ts`
- Styling: `app/globals.css` (lines 787+)
