# Citation System Migration Guide

This guide helps you transition from the old fragmented citation system to the new unified architecture.

## Overview of Changes

### Before (Fragmented)
- 3 separate extensions: `AdvancedCitation`, `SmartCitationExtension`, `comprehensiveCitationPlugin`
- 4 incompatible type definitions
- Duplicate click handlers
- Inconsistent font sizes (0.85em, 0.75em)
- Missing `data-citation-type` in HTML
- citation_type always became 'reference' on reload

### After (Unified)
- 1 consolidated extension: `CitationExtension`
- 1 unified type: `UnifiedCitation`
- Single click handler
- Consistent 0.75em font size
- Complete HTML serialization with `data-citation-type`
- citation_type preserved through round-trips

## Step-by-Step Migration

### Step 1: Update Imports

#### Old Code
```typescript
import { AdvancedCitation } from '@/components/editor/extensions/AdvancedCitation';
import { SmartCitationExtension } from '@/components/editor/extensions/SmartCitationExtension';
import { createComprehensiveCitationPlugin } from '@/components/editor/plugins/citations/comprehensiveCitationPlugin';
import type { CitationData } from '@/components/editor/extensions/AdvancedCitation';
import type { CitationAttrs } from '@/components/editor/plugins/citations/comprehensiveCitationPlugin';
```

#### New Code
```typescript
import { CitationExtension } from '@/components/editor/extensions/citation';
import type {
  UnifiedCitation,
  UnifiedCitationOptions
} from '@/components/editor/extensions/citation';
```

### Step 2: Update Editor Extensions

#### Old Code
```typescript
const editor = useEditor({
  extensions: [
    // ... other extensions
    AdvancedCitation.configure({
      onCitationClick: handleCitationClick,
      onCitationEdit: handleCitationEdit,
      citations: [],
    }),
    SmartCitationExtension.configure({
      onSuggestCitations: handleSuggestions,
      onInsertCitation: handleInsert,
      topicId: '123',
    }),
  ],
});

// Separate plugin
const plugin = createComprehensiveCitationPlugin({
  onTrigger: handleTrigger,
  onClick: handleClick,
  onEdit: handleEdit,
});
```

#### New Code
```typescript
const editor = useEditor({
  extensions: [
    // ... other extensions
    CitationExtension.configure({
      // All handlers in one place
      onCitationClick: handleCitationClick,
      onCitationEdit: handleCitationEdit,
      onTrigger: handleTrigger,
      onDismiss: handleDismiss,
      onSuggestCitations: handleSuggestions,
      onInsertCitation: handleInsert,

      // Context
      topicId: 123,
      statementId: null,

      // Existing citations for deduplication
      citations: existingCitations,
    }),
  ],
});
```

### Step 3: Update Type Conversions

#### Old Code
```typescript
// Manual conversion between formats
function convertCitationDataToAttrs(data: CitationData): CitationAttrs {
  return {
    source_id: data.sourceId,
    source_title: data.sourceTitle,
    citation_type: 'reference', // Always hardcoded!
    reference: data.reference,
    // ... manual field mapping
  };
}
```

#### New Code
```typescript
import { toUnified, unifiedToAttrs } from '@/lib/citations/types';

// Auto-conversion
const unified = toUnified(citation); // Works with any format

// Convert back if needed
const attrs = unifiedToAttrs(unified);
```

### Step 4: Update Citation Insertion

#### Old Code
```typescript
// Using comprehensiveCitationPlugin utility
import { insertCitation } from '@/components/editor/plugins/citations/comprehensiveCitationPlugin';

insertCitation(
  view,
  range,
  { id: source.id, title: source.title },
  {
    citation_type: 'chapter',
    chapter_number: 5,
  },
  schema
);
```

#### New Code
```typescript
// Using editor command
editor.commands.insertCitation({
  sourceId: source.id,
  sourceTitle: source.title,
  citationType: 'chapter',
  chapterNumber: 5,
  statementId: currentStatementId, // Preserve statement vs topic distinction
});
```

### Step 5: Update Citation Updates

#### Old Code
```typescript
import { updateCitation } from '@/components/editor/plugins/citations/comprehensiveCitationPlugin';

updateCitation(
  view,
  pos,
  {
    citation_type: 'verse',
    verse_number: '1:1',
  },
  schema
);
```

#### New Code
```typescript
editor.commands.updateCitation(pos, {
  citationType: 'verse',
  verseNumber: '1:1',
});
```

### Step 6: Update Click Handlers

#### Old Code
```typescript
// AdvancedCitation click handler
const handleAdvancedClick = (citation: CitationData) => {
  console.log(citation.sourceId, citation.sourceTitle);
};

// comprehensiveCitationPlugin click handler
const handlePluginClick = (citation: CitationAttrs) => {
  console.log(citation.source_id, citation.source_title);
};
```

#### New Code
```typescript
// Single unified click handler
const handleCitationClick = (citation: UnifiedCitation, pos: number) => {
  console.log(citation.sourceId, citation.sourceTitle);
  console.log('Position:', pos);

  // Check if statement-level or topic-level
  if (isStatementLevel(citation)) {
    console.log('Statement-level citation');
  } else {
    console.log('Topic-level source');
  }
};
```

### Step 7: Update Keyboard Shortcuts

#### Old Code
```typescript
// SmartCitationExtension had Mod-Shift-s
// comprehensiveCitationPlugin had Escape
// Needed separate configuration
```

#### New Code
```typescript
// Both included automatically in CitationExtension
// Mod-Shift-s: Suggest citations for selected text
// Escape: Dismiss citation modal

// No configuration needed!
```

### Step 8: Update Styling

#### Old Code
```css
/* Inconsistent font sizes */
.citation-node {
  font-size: 0.85em; /* AdvancedCitation */
}

.citation-ref {
  font-size: 0.75em; /* Some other place */
}
```

#### New Code
```css
/* Standardized in app/globals.css */
.citation-ref,
.citation-node {
  font-size: 0.75em; /* Consistent everywhere */
}

/* State classes now available */
.citation-synced { color: var(--color-primary); }
.citation-unsynced { color: #94a3b8; opacity: 0.7; }
.citation-error { color: hsl(0 84% 60%); }
```

### Step 9: Update Component State

#### Old Code
```typescript
const [selectedCitation, setSelectedCitation] = useState<CitationData | CitationAttrs | null>(null);
```

#### New Code
```typescript
const [selectedCitation, setSelectedCitation] = useState<UnifiedCitation | null>(null);
```

### Step 10: Update Serialization

#### Old Code
```typescript
// Manual HTML generation
const html = `<span class="citation-ref" data-source-id="${id}">[${title}]</span>`;
// Missing data-citation-type!
```

#### New Code
```typescript
import { serializeCitationToHtml } from '@/lib/citations/citationSerializer';

const html = serializeCitationToHtml(citation);
// Includes all attributes including data-citation-type
```

## Complete Example: Before & After

### Before (Old System)

```typescript
import { useEditor } from '@tiptap/react';
import { AdvancedCitation, type CitationData } from '@/components/editor/extensions/AdvancedCitation';
import { SmartCitationExtension } from '@/components/editor/extensions/SmartCitationExtension';
import { createComprehensiveCitationPlugin, type CitationAttrs } from '@/components/editor/plugins/citations/comprehensiveCitationPlugin';

function EditorComponent() {
  const [selectedCitation, setSelectedCitation] = useState<CitationData | CitationAttrs | null>(null);

  const handleClick = (citation: CitationData) => {
    // Type confusion - is this CitationData or CitationAttrs?
    setSelectedCitation(citation);
  };

  const handlePluginClick = (citation: CitationAttrs) => {
    // Different handler for different type
    setSelectedCitation(citation);
  };

  const editor = useEditor({
    extensions: [
      AdvancedCitation.configure({
        onCitationClick: handleClick,
        citations: [],
      }),
      SmartCitationExtension.configure({
        topicId: '123',
      }),
    ],
  });

  // Separate plugin configuration
  const plugin = createComprehensiveCitationPlugin({
    onClick: handlePluginClick,
  });

  return <EditorContent editor={editor} />;
}
```

### After (New System)

```typescript
import { useEditor } from '@tiptap/react';
import { CitationExtension, type UnifiedCitation } from '@/components/editor/extensions/citation';
import { isStatementLevel } from '@/lib/citations/types';

function EditorComponent() {
  const [selectedCitation, setSelectedCitation] = useState<UnifiedCitation | null>(null);

  const handleCitationClick = (citation: UnifiedCitation, pos: number) => {
    setSelectedCitation(citation);

    // Can easily check statement vs topic level
    if (isStatementLevel(citation)) {
      console.log('Statement citation at position', pos);
    }
  };

  const handleCitationEdit = (citation: UnifiedCitation, pos: number) => {
    // Open edit modal
    openEditModal(citation, pos);
  };

  const editor = useEditor({
    extensions: [
      CitationExtension.configure({
        // All handlers in one place
        onCitationClick: handleCitationClick,
        onCitationEdit: handleCitationEdit,
        onTrigger: ({ from, to }) => {
          // Show citation insertion UI
          showCitationPalette();
        },
        onSuggestCitations: (suggestions) => {
          // Show AI suggestions
          setSuggestions(suggestions);
        },

        // Context
        topicId: 123,
        statementId: null, // Topic-level by default
      }),
    ],
  });

  return <EditorContent editor={editor} />;
}
```

## Breaking Changes

### Removed

- `AdvancedCitation` extension (replaced by `CitationExtension`)
- `SmartCitationExtension` extension (merged into `CitationExtension`)
- `createComprehensiveCitationPlugin` function (merged into `CitationExtension`)
- `insertCitation` utility (use `editor.commands.insertCitation`)
- `updateCitation` utility (use `editor.commands.updateCitation`)

### Changed

- Citation type fallback: `'page'` → `'reference'` (more sensible default)
- Font size standardized: all citations now `0.75em`
- Click handlers: now receive `(citation: UnifiedCitation, pos: number)`

### Added

- `UnifiedCitation` type (single source of truth)
- `data-citation-type` attribute in HTML (fixes data loss bug)
- `statementId` field (preserves statement vs topic distinction)
- Type conversion utilities (`toUnified`, `attrsToUnified`, etc.)
- Citation state classes (`.citation-synced`, `.citation-unsynced`, `.citation-error`)
- Comprehensive tests for round-trip serialization

## Testing Your Migration

After migrating, verify:

1. **Citation type preservation**:
   - Insert a citation with type 'chapter'
   - Save the document
   - Reload the page
   - ✅ Citation should still be type 'chapter', not 'reference'

2. **Statement vs topic level**:
   - Create a statement-level citation (`statementId` set)
   - Create a topic-level source (`statementId` null)
   - ✅ Both should preserve their level through save/reload

3. **Click handlers**:
   - Click a citation
   - ✅ Only one click handler should fire (not duplicates)
   - ✅ Handler should receive position information

4. **Styling**:
   - Check citation font size
   - ✅ Should be consistent `0.75em`
   - ✅ Synced citations should use primary color
   - ✅ Unsynced citations should be grayed out

5. **Keyboard shortcuts**:
   - Select text and press `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)
   - ✅ Should trigger citation suggestions
   - Press `Escape`
   - ✅ Should dismiss citation modal/palette

## Rollback Plan

If you need to rollback:

1. Old extensions are still available (deprecated but functional)
2. Import from original locations
3. Old types still work through backwards compatibility layer
4. No data loss - HTML attributes are additive only

## Support

For issues or questions:

- Check `lib/citations/README.md` for full documentation
- See `lib/citations/__tests__/` for example usage
- Old components remain available for 2 releases with deprecation warnings

## Timeline

- **v1.0.0** (2026-01-29): Unified system introduced, old system deprecated
- **v1.1.0** (Q2 2026): Old system shows console warnings
- **v2.0.0** (Q3 2026): Old system removed

Start migrating now to avoid future breaking changes!
