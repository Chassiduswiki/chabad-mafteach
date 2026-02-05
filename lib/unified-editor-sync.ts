/**
 * Unified Editor Sync
 * 
 * Single source of truth for saving editor content
 * Works for both topics (HTML storage) and documents (structured content_blocks)
 */

import { createClient } from '@/lib/directus';
import { createItem, updateItem, deleteItem, readItems } from '@directus/sdk';

const directus = createClient();

export interface SaveConfig {
  collection: 'topics' | 'content_blocks';
  itemId: string | number;
  field?: string;  // For topics: which field (description, overview, etc.)
  documentId?: string | number; // For content_blocks: parent document
}

export interface EditorContent {
  type: string;
  content?: any[];
  attrs?: any;
  text?: string;
  marks?: any[];
}

export interface ProseMirrorDoc {
  type: 'doc';
  content: EditorContent[];
}

interface CitationData {
  source_id: number;
  citation_type: string;
  page_number?: string;
  chapter_number?: number | null;
  section_number?: number | null;
  daf_number?: string;
  halacha_number?: number | null;
  verse_number?: string;
  custom_reference?: string;
}

/**
 * Unified save adapter that works for both topics and documents
 */
export async function saveEditorContent(
  editorJSON: ProseMirrorDoc,
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
  editorJSON: ProseMirrorDoc,
  config: SaveConfig
) {
  if (!config.field) {
    throw new Error('Field name required for topic save');
  }

  // Convert ProseMirror JSON to HTML
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
  editorJSON: ProseMirrorDoc,
  config: SaveConfig
) {
  if (!config.documentId) {
    throw new Error('Document ID required for content_blocks save');
  }

  // Get existing content blocks
  const existingBlocks = await directus.request(
    readItems('content_blocks', {
      filter: { document_id: { _eq: config.documentId } },
      sort: ['order_key']
    })
  );

  // Parse editor state into blocks
  const newBlocks = parseEditorToBlocks(editorJSON, config.documentId);

  // Sync changes
  return await syncContentBlocks(existingBlocks, newBlocks);
}

/**
 * Convert ProseMirror JSON to HTML
 */
function jsonToHTML(json: ProseMirrorDoc): string {
  if (!json || !json.content) return '';
  
  let html = '';
  
  for (const node of json.content) {
    html += serializeNode(node);
  }
  
  return html;
}

/**
 * Serialize a single node to HTML
 */
function serializeNode(node: EditorContent): string {
  if (node.type === 'text') {
    let text = node.text || '';
    
    // Apply marks (bold, italic, etc.)
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'strong') text = `<strong>${text}</strong>`;
        if (mark.type === 'em') text = `<em>${text}</em>`;
        if (mark.type === 'code') text = `<code>${text}</code>`;
        if (mark.type === 'link') text = `<a href="${mark.attrs.href}">${text}</a>`;
      }
    }
    
    return text;
  }
  
  if (node.type === 'paragraph') {
    const content = node.content ? serializeInlineContent(node.content) : '';
    return `<p>${content}</p>`;
  }
  
  if (node.type === 'heading1') {
    const content = node.content ? serializeInlineContent(node.content) : '';
    return `<h1>${content}</h1>`;
  }
  
  if (node.type === 'heading2') {
    const content = node.content ? serializeInlineContent(node.content) : '';
    return `<h2>${content}</h2>`;
  }
  
  if (node.type === 'heading3') {
    const content = node.content ? serializeInlineContent(node.content) : '';
    return `<h3>${content}</h3>`;
  }
  
  if (node.type === 'bulletList') {
    const items = node.content?.map(item => serializeNode(item)).join('') || '';
    return `<ul>${items}</ul>`;
  }
  
  if (node.type === 'orderedList') {
    const items = node.content?.map(item => serializeNode(item)).join('') || '';
    return `<ol>${items}</ol>`;
  }
  
  if (node.type === 'listItem') {
    const content = node.content?.map(child => serializeNode(child)).join('') || '';
    return `<li>${content}</li>`;
  }
  
  if (node.type === 'blockquote') {
    const content = node.content?.map(child => serializeNode(child)).join('') || '';
    return `<blockquote>${content}</blockquote>`;
  }
  
  if (node.type === 'codeBlock') {
    const text = node.content?.map(child => child.text || '').join('') || '';
    return `<pre><code>${text}</code></pre>`;
  }
  
  return '';
}

/**
 * Serialize inline content (text, citations, etc.)
 */
function serializeInlineContent(content: EditorContent[]): string {
  let html = '';
  
  for (const node of content) {
    if (node.type === 'text') {
      let text = node.text || '';
      
      // Apply marks
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'strong') text = `<strong>${text}</strong>`;
          if (mark.type === 'em') text = `<em>${text}</em>`;
          if (mark.type === 'code') text = `<code>${text}</code>`;
          if (mark.type === 'link') text = `<a href="${mark.attrs.href}">${text}</a>`;
        }
      }
      
      html += text;
    } else if (node.type === 'citation') {
      // Serialize citation with all attributes (use camelCase to match CitationExtension)
      const attrs = node.attrs || {};
      html += `<span data-type="citation" `;
      html += `data-citation-id="${attrs.citationId || ''}" `;
      html += `data-source-id="${attrs.sourceId || ''}" `;
      html += `data-source-title="${attrs.sourceTitle || ''}" `;
      html += `data-citation-type="${attrs.citationType || 'reference'}" `;
      html += `data-reference="${attrs.reference || ''}" `;
      html += `data-page-number="${attrs.pageNumber || ''}" `;
      html += `data-chapter-number="${attrs.chapterNumber || ''}" `;
      html += `data-section-number="${attrs.sectionNumber || ''}" `;
      html += `data-daf-number="${attrs.dafNumber || ''}" `;
      html += `data-halacha-number="${attrs.halachaNumber || ''}" `;
      html += `data-verse-number="${attrs.verseNumber || ''}" `;
      html += `data-custom-reference="${attrs.customReference || ''}" `;
      html += `data-url="${attrs.url || ''}" `;
      html += `data-quote="${attrs.quote || ''}" `;
      html += `data-note="${attrs.note || ''}" `;
      html += `data-statement-id="${attrs.statementId || ''}" `;
      html += `class="citation-ref"></span>`;
    }
  }
  
  return html;
}

/**
 * Parse editor JSON into content blocks
 */
function parseEditorToBlocks(json: ProseMirrorDoc, docId: string | number) {
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
function extractCitations(node: any): CitationData[] {
  const citations: CitationData[] = [];
  
  if (!node.content) return citations;
  
  for (const child of node.content) {
    if (child.type === 'citation' && child.attrs?.source_id) {
      citations.push({
        source_id: child.attrs.source_id,
        citation_type: child.attrs.citation_type || 'page',
        page_number: child.attrs.page_number,
        chapter_number: child.attrs.chapter_number,
        section_number: child.attrs.section_number,
        daf_number: child.attrs.daf_number,
        halacha_number: child.attrs.halacha_number,
        verse_number: child.attrs.verse_number,
        custom_reference: child.attrs.custom_reference,
      });
    }
  }
  
  return citations;
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
async function syncBlockCitations(blockId: number, citations: CitationData[]) {
  // Update content_blocks with citation metadata
  if (citations.length > 0) {
    const primaryCitation = citations[0];
    
    await directus.request(updateItem('content_blocks', blockId, {
      page_number: primaryCitation.page_number,
      chapter_number: primaryCitation.chapter_number,
      section_number: primaryCitation.section_number,
      daf_number: primaryCitation.daf_number,
      halacha_number: primaryCitation.halacha_number,
    }));
  }
}
