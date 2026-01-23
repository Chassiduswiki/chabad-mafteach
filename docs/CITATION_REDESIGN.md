# Citation System Redesign

**Related:** [SCHEMA_AUDIT.md](./SCHEMA_AUDIT.md)  
**Phase:** 4 - Citation Enhancement  
**Status:** Design Specification

---

## Overview

This document specifies the redesign of the citation system to support full database capabilities, enable editing after creation, and provide a better user experience.

---

## Current Limitations

### Editor Citation Schema (Limited)

```typescript
// @/components/editor/schema.ts:136-140
const citation: NodeSpec = {
  attrs: {
    source_id: { default: null },
    source_title: { default: "Unknown Source" },
    reference: { default: "" }  // Single string - very limited
  },
  inline: true,
  contenteditable: "false"  // Cannot edit after creation
}
```

**Supports:**
- ✅ Source ID
- ✅ Source title
- ✅ Generic reference string

**Missing:**
- ❌ Page numbers (e.g., "17a", "23b")
- ❌ Chapter numbers
- ❌ Section numbers
- ❌ Daf references (Talmud)
- ❌ Halacha numbers
- ❌ Verse numbers
- ❌ Multi-system references (Sefaria, HebrewBooks)
- ❌ Edit capability

### Database Citation Capabilities (Rich)

```typescript
// content_blocks table
{
  page_number: string,           // "17a", "23b"
  chapter_number: integer,       // 5
  halacha_number: integer,       // 12
  daf_number: string,            // "3b:6"
  section_number: integer,       // 2
  citation_refs: json[{          // Multiple formats
    system: string,              // "sefaria", "hebrewbooks"
    reference: string            // System-specific format
  }]
}
```

**Gap:** Editor uses ~20% of database capabilities

---

## Proposed Solution

### Enhanced Citation Node Schema

```typescript
// @/components/editor/schema.ts (enhanced)

export interface CitationAttrs {
  // Core identification
  source_id: number | null;
  source_title: string;
  
  // Citation type determines which fields are relevant
  citation_type: 'page' | 'chapter' | 'section' | 'daf' | 'verse' | 'halacha' | 'custom';
  
  // Flexible reference fields
  page_number?: string;          // "17a", "23b", "142"
  chapter_number?: number;       // 5
  section_number?: number;       // 2
  daf_number?: string;           // "3b:6" (Talmud folio)
  halacha_number?: number;       // 12
  verse_number?: string;         // "1:5" or "Genesis 1:5"
  custom_reference?: string;     // Fallback for unusual formats
  
  // Multi-system support
  external_refs?: Array<{
    system: 'sefaria' | 'hebrewbooks' | 'wikisource' | 'other';
    reference: string;
    url?: string;
  }>;
  
  // Display preferences
  display_format?: 'short' | 'full' | 'custom';
  custom_display?: string;       // Override automatic formatting
}

const citation: NodeSpec = {
  attrs: {
    source_id: { default: null },
    source_title: { default: "" },
    citation_type: { default: "page" },
    page_number: { default: "" },
    chapter_number: { default: null },
    section_number: { default: null },
    daf_number: { default: "" },
    halacha_number: { default: null },
    verse_number: { default: "" },
    custom_reference: { default: "" },
    external_refs: { default: [] },
    display_format: { default: "short" },
    custom_display: { default: "" }
  },
  
  inline: true,
  group: "inline",
  draggable: true,
  selectable: true,  // Make selectable for editing
  
  parseDOM: [{
    tag: "span[data-type='citation']",
    getAttrs(dom: HTMLElement) {
      return {
        source_id: dom.getAttribute("data-source-id"),
        source_title: dom.getAttribute("data-source-title"),
        citation_type: dom.getAttribute("data-citation-type") || "page",
        page_number: dom.getAttribute("data-page-number") || "",
        chapter_number: dom.getAttribute("data-chapter-number") 
          ? parseInt(dom.getAttribute("data-chapter-number")!) 
          : null,
        section_number: dom.getAttribute("data-section-number")
          ? parseInt(dom.getAttribute("data-section-number")!)
          : null,
        daf_number: dom.getAttribute("data-daf-number") || "",
        halacha_number: dom.getAttribute("data-halacha-number")
          ? parseInt(dom.getAttribute("data-halacha-number")!)
          : null,
        verse_number: dom.getAttribute("data-verse-number") || "",
        custom_reference: dom.getAttribute("data-custom-reference") || "",
        external_refs: JSON.parse(dom.getAttribute("data-external-refs") || "[]"),
        display_format: dom.getAttribute("data-display-format") || "short",
        custom_display: dom.getAttribute("data-custom-display") || ""
      };
    }
  }],
  
  toDOM(node): DOMOutputSpec {
    const display = formatCitation(node.attrs);
    
    return [
      "span",
      {
        "data-type": "citation",
        "data-source-id": node.attrs.source_id,
        "data-source-title": node.attrs.source_title,
        "data-citation-type": node.attrs.citation_type,
        "data-page-number": node.attrs.page_number,
        "data-chapter-number": node.attrs.chapter_number,
        "data-section-number": node.attrs.section_number,
        "data-daf-number": node.attrs.daf_number,
        "data-halacha-number": node.attrs.halacha_number,
        "data-verse-number": node.attrs.verse_number,
        "data-custom-reference": node.attrs.custom_reference,
        "data-external-refs": JSON.stringify(node.attrs.external_refs || []),
        "data-display-format": node.attrs.display_format,
        "data-custom-display": node.attrs.custom_display,
        class: "citation-node editable cursor-pointer hover:bg-blue-200 transition-colors bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium select-none mx-1 border border-blue-200",
        contenteditable: "false",  // Node itself not editable, but can be selected and modified via dialog
        title: `Click to edit citation`
      },
      display
    ];
  }
};
```

---

## Citation Formatting Logic

```typescript
// @/lib/citation-formatter.ts

export function formatCitation(attrs: CitationAttrs): string {
  const { 
    source_title, 
    citation_type, 
    display_format,
    custom_display 
  } = attrs;
  
  // Use custom display if provided
  if (custom_display) {
    return custom_display;
  }
  
  // Format based on citation type
  switch (citation_type) {
    case 'page':
      return formatPageCitation(attrs);
    case 'chapter':
      return formatChapterCitation(attrs);
    case 'section':
      return formatSectionCitation(attrs);
    case 'daf':
      return formatDafCitation(attrs);
    case 'verse':
      return formatVerseCitation(attrs);
    case 'halacha':
      return formatHalachaCitation(attrs);
    case 'custom':
      return formatCustomCitation(attrs);
    default:
      return source_title;
  }
}

function formatPageCitation(attrs: CitationAttrs): string {
  const { source_title, page_number, display_format } = attrs;
  
  if (!page_number) {
    return source_title;
  }
  
  if (display_format === 'short') {
    return `${source_title} ${page_number}`;
  }
  
  return `${source_title}, p. ${page_number}`;
}

function formatChapterCitation(attrs: CitationAttrs): string {
  const { source_title, chapter_number, section_number, display_format } = attrs;
  
  if (!chapter_number) {
    return source_title;
  }
  
  let ref = `ch. ${chapter_number}`;
  if (section_number) {
    ref += `:${section_number}`;
  }
  
  if (display_format === 'short') {
    return `${source_title} ${ref}`;
  }
  
  return `${source_title}, ${ref}`;
}

function formatSectionCitation(attrs: CitationAttrs): string {
  const { source_title, chapter_number, section_number, display_format } = attrs;
  
  if (!section_number) {
    return source_title;
  }
  
  let ref = chapter_number 
    ? `ch. ${chapter_number}, §${section_number}`
    : `§${section_number}`;
  
  if (display_format === 'short') {
    return `${source_title} ${ref}`;
  }
  
  return `${source_title}, ${ref}`;
}

function formatDafCitation(attrs: CitationAttrs): string {
  const { source_title, daf_number, display_format } = attrs;
  
  if (!daf_number) {
    return source_title;
  }
  
  // daf_number format: "3b:6" or "31a"
  if (display_format === 'short') {
    return `${source_title} ${daf_number}`;
  }
  
  return `${source_title}, daf ${daf_number}`;
}

function formatVerseCitation(attrs: CitationAttrs): string {
  const { source_title, verse_number, chapter_number, display_format } = attrs;
  
  if (!verse_number && !chapter_number) {
    return source_title;
  }
  
  const ref = verse_number || `${chapter_number}`;
  
  if (display_format === 'short') {
    return `${source_title} ${ref}`;
  }
  
  return `${source_title}, ${ref}`;
}

function formatHalachaCitation(attrs: CitationAttrs): string {
  const { source_title, chapter_number, halacha_number, display_format } = attrs;
  
  if (!halacha_number) {
    return source_title;
  }
  
  let ref = chapter_number 
    ? `${chapter_number}:${halacha_number}`
    : `${halacha_number}`;
  
  if (display_format === 'short') {
    return `${source_title} ${ref}`;
  }
  
  return `${source_title}, halacha ${ref}`;
}

function formatCustomCitation(attrs: CitationAttrs): string {
  const { source_title, custom_reference } = attrs;
  
  if (!custom_reference) {
    return source_title;
  }
  
  return `${source_title} ${custom_reference}`;
}
```

---

## Citation Editor Dialog

### UI Component

```typescript
// @/components/editor/CitationEditorDialog.tsx

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CitationAttrs } from './schema';

interface CitationEditorDialogProps {
  open: boolean;
  citation: CitationAttrs | null;
  onSave: (citation: CitationAttrs) => void;
  onClose: () => void;
}

export function CitationEditorDialog({ 
  open, 
  citation, 
  onSave, 
  onClose 
}: CitationEditorDialogProps) {
  const [formData, setFormData] = useState<CitationAttrs>({
    source_id: null,
    source_title: "",
    citation_type: "page",
    page_number: "",
    chapter_number: null,
    section_number: null,
    daf_number: "",
    halacha_number: null,
    verse_number: "",
    custom_reference: "",
    external_refs: [],
    display_format: "short",
    custom_display: ""
  });

  useEffect(() => {
    if (citation) {
      setFormData(citation);
    }
  }, [citation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const updateField = (field: keyof CitationAttrs, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Citation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Title (read-only) */}
          <div>
            <Label>Source</Label>
            <Input 
              value={formData.source_title} 
              disabled 
              className="bg-gray-50"
            />
          </div>

          {/* Citation Type Selector */}
          <div>
            <Label>Citation Type</Label>
            <Select 
              value={formData.citation_type} 
              onValueChange={(value) => updateField('citation_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Page Number</SelectItem>
                <SelectItem value="chapter">Chapter</SelectItem>
                <SelectItem value="section">Section</SelectItem>
                <SelectItem value="daf">Daf (Talmud)</SelectItem>
                <SelectItem value="verse">Verse</SelectItem>
                <SelectItem value="halacha">Halacha</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic fields based on citation type */}
          {formData.citation_type === 'page' && (
            <div>
              <Label>Page Number</Label>
              <Input 
                value={formData.page_number || ""} 
                onChange={(e) => updateField('page_number', e.target.value)}
                placeholder="e.g., 17a, 23b, 142"
              />
            </div>
          )}

          {formData.citation_type === 'chapter' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chapter Number</Label>
                <Input 
                  type="number"
                  value={formData.chapter_number || ""} 
                  onChange={(e) => updateField('chapter_number', parseInt(e.target.value) || null)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label>Section Number (optional)</Label>
                <Input 
                  type="number"
                  value={formData.section_number || ""} 
                  onChange={(e) => updateField('section_number', parseInt(e.target.value) || null)}
                  placeholder="2"
                />
              </div>
            </div>
          )}

          {formData.citation_type === 'section' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chapter Number (optional)</Label>
                <Input 
                  type="number"
                  value={formData.chapter_number || ""} 
                  onChange={(e) => updateField('chapter_number', parseInt(e.target.value) || null)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label>Section Number</Label>
                <Input 
                  type="number"
                  value={formData.section_number || ""} 
                  onChange={(e) => updateField('section_number', parseInt(e.target.value) || null)}
                  placeholder="2"
                />
              </div>
            </div>
          )}

          {formData.citation_type === 'daf' && (
            <div>
              <Label>Daf Number</Label>
              <Input 
                value={formData.daf_number || ""} 
                onChange={(e) => updateField('daf_number', e.target.value)}
                placeholder="e.g., 3b:6 or 31a"
              />
            </div>
          )}

          {formData.citation_type === 'verse' && (
            <div>
              <Label>Verse Reference</Label>
              <Input 
                value={formData.verse_number || ""} 
                onChange={(e) => updateField('verse_number', e.target.value)}
                placeholder="e.g., 1:5 or Genesis 1:5"
              />
            </div>
          )}

          {formData.citation_type === 'halacha' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chapter/Siman (optional)</Label>
                <Input 
                  type="number"
                  value={formData.chapter_number || ""} 
                  onChange={(e) => updateField('chapter_number', parseInt(e.target.value) || null)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label>Halacha Number</Label>
                <Input 
                  type="number"
                  value={formData.halacha_number || ""} 
                  onChange={(e) => updateField('halacha_number', parseInt(e.target.value) || null)}
                  placeholder="12"
                />
              </div>
            </div>
          )}

          {formData.citation_type === 'custom' && (
            <div>
              <Label>Custom Reference</Label>
              <Input 
                value={formData.custom_reference || ""} 
                onChange={(e) => updateField('custom_reference', e.target.value)}
                placeholder="Enter custom reference format"
              />
            </div>
          )}

          {/* Display Format */}
          <div>
            <Label>Display Format</Label>
            <Select 
              value={formData.display_format} 
              onValueChange={(value) => updateField('display_format', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (Source 17a)</SelectItem>
                <SelectItem value="full">Full (Source, p. 17a)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.display_format === 'custom' && (
            <div>
              <Label>Custom Display Text</Label>
              <Input 
                value={formData.custom_display || ""} 
                onChange={(e) => updateField('custom_display', e.target.value)}
                placeholder="Enter custom display text"
              />
            </div>
          )}

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label className="text-sm text-gray-600">Preview</Label>
            <div className="mt-2">
              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium border border-blue-200">
                {formatCitation(formData)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Citation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Plugin Updates

### Enhanced Citation Plugin

```typescript
// @/components/editor/plugins/citations/comprehensiveCitationPlugin.ts

export interface CitationPluginOptions {
  onTrigger?: (range: { from: number; to: number }) => void;
  onDismiss?: () => void;
  onClick?: (citation: CitationAttrs) => void;
  onEdit?: (citation: CitationAttrs, pos: number) => void;
}

export function createComprehensiveCitationPlugin(options: CitationPluginOptions = {}) {
  const { onTrigger, onDismiss, onClick, onEdit } = options;

  return new Plugin({
    key: citationPluginKey,
    props: {
      handleClick(view, pos, event) {
        const target = event.target as HTMLElement | null;
        if (!target) return false;

        const citationEl = target.closest("[data-type='citation']") as HTMLElement | null;
        if (!citationEl) return false;

        // Parse citation attributes from DOM
        const citation: CitationAttrs = {
          source_id: citationEl.getAttribute("data-source-id") 
            ? parseInt(citationEl.getAttribute("data-source-id")!) 
            : null,
          source_title: citationEl.getAttribute("data-source-title") || "",
          citation_type: citationEl.getAttribute("data-citation-type") as any || "page",
          page_number: citationEl.getAttribute("data-page-number") || "",
          chapter_number: citationEl.getAttribute("data-chapter-number")
            ? parseInt(citationEl.getAttribute("data-chapter-number")!)
            : null,
          section_number: citationEl.getAttribute("data-section-number")
            ? parseInt(citationEl.getAttribute("data-section-number")!)
            : null,
          daf_number: citationEl.getAttribute("data-daf-number") || "",
          halacha_number: citationEl.getAttribute("data-halacha-number")
            ? parseInt(citationEl.getAttribute("data-halacha-number")!)
            : null,
          verse_number: citationEl.getAttribute("data-verse-number") || "",
          custom_reference: citationEl.getAttribute("data-custom-reference") || "",
          external_refs: JSON.parse(citationEl.getAttribute("data-external-refs") || "[]"),
          display_format: citationEl.getAttribute("data-display-format") as any || "short",
          custom_display: citationEl.getAttribute("data-custom-display") || ""
        };

        // Find the position of the citation node
        const $pos = view.state.doc.resolve(pos);
        const citationNode = $pos.parent.maybeChild($pos.index());
        
        if (citationNode && citationNode.type.name === 'citation') {
          onEdit?.(citation, pos);
        } else {
          onClick?.(citation);
        }

        return true;
      },
      
      handleKeyDown(view, event) {
        if (event.key === "@") {
          return false; // Let handleTextInput manage it
        }
        if (event.key === "Escape") {
          onDismiss?.();
          return false;
        }
        return false;
      },
      
      handleTextInput(view, from, to, text) {
        if (text === "@") {
          onTrigger?.({ from, to: from + 1 });
        }
        return false;
      },
    },
  });
}

// Update citation utility
export function updateCitation(
  view: any,
  pos: number,
  newAttrs: CitationAttrs,
  schema: any
) {
  if (!view) return;

  const citationNode = schema.nodes.citation.create(newAttrs);
  
  const tr = view.state.tr.replaceWith(
    pos,
    pos + 1,  // Replace single citation node
    citationNode
  );
  
  view.dispatch(tr);
  view.focus();
}
```

---

## Database Sync Updates

### Enhanced Sync Logic

```typescript
// @/lib/editor-sync.ts (updates)

interface CitationData {
  source_id: number;
  citation_type: string;
  page_number?: string;
  chapter_number?: number;
  section_number?: number;
  daf_number?: string;
  halacha_number?: number;
  verse_number?: string;
  custom_reference?: string;
  external_refs?: Array<{
    system: string;
    reference: string;
    url?: string;
  }>;
}

const serializeContent = (content: EditorContent[]) => {
  let html = '';
  const citations: CitationData[] = [];

  content.forEach(node => {
    if (node.type === 'text') {
      html += node.text;
    } else if (node.type === 'citation') {
      const attrs = node.attrs || {};
      
      // Render citation as span with all attributes
      html += `<span data-type="citation" `;
      html += `data-source-id="${attrs.source_id}" `;
      html += `data-source-title="${attrs.source_title}" `;
      html += `data-citation-type="${attrs.citation_type}" `;
      
      if (attrs.page_number) html += `data-page-number="${attrs.page_number}" `;
      if (attrs.chapter_number) html += `data-chapter-number="${attrs.chapter_number}" `;
      if (attrs.section_number) html += `data-section-number="${attrs.section_number}" `;
      if (attrs.daf_number) html += `data-daf-number="${attrs.daf_number}" `;
      if (attrs.halacha_number) html += `data-halacha-number="${attrs.halacha_number}" `;
      if (attrs.verse_number) html += `data-verse-number="${attrs.verse_number}" `;
      if (attrs.custom_reference) html += `data-custom-reference="${attrs.custom_reference}" `;
      if (attrs.external_refs) html += `data-external-refs='${JSON.stringify(attrs.external_refs)}' `;
      if (attrs.display_format) html += `data-display-format="${attrs.display_format}" `;
      if (attrs.custom_display) html += `data-custom-display="${attrs.custom_display}" `;
      
      html += `></span>`;
      
      // Extract citation data for database
      if (attrs.source_id) {
        citations.push({
          source_id: Number(attrs.source_id),
          citation_type: attrs.citation_type || 'page',
          page_number: attrs.page_number,
          chapter_number: attrs.chapter_number,
          section_number: attrs.section_number,
          daf_number: attrs.daf_number,
          halacha_number: attrs.halacha_number,
          verse_number: attrs.verse_number,
          custom_reference: attrs.custom_reference,
          external_refs: attrs.external_refs
        });
      }
    }
  });

  return { html, citations };
};

// Update content_blocks with citation data
async function syncBlockCitations(
  blockId: number, 
  content: string, 
  citations: CitationData[]
) {
  // Update content_blocks with citation metadata
  if (citations.length > 0) {
    const primaryCitation = citations[0];
    
    await directus.request(updateItem('content_blocks', blockId, {
      page_number: primaryCitation.page_number,
      chapter_number: primaryCitation.chapter_number,
      section_number: primaryCitation.section_number,
      daf_number: primaryCitation.daf_number,
      halacha_number: primaryCitation.halacha_number,
      citation_refs: primaryCitation.external_refs || []
    }));
  }
  
  // Create statement-source links
  // (existing logic for statement_sources junction table)
}
```

---

## User Workflows

### Workflow 1: Create Citation with Page Number

1. User types `@` in editor
2. Citation palette opens
3. User searches for source "Tanya"
4. User selects source
5. **New:** Citation type selector appears (defaults to "Page")
6. User enters page number "17a"
7. User clicks "Insert"
8. Citation appears: `Tanya 17a`

### Workflow 2: Create Citation with Chapter/Section

1. User types `@`
2. Selects source "Shulchan Aruch"
3. **New:** Selects citation type "Chapter"
4. Enters chapter: 5, section: 2
5. Citation appears: `Shulchan Aruch ch. 5:2`

### Workflow 3: Edit Existing Citation

1. User clicks on citation node
2. **New:** Citation editor dialog opens
3. User changes page number from "17a" to "17b"
4. User clicks "Save"
5. Citation updates in place

### Workflow 4: Create Talmud Citation

1. User types `@`
2. Selects source "Shabbos"
3. **New:** Selects citation type "Daf"
4. Enters daf: "31a"
5. Citation appears: `Shabbos 31a`

---

## Implementation Checklist

### Phase 4.1: Schema Updates
- [ ] Update citation node schema with new attributes
- [ ] Create citation formatter utility
- [ ] Add TypeScript types for CitationAttrs
- [ ] Update parseDOM and toDOM methods

### Phase 4.2: UI Components
- [ ] Create CitationEditorDialog component
- [ ] Add citation type selector
- [ ] Create dynamic form fields based on type
- [ ] Add preview functionality
- [ ] Style citation nodes for editability

### Phase 4.3: Plugin Updates
- [ ] Update citation plugin to handle edit clicks
- [ ] Add updateCitation utility function
- [ ] Update click handler to open editor dialog
- [ ] Test citation selection and editing

### Phase 4.4: Database Sync
- [ ] Update serializeContent to handle new attributes
- [ ] Update syncBlockCitations to save all citation fields
- [ ] Test data persistence
- [ ] Verify citation data in content_blocks table

### Phase 4.5: Testing
- [ ] Test all citation types (page, chapter, section, daf, verse, halacha, custom)
- [ ] Test editing existing citations
- [ ] Test citation formatting
- [ ] Test database sync
- [ ] Test external refs (Sefaria integration)

---

## Success Metrics

- ✅ Support all 7 citation types
- ✅ 100% of database citation fields utilized
- ✅ Citations editable after creation
- ✅ Proper formatting for all citation types
- ✅ Zero data loss during sync
- ✅ Improved user experience (fewer steps to cite)

---

**Document Version:** 1.0  
**Last Updated:** January 21, 2026  
**Status:** Ready for Implementation
