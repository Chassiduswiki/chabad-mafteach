/**
 * Citation Integration Module
 * 
 * This module connects the citation serializer with editor components
 * and provides unified methods for citation handling across the application.
 */

import { Editor } from '@tiptap/core';
import { CitationAttrs } from '@/components/editor/plugins/citations/comprehensiveCitationPlugin';
import { CitationData } from '@/components/editor/extensions/AdvancedCitation';
import { 
  serializeCitationToHtml, 
  deserializeHtmlToCitation, 
  enrichHtmlWithCitations,
  extractCitationsFromHtml,
  editorCitationToSourceLink,
  sourceLinkToEditorCitation,
  UnifiedCitation,
  SourceLink,
  Source
} from './citationSerializer';

/**
 * Insert a citation into the editor at the current selection
 */
export function insertCitationInEditor(
  editor: Editor, 
  citation: CitationAttrs | CitationData
): boolean {
  if (!editor || !editor.isEditable) return false;
  
  try {
    // Get current selection
    const { from, to } = editor.state.selection;
    
    // Normalize the citation data to access properties safely
    const normalized = (() => {
      // Type guard for CitationData
      const isCitationData = (c: any): c is CitationData => {
        return 'sourceId' in c && 'sourceTitle' in c;
      };

      // Type guard for CitationAttrs
      const isCitationAttrs = (c: any): c is CitationAttrs => {
        return 'source_id' in c && 'source_title' in c;
      };

      if (isCitationData(citation)) {
        return {
          id: Math.random().toString(36).substring(2, 12),
          sourceId: citation.sourceId,
          sourceTitle: citation.sourceTitle,
          reference: citation.reference,
          url: citation.url,
          page: citation.page,
          verse: citation.verse,
          quote: undefined,
          note: undefined
        };
      } else if (isCitationAttrs(citation)) {
        return {
          id: Math.random().toString(36).substring(2, 12),
          sourceId: citation.source_id,
          sourceTitle: citation.source_title,
          reference: citation.reference,
          url: citation.url,
          page: citation.page_number,
          verse: citation.verse_number,
          quote: citation.quote,
          note: citation.note
        };
      } else {
        throw new Error('Invalid citation format');
      }
    })();
    
    // Create citation node
    const citationNode = editor.schema.nodes.citation.create({
      id: normalized.id,
      sourceId: normalized.sourceId,
      sourceTitle: normalized.sourceTitle,
      reference: normalized.reference,
      url: normalized.url,
      page: normalized.page,
      verse: normalized.verse,
      quote: normalized.quote,
      note: normalized.note
    });
    
    // Create a fragment with the citation node
    const fragment = editor.schema.nodes.paragraph.createChecked(
      {}, [citationNode]
    );
    
    // Insert the citation
    const transaction = editor.state.tr.replaceWith(from, to, fragment);
    editor.view.dispatch(transaction);
    
    return true;
  } catch (error) {
    console.error('Failed to insert citation:', error);
    return false;
  }
}

/**
 * Save content with citations to Directus
 */
export async function saveContentWithCitations(
  html: string,
  topicId: number | string,
  statementId?: number | string
): Promise<{
  content: string;
  citations: SourceLink[];
}> {
  try {
    // Extract citations from HTML
    const citations = extractCitationsFromHtml(html);
    
    // Convert to source links
    const sourceLinks = citations.map(citation => 
      editorCitationToSourceLink(
        citation, 
        statementId ? Number(statementId) : undefined,
        topicId ? Number(topicId) : undefined
      )
    );
    
    // Return processed content and source links
    return {
      content: html,
      citations: sourceLinks
    };
  } catch (error) {
    console.error('Failed to save content with citations:', error);
    throw error;
  }
}

/**
 * Load content with citations from Directus
 */
export function loadContentWithCitations(
  html: string,
  sourceLinks: SourceLink[],
  sources: Source[]
): string {
  try {
    // Convert source links to citation format
    const citations = sourceLinks.map(link => {
      const source = sources.find(s => s.id === link.source_id);
      if (!source) return null;
      return sourceLinkToEditorCitation(link, source);
    }).filter(Boolean) as CitationAttrs[];
    
    // Enrich HTML with citations
    return enrichHtmlWithCitations(html, citations);
  } catch (error) {
    console.error('Failed to load content with citations:', error);
    return html; // Return original HTML on error
  }
}

/**
 * Get all citations from editor content
 */
export function getCitationsFromEditor(editor: Editor): CitationAttrs[] {
  const html = editor.getHTML();
  return extractCitationsFromHtml(html);
}

/**
 * Update citation in editor
 */
export function updateCitationInEditor(
  editor: Editor,
  citationId: string,
  updatedCitation: Partial<CitationAttrs | CitationData>
): boolean {
  try {
    let found = false;
    
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'citation' && node.attrs.id === citationId) {
        // Merge existing attributes with updates
        const newAttrs = { ...node.attrs, ...updatedCitation };
        
        // Create transaction to update the node
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, newAttrs);
        editor.view.dispatch(tr);
        
        found = true;
        return false; // Stop traversal
      }
    });
    
    return found;
  } catch (error) {
    console.error('Failed to update citation:', error);
    return false;
  }
}
