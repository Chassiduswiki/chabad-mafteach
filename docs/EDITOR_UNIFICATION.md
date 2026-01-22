# Editor System Unification

**Related:** [SCHEMA_AUDIT.md](./SCHEMA_AUDIT.md)  
**Phase:** 5 - Unify Editor Logic  
**Status:** Design Specification

---

## Overview

This document specifies the unification of TipTap and ProseMirror editor systems into a single, consistent architecture with unified save logic.

---

## Current State: Two Incompatible Systems

### System A: ProseMirror (Documents)

**Location:** `@/components/editor/ProseEditor.tsx`

**Usage:**
- Document editing (`content_blocks`)
- Structured content with citations
- Custom schema with citation nodes

**Save Logic:**
```typescript
// @/lib/editor-sync.ts
export const syncEditorContent = async (
    docId: string | number,
    originalParagraphs: ContentBlock[],
    editorState: ProseMirrorDoc  // ← Expects ProseMirror JSON
)
```

**Data Format:**
```typescript
{
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: { id: 123, status: "draft" },
      content: [
        { type: "text", text: "Some text" },
        { 
          type: "citation", 
          attrs: { source_id: 5, source_title: "Tanya", reference: "p. 17a" }
        }
      ]
    }
  ]
}
```

### System B: TipTap (Topics)

**Location:** `@/app/editor/topics/[slug]/page.tsx`

**Usage:**
- Topic editing (multiple rich text fields)
- Simple HTML content
- No custom nodes (yet)

**Save Logic:**
```typescript
// Manual extraction at lines 228-232
Object.entries(editorsRef.current).forEach(([field, editor]) => {
  if (editor?.getHTML) {
    editorContent[field as keyof TopicFormData] = editor.getHTML(); // ← Sends HTML
  }
});
```

**Data Format:**
```html
<p>Some text</p>
<p>More content</p>
```

---

## The Problem

### Type Mismatch

ProseMirror sync expects JSON document structure, but TipTap sends HTML strings.

```typescript
// This fails:
syncEditorContent(
  topicId,
  existingBlocks,
  "<p>HTML content</p>"  // ❌ Wrong type
);
```

### Inconsistent Behavior

- **Documents:** Auto-save with ProseMirror sync
- **Topics:** Manual save with HTML extraction
- **Result:** Different UX, different bugs, different maintenance

### Code Duplication

- Two editor initialization patterns
- Two save mechanisms
- Two error handling approaches
- Two sets of plugins

---

## Proposed Solution: Unified TipTap Architecture

### Why TipTap?

**Advantages:**
- ✅ Built on ProseMirror (can use same schema)
- ✅ Better React integration
- ✅ More features out of the box
- ✅ Active development and community
- ✅ Easier to extend
- ✅ Better TypeScript support

**Migration Path:**
- Keep existing ProseMirror schema
- Wrap in TipTap extensions
- Unified save adapter works for both

---

## Unified Architecture Design

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                   TipTap Editor (Unified)               │
├─────────────────────────────────────────────────────────┤
│  - Custom Extensions (Citation, etc.)                   │
│  - Shared Schema                                        │
│  - Unified Plugin System                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Unified Save Adapter                        │
├─────────────────────────────────────────────────────────┤
│  - Converts TipTap JSON → Database format               │
│  - Handles both topics and documents                    │
│  - Single source of truth for sync logic                │
└─────────────────────────────────────────────────────────┘
                          ↓
                    ┌─────┴─────┐
                    ↓           ↓
            ┌───────────┐  ┌──────────────┐
            │  Topics   │  │Content Blocks│
            │  (HTML)   │  │  (Structured)│
            └───────────┘  └──────────────┘
```

---

## Implementation Plan

### Step 1: Create Unified TipTap Editor Component

**File:** `@/components/editor/UnifiedEditor.tsx`

```typescript
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Citation } from './extensions/Citation';
import { useCallback, useEffect } from 'react';

interface UnifiedEditorProps {
  // Content source
  initialContent?: string | object;  // HTML or JSON
  contentType?: 'html' | 'json';     // How to interpret initialContent
  
  // Save configuration
  saveMode?: 'auto' | 'manual';
  autoSaveDelay?: number;            // ms
  onSave?: (content: any) => Promise<void>;
  
  // Editor configuration
  editable?: boolean;
  placeholder?: string;
  className?: string;
  
  // Callbacks
  onChange?: (content: any) => void;
  onReady?: (editor: any) => void;
}

export function UnifiedEditor({
  initialContent,
  contentType = 'html',
  saveMode = 'manual',
  autoSaveDelay = 2000,
  onSave,
  editable = true,
  placeholder,
  className,
  onChange,
  onReady
}: UnifiedEditorProps) {
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Citation,  // Custom citation extension
      // Add more extensions as needed
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json);
      
      if (saveMode === 'auto') {
        debouncedSave(json);
      }
    },
  });

  useEffect(() => {
    if (editor && onReady) {
      onReady(editor);
    }
  }, [editor, onReady]);

  const debouncedSave = useCallback(
    debounce((content: any) => {
      onSave?.(content);
    }, autoSaveDelay),
    [onSave, autoSaveDelay]
  );

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  );
}

// Utility: debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

### Step 2: Create Citation Extension for TipTap

**File:** `@/components/editor/extensions/Citation.ts`

```typescript
import { Node, mergeAttributes } from '@tiptap/core';
import { CitationAttrs } from '../schema';

export const Citation = Node.create({
  name: 'citation',

  group: 'inline',

  inline: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return {
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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="citation"]',
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          return {
            source_id: element.getAttribute('data-source-id'),
            source_title: element.getAttribute('data-source-title'),
            citation_type: element.getAttribute('data-citation-type') || 'page',
            page_number: element.getAttribute('data-page-number') || '',
            chapter_number: element.getAttribute('data-chapter-number') 
              ? parseInt(element.getAttribute('data-chapter-number')!) 
              : null,
            section_number: element.getAttribute('data-section-number')
              ? parseInt(element.getAttribute('data-section-number')!)
              : null,
            daf_number: element.getAttribute('data-daf-number') || '',
            halacha_number: element.getAttribute('data-halacha-number')
              ? parseInt(element.getAttribute('data-halacha-number')!)
              : null,
            verse_number: element.getAttribute('data-verse-number') || '',
            custom_reference: element.getAttribute('data-custom-reference') || '',
            external_refs: JSON.parse(element.getAttribute('data-external-refs') || '[]'),
            display_format: element.getAttribute('data-display-format') || 'short',
            custom_display: element.getAttribute('data-custom-display') || ''
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = node.attrs as CitationAttrs;
    const display = formatCitation(attrs);
    
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'citation',
        'data-source-id': attrs.source_id,
        'data-source-title': attrs.source_title,
        'data-citation-type': attrs.citation_type,
        'data-page-number': attrs.page_number,
        'data-chapter-number': attrs.chapter_number,
        'data-section-number': attrs.section_number,
        'data-daf-number': attrs.daf_number,
        'data-halacha-number': attrs.halacha_number,
        'data-verse-number': attrs.verse_number,
        'data-custom-reference': attrs.custom_reference,
        'data-external-refs': JSON.stringify(attrs.external_refs || []),
        'data-display-format': attrs.display_format,
        'data-custom-display': attrs.custom_display,
        class: 'citation-node editable cursor-pointer hover:bg-blue-200 transition-colors bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium select-none mx-1 border border-blue-200',
        contenteditable: 'false',
      }),
      display,
    ];
  },

  addCommands() {
    return {
      insertCitation: (attrs: CitationAttrs) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs,
        });
      },
      updateCitation: (attrs: CitationAttrs) => ({ commands, state }) => {
        const { selection } = state;
        return commands.updateAttributes(this.name, attrs);
      },
    };
  },
});

// Import from citation-formatter.ts
function formatCitation(attrs: CitationAttrs): string {
  // Same logic as in CITATION_REDESIGN.md
  // ...
}
```

### Step 3: Create Unified Save Adapter

**File:** `@/lib/unified-editor-sync.ts`

```typescript
import { createClient } from '@/lib/directus';
import { createItem, updateItem, deleteItem } from '@directus/sdk';

const directus = createClient();

export interface SaveConfig {
  collection: 'topics' | 'content_blocks';
  itemId: string | number;
  field?: string;  // For topics: which field (description, overview, etc.)
}

export interface EditorContent {
  type: string;
  content?: any[];
  attrs?: any;
}

/**
 * Unified save adapter that works for both topics and documents
 */
export async function saveEditorContent(
  editorJSON: any,
  config: SaveConfig
) {
  if (config.collection === 'topics') {
    return saveTopicContent(editorJSON, config);
  } else {
    return saveDocumentContent(editorJSON, config);
  }
}

/**
 * Save topic field (simple HTML storage)
 */
async function saveTopicContent(
  editorJSON: any,
  config: SaveConfig
) {
  if (!config.field) {
    throw new Error('Field name required for topic save');
  }

  // Convert TipTap JSON to HTML
  const html = jsonToHTML(editorJSON);

  // Update topic field
  await directus.request(updateItem('topics', config.itemId, {
    [config.field]: html
  }));

  return { success: true, updated: 1 };
}

/**
 * Save document content (structured with content_blocks)
 */
async function saveDocumentContent(
  editorJSON: any,
  config: SaveConfig
) {
  // Get existing content blocks
  const existingBlocks = await directus.request(
    readItems('content_blocks', {
      filter: { document_id: { _eq: config.itemId } },
      sort: ['order_key']
    })
  );

  // Parse editor state into blocks
  const newBlocks = parseEditorToBlocks(editorJSON, config.itemId);

  // Sync changes
  return await syncContentBlocks(existingBlocks, newBlocks);
}

/**
 * Convert TipTap JSON to HTML
 */
function jsonToHTML(json: any): string {
  // Use TipTap's generateHTML utility
  // Or implement custom serializer
  // For now, simplified version:
  
  if (!json || !json.content) return '';
  
  let html = '';
  
  for (const node of json.content) {
    if (node.type === 'paragraph') {
      html += '<p>';
      if (node.content) {
        html += serializeInlineContent(node.content);
      }
      html += '</p>';
    } else if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      html += `<h${level}>`;
      if (node.content) {
        html += serializeInlineContent(node.content);
      }
      html += `</h${level}>`;
    }
    // Add more node types as needed
  }
  
  return html;
}

/**
 * Serialize inline content (text, citations, etc.)
 */
function serializeInlineContent(content: any[]): string {
  let html = '';
  
  for (const node of content) {
    if (node.type === 'text') {
      let text = node.text || '';
      
      // Apply marks (bold, italic, etc.)
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') text = `<strong>${text}</strong>`;
          if (mark.type === 'italic') text = `<em>${text}</em>`;
          if (mark.type === 'code') text = `<code>${text}</code>`;
        }
      }
      
      html += text;
    } else if (node.type === 'citation') {
      // Serialize citation with all attributes
      const attrs = node.attrs || {};
      html += `<span data-type="citation" `;
      html += `data-source-id="${attrs.source_id}" `;
      html += `data-source-title="${attrs.source_title}" `;
      html += `data-citation-type="${attrs.citation_type}" `;
      // Add all other citation attributes
      html += `></span>`;
    }
  }
  
  return html;
}

/**
 * Parse editor JSON into content blocks
 */
function parseEditorToBlocks(json: any, docId: string | number) {
  const blocks: any[] = [];
  
  if (!json || !json.content) return blocks;
  
  json.content.forEach((node: any, index: number) => {
    const order_key = ((index + 1) * 10).toString().padStart(5, '0');
    
    // Extract citations from node
    const citations = extractCitations(node);
    
    blocks.push({
      id: node.attrs?.id,
      document_id: docId,
      content: serializeNode(node),
      order_key,
      status: node.attrs?.status || 'draft',
      citations
    });
  });
  
  return blocks;
}

/**
 * Extract citations from a node
 */
function extractCitations(node: any): any[] {
  const citations: any[] = [];
  
  if (!node.content) return citations;
  
  for (const child of node.content) {
    if (child.type === 'citation' && child.attrs?.source_id) {
      citations.push({
        source_id: child.attrs.source_id,
        citation_type: child.attrs.citation_type,
        page_number: child.attrs.page_number,
        chapter_number: child.attrs.chapter_number,
        section_number: child.attrs.section_number,
        daf_number: child.attrs.daf_number,
        halacha_number: child.attrs.halacha_number,
        verse_number: child.attrs.verse_number,
        custom_reference: child.attrs.custom_reference,
        external_refs: child.attrs.external_refs
      });
    }
  }
  
  return citations;
}

/**
 * Serialize a single node to HTML
 */
function serializeNode(node: any): string {
  // Similar to jsonToHTML but for single node
  // ...implementation...
}

/**
 * Sync content blocks (create/update/delete)
 */
async function syncContentBlocks(
  existing: any[],
  updated: any[]
) {
  const results = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [] as string[]
  };

  // Create map of existing blocks
  const existingMap = new Map(existing.map(b => [b.id, b]));
  const processedIds = new Set<number>();

  // Process updates and creates
  for (const block of updated) {
    if (block.id && existingMap.has(block.id)) {
      // Update existing
      processedIds.add(block.id);
      const original = existingMap.get(block.id)!;
      
      if (original.content !== block.content || original.order_key !== block.order_key) {
        try {
          await directus.request(updateItem('content_blocks', block.id, {
            content: block.content,
            order_key: block.order_key
          }));
          results.updated++;
        } catch (e) {
          results.errors.push(`Failed to update block ${block.id}`);
        }
      }
      
      // Sync citations
      await syncBlockCitations(block.id, block.citations);
    } else {
      // Create new
      try {
        const newBlock = await directus.request(createItem('content_blocks', {
          document_id: block.document_id,
          content: block.content,
          order_key: block.order_key,
          status: block.status
        }));
        
        results.created++;
        
        if (newBlock && newBlock.id) {
          await syncBlockCitations(newBlock.id, block.citations);
        }
      } catch (e) {
        results.errors.push('Failed to create block');
      }
    }
  }

  // Delete removed blocks
  for (const original of existing) {
    if (!processedIds.has(original.id)) {
      try {
        await directus.request(deleteItem('content_blocks', original.id));
        results.deleted++;
      } catch (e) {
        results.errors.push(`Failed to delete block ${original.id}`);
      }
    }
  }

  return results;
}

/**
 * Sync citations for a content block
 */
async function syncBlockCitations(blockId: number, citations: any[]) {
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
  // (existing logic)
}
```

### Step 4: Update Topic Editor to Use Unified System

**File:** `@/app/editor/topics/[slug]/page.tsx` (refactored)

```typescript
"use client";

import { UnifiedEditor } from '@/components/editor/UnifiedEditor';
import { saveEditorContent } from '@/lib/unified-editor-sync';
import { useState, useRef } from 'react';

export default function TopicEditorPage({ params }: { params: { slug: string } }) {
  const [topic, setTopic] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  const editorsRef = useRef<Record<string, any>>({});

  const handleSave = async () => {
    if (!topic) return;

    setSaveStatus('saving');

    try {
      // Save all editor fields
      const savePromises = Object.entries(editorsRef.current).map(([field, editor]) => {
        if (!editor) return Promise.resolve();
        
        const json = editor.getJSON();
        
        return saveEditorContent(json, {
          collection: 'topics',
          itemId: topic.id,
          field
        });
      });

      await Promise.all(savePromises);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Description Field */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Short Description
        </label>
        <UnifiedEditor
          initialContent={topic?.description}
          contentType="html"
          saveMode="manual"
          className="border rounded-md"
          onReady={(editor) => {
            editorsRef.current.description = editor;
          }}
        />
      </div>

      {/* Overview Field */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Overview
        </label>
        <UnifiedEditor
          initialContent={topic?.overview}
          contentType="html"
          saveMode="manual"
          className="border rounded-md"
          onReady={(editor) => {
            editorsRef.current.overview = editor;
          }}
        />
      </div>

      {/* Article Field */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Article Content
        </label>
        <UnifiedEditor
          initialContent={topic?.article}
          contentType="html"
          saveMode="manual"
          className="border rounded-md"
          onReady={(editor) => {
            editorsRef.current.article = editor;
          }}
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saveStatus === 'saving'}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
      </button>
      
      {saveStatus === 'success' && (
        <span className="text-green-600 ml-2">✓ Saved</span>
      )}
      {saveStatus === 'error' && (
        <span className="text-red-600 ml-2">✗ Save failed</span>
      )}
    </div>
  );
}
```

### Step 5: Update Document Editor to Use Unified System

**File:** `@/components/editor/ProseEditor.tsx` (refactored)

```typescript
"use client";

import { UnifiedEditor } from './UnifiedEditor';
import { saveEditorContent } from '@/lib/unified-editor-sync';
import { useState } from 'react';

interface ProseEditorProps {
  docId: string | null;
  className?: string;
}

export function ProseEditor({ docId, className }: ProseEditorProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleSave = async (content: any) => {
    if (!docId) return;

    setSaveStatus('saving');

    try {
      const result = await saveEditorContent(content, {
        collection: 'content_blocks',
        itemId: docId
      });

      setSaveStatus('success');
      console.log('Saved:', result);
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
    }
  };

  return (
    <div className={className}>
      <UnifiedEditor
        initialContent={null}  // Load from API
        contentType="json"
        saveMode="auto"
        autoSaveDelay={2000}
        onSave={handleSave}
        className="min-h-[400px] border rounded-md p-4"
      />
      
      {saveStatus === 'saving' && (
        <div className="text-sm text-gray-600 mt-2">Saving...</div>
      )}
      {saveStatus === 'success' && (
        <div className="text-sm text-green-600 mt-2">✓ Saved</div>
      )}
      {saveStatus === 'error' && (
        <div className="text-sm text-red-600 mt-2">✗ Save failed</div>
      )}
    </div>
  );
}
```

---

## Migration Strategy

### Phase 5.1: Preparation
- [ ] Install TipTap dependencies
- [ ] Create unified editor component
- [ ] Create citation extension
- [ ] Create unified save adapter
- [ ] Write unit tests

### Phase 5.2: Parallel Implementation
- [ ] Keep existing editors running
- [ ] Add unified editor alongside
- [ ] Feature flag to switch between old/new
- [ ] Test both systems in parallel

### Phase 5.3: Migration
- [ ] Migrate topic editor to unified system
- [ ] Test topic save functionality
- [ ] Migrate document editor to unified system
- [ ] Test document save functionality
- [ ] Verify citation functionality

### Phase 5.4: Cleanup
- [ ] Remove old ProseMirror editor
- [ ] Remove old sync logic
- [ ] Remove feature flags
- [ ] Update documentation
- [ ] Remove unused dependencies

---

## Testing Plan

### Unit Tests

```typescript
// @/lib/__tests__/unified-editor-sync.test.ts

describe('Unified Editor Sync', () => {
  describe('saveTopicContent', () => {
    it('should convert TipTap JSON to HTML', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }]
          }
        ]
      };
      
      const html = jsonToHTML(json);
      expect(html).toBe('<p>Hello world</p>');
    });

    it('should preserve citations in HTML', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Some text ' },
              { 
                type: 'citation', 
                attrs: { 
                  source_id: 5, 
                  source_title: 'Tanya',
                  citation_type: 'page',
                  page_number: '17a'
                }
              }
            ]
          }
        ]
      };
      
      const html = jsonToHTML(json);
      expect(html).toContain('data-type="citation"');
      expect(html).toContain('data-source-id="5"');
      expect(html).toContain('data-page-number="17a"');
    });
  });

  describe('saveDocumentContent', () => {
    it('should create new content blocks', async () => {
      // Test implementation
    });

    it('should update existing content blocks', async () => {
      // Test implementation
    });

    it('should delete removed content blocks', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

```typescript
// @/app/editor/__tests__/topic-editor.test.tsx

describe('Topic Editor', () => {
  it('should save description field', async () => {
    // Render topic editor
    // Type in description field
    // Click save
    // Verify API call
    // Verify success message
  });

  it('should handle save errors gracefully', async () => {
    // Mock API error
    // Attempt save
    // Verify error message
  });
});
```

---

## Performance Considerations

### Optimization Strategies

1. **Debounced Auto-Save**
   - Wait 2 seconds after last keystroke
   - Prevents excessive API calls

2. **Incremental Updates**
   - Only send changed blocks
   - Skip unchanged content

3. **Lazy Loading**
   - Load editor extensions on demand
   - Reduce initial bundle size

4. **Memoization**
   - Cache HTML serialization
   - Reuse parsed content

---

## Rollback Plan

If unified system has critical issues:

1. **Revert to old editors** via feature flag
2. **Keep old code** until new system proven stable
3. **Gradual rollout** - topics first, then documents
4. **Monitor error rates** - rollback if >5% error rate

---

## Success Metrics

- ✅ 100% save success rate (currently ~70-80%)
- ✅ <100ms save latency
- ✅ Zero code duplication between editor types
- ✅ Single source of truth for sync logic
- ✅ Consistent UX across all editors
- ✅ Reduced maintenance burden

---

**Document Version:** 1.0  
**Last Updated:** January 21, 2026  
**Status:** Ready for Implementation
