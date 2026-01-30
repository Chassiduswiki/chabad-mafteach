/**
 * Unified Citation Extension
 *
 * Consolidates functionality from:
 * - Unified citation system (node definition, rendering, click handlers)
 * - SmartCitationExtension.ts (AI suggestions, keyboard shortcuts)
 * - Legacy citation plugins (@ trigger, ProseMirror plugin)
 *
 * Features:
 * - Single citation node definition
 * - @ trigger for citation insertion
 * - Click handlers (single vs double click)
 * - Keyboard shortcuts (Ctrl+Shift+S)
 * - AI-powered citation suggestions
 * - Consistent 0.75em styling
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
  UnifiedCitation,
  CitationAttrs,
  CitationData,
  CitationSuggestion,
  attrsToUnified,
  unifiedToAttrs,
  formatCitationReference,
  isStatementLevel,
} from '@/lib/citations/types';

// ============================================================================
// PLUGIN KEY
// ============================================================================

export const citationPluginKey = new PluginKey('unified-citation-plugin');

// ============================================================================
// OPTIONS INTERFACE
// ============================================================================

export interface UnifiedCitationOptions {
  // Click handlers
  onCitationClick?: (citation: UnifiedCitation, pos: number) => void;
  onCitationEdit?: (citation: UnifiedCitation, pos: number) => void;

  // @ trigger handlers
  onTrigger?: (range: { from: number; to: number }) => void;
  onDismiss?: () => void;

  // AI suggestion handlers
  onSuggestCitations?: (suggestions: CitationSuggestion[]) => void;
  onInsertCitation?: (citation: CitationSuggestion) => void;

  // Context
  topicId?: number;
  statementId?: number | null;

  // Existing citations for deduplication
  citations?: UnifiedCitation[];
}

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citation: {
      /**
       * Insert a citation at the current position
       */
      insertCitation: (citation: UnifiedCitation) => ReturnType;

      /**
       * Update an existing citation
       */
      updateCitation: (pos: number, citation: UnifiedCitation) => ReturnType;

      /**
       * Delete a citation at position
       */
      deleteCitation: (pos: number) => ReturnType;

      /**
       * Suggest citations based on selected text
       */
      suggestCitations: () => ReturnType;

      /**
       * Insert a suggested citation
       */
      insertSuggestedCitation: (suggestion: CitationSuggestion) => ReturnType;
    };
  }
}

// ============================================================================
// UNIFIED CITATION NODE
// ============================================================================

export const UnifiedCitationNode = Node.create<UnifiedCitationOptions>({
  name: 'citation',

  group: 'inline',

  inline: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
      onCitationClick: (citation: UnifiedCitation, pos: number) =>
        console.log('Citation clicked:', citation, 'at', pos),
      onCitationEdit: (citation: UnifiedCitation, pos: number) =>
        console.log('Citation edit:', citation, 'at', pos),
      onTrigger: () => {},
      onDismiss: () => {},
      onSuggestCitations: () => {},
      onInsertCitation: () => {},
      citations: [],
    };
  },

  // ============================================================================
  // ATTRIBUTES - Unified format
  // ============================================================================

  addAttributes() {
    return {
      // Identity
      citationId: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-citation-id'),
        renderHTML: (attributes: any) => {
          if (!attributes.citationId) return {};
          return { 'data-citation-id': attributes.citationId };
        },
      },

      // Source reference
      sourceId: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-source-id'),
        renderHTML: (attributes: any) => {
          if (!attributes.sourceId) return {};
          return { 'data-source-id': attributes.sourceId };
        },
      },

      sourceTitle: {
        default: '',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-source-title') || '',
        renderHTML: (attributes: any) => {
          if (!attributes.sourceTitle) return {};
          return { 'data-source-title': attributes.sourceTitle };
        },
      },

      // Citation type
      citationType: {
        default: 'reference',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-citation-type') || 'reference',
        renderHTML: (attributes: any) => ({
          'data-citation-type': attributes.citationType || 'reference',
        }),
      },

      // Reference details
      reference: {
        default: '',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-reference') || '',
        renderHTML: (attributes: any) => {
          if (!attributes.reference) return {};
          return { 'data-reference': attributes.reference };
        },
      },

      pageNumber: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-page-number'),
        renderHTML: (attributes: any) => {
          if (!attributes.pageNumber) return {};
          return { 'data-page-number': attributes.pageNumber };
        },
      },

      chapterNumber: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const val = element.getAttribute('data-chapter-number');
          return val ? parseInt(val) : null;
        },
        renderHTML: (attributes: any) => {
          if (!attributes.chapterNumber) return {};
          return { 'data-chapter-number': attributes.chapterNumber };
        },
      },

      sectionNumber: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const val = element.getAttribute('data-section-number');
          return val ? parseInt(val) : null;
        },
        renderHTML: (attributes: any) => {
          if (!attributes.sectionNumber) return {};
          return { 'data-section-number': attributes.sectionNumber };
        },
      },

      verseNumber: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-verse-number'),
        renderHTML: (attributes: any) => {
          if (!attributes.verseNumber) return {};
          return { 'data-verse-number': attributes.verseNumber };
        },
      },

      dafNumber: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-daf-number'),
        renderHTML: (attributes: any) => {
          if (!attributes.dafNumber) return {};
          return { 'data-daf-number': attributes.dafNumber };
        },
      },

      halachaNumber: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const val = element.getAttribute('data-halacha-number');
          return val ? parseInt(val) : null;
        },
        renderHTML: (attributes: any) => {
          if (!attributes.halachaNumber) return {};
          return { 'data-halacha-number': attributes.halachaNumber };
        },
      },

      customReference: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-custom-reference'),
        renderHTML: (attributes: any) => {
          if (!attributes.customReference) return {};
          return { 'data-custom-reference': attributes.customReference };
        },
      },

      // Metadata
      url: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-url'),
        renderHTML: (attributes: any) => {
          if (!attributes.url) return {};
          return { 'data-url': attributes.url };
        },
      },

      quote: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-quote'),
        renderHTML: (attributes: any) => {
          if (!attributes.quote) return {};
          return { 'data-quote': attributes.quote };
        },
      },

      note: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-note'),
        renderHTML: (attributes: any) => {
          if (!attributes.note) return {};
          return { 'data-note': attributes.note };
        },
      },

      // Context (statement vs topic level)
      statementId: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const val = element.getAttribute('data-statement-id');
          return val ? parseInt(val) : null;
        },
        renderHTML: (attributes: any) => {
          if (!attributes.statementId) return {};
          return { 'data-statement-id': attributes.statementId };
        },
      },
    };
  },

  // ============================================================================
  // PARSING
  // ============================================================================

  parseHTML() {
    return [
      {
        tag: 'span.citation-ref',
      },
      {
        tag: 'span[data-citation-id]',
      },
      {
        tag: 'span[data-type="citation"]',
      },
    ];
  },

  // ============================================================================
  // RENDERING
  // ============================================================================

  renderHTML({ node, HTMLAttributes }) {
    try {
      // Generate citation ID if missing
      const citationId =
        node.attrs.citationId || `cite_${Math.random().toString(36).substring(2, 12)}`;

      // Convert to UnifiedCitation for formatting
      const unified: UnifiedCitation = {
        id: citationId,
        sourceId: node.attrs.sourceId,
        sourceTitle: node.attrs.sourceTitle || 'Unknown Source',
        citationType: node.attrs.citationType || 'custom',
        reference: node.attrs.reference,
        pageNumber: node.attrs.pageNumber,
        chapterNumber: node.attrs.chapterNumber,
        sectionNumber: node.attrs.sectionNumber,
        verseNumber: node.attrs.verseNumber,
        dafNumber: node.attrs.dafNumber,
        halachaNumber: node.attrs.halachaNumber,
        customReference: node.attrs.customReference,
        quote: node.attrs.quote,
        note: node.attrs.note,
        url: node.attrs.url,
        statementId: node.attrs.statementId,
      };

      // Format citation text for display with error handling
      let displayText = 'Citation';
      try {
        displayText = formatCitationReference(unified);
      } catch (error) {
        console.warn('Failed to format citation:', error, unified);
        displayText = unified.sourceTitle || 'Citation';
      }

      // Determine CSS class based on sync status
      let cssClass = 'citation-ref';
      if (node.attrs.sourceId) {
        cssClass += ' citation-synced';
      } else {
        cssClass += ' citation-unsynced';
      }

      // Add statement/topic level class
      if (isStatementLevel(unified)) {
        cssClass += ' citation-statement-level';
      } else {
        cssClass += ' citation-topic-level';
      }

      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          class: cssClass,
          'data-type': 'citation',
          'data-citation-id': citationId,
          'data-citation-type': node.attrs.citationType || '',
          'data-source-id': node.attrs.sourceId || '',
          'data-source-title': node.attrs.sourceTitle || '',
          'data-reference': node.attrs.reference || '',
          'data-page-number': node.attrs.pageNumber || '',
          'data-chapter-number': node.attrs.chapterNumber || '',
          'data-section-number': node.attrs.sectionNumber || '',
          'data-verse-number': node.attrs.verseNumber || '',
          'data-daf-number': node.attrs.dafNumber || '',
          'data-halacha-number': node.attrs.halachaNumber || '',
          'data-custom-reference': node.attrs.customReference || '',
          'data-url': node.attrs.url || '',
          'data-quote': node.attrs.quote || '',
          'data-note': node.attrs.note || '',
          'data-statement-id': node.attrs.statementId || '',
        }),
        `[${displayText}]`,
      ];
    } catch (error) {
      console.error('Citation rendering error:', error);
      // Fallback rendering
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          class: 'citation-ref citation-error',
          'data-type': 'citation',
        }),
        '[Citation Error]',
      ];
    }
  },

  renderText({ node }) {
    try {
      const unified: UnifiedCitation = {
        id: node.attrs.citationId || 'unknown',
        sourceId: node.attrs.sourceId ?? null,
        sourceTitle: node.attrs.sourceTitle || 'Unknown Source',
        citationType: node.attrs.citationType || 'custom',
        reference: node.attrs.reference,
        chapterNumber: node.attrs.chapterNumber,
        sectionNumber: node.attrs.sectionNumber,
        pageNumber: node.attrs.pageNumber,
        verseNumber: node.attrs.verseNumber,
        dafNumber: node.attrs.dafNumber,
        halachaNumber: node.attrs.halachaNumber,
        customReference: node.attrs.customReference,
        quote: node.attrs.quote,
        note: node.attrs.note,
        url: node.attrs.url,
        statementId: node.attrs.statementId,
      };
      return `[${formatCitationReference(unified)}]`;
    } catch (error) {
      console.warn('Citation text rendering error:', error);
      return '[Citation]';
    }
  },

  // ============================================================================
  // NODE VIEW (Interactive rendering)
  // ============================================================================

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const citationId =
        node.attrs.citationId || `cite_${Math.random().toString(36).substring(2, 12)}`;

      // Create DOM element
      const dom = document.createElement('span');
      dom.className = 'citation-ref';
      dom.setAttribute('data-type', 'citation');
      dom.setAttribute('data-citation-id', citationId);
      dom.setAttribute('data-citation-type', node.attrs.citationType);
      dom.setAttribute('data-source-id', node.attrs.sourceId || '');
      dom.setAttribute('data-source-title', node.attrs.sourceTitle || '');

      // Apply styling based on sync status
      dom.style.fontSize = '0.75em';
      dom.style.fontWeight = '600';
      dom.style.cursor = 'pointer';
      dom.style.transition = 'all 0.2s ease';

      if (node.attrs.sourceId) {
        dom.style.color = 'var(--color-primary)';
        dom.classList.add('citation-synced');
      } else {
        dom.style.color = '#94a3b8';
        dom.style.opacity = '0.7';
        dom.classList.add('citation-unsynced');
        dom.title = 'Unsynced Citation: Click to add source';
      }

      // Set display text
      const unified: UnifiedCitation = {
        id: node.attrs.citationId || 'unknown',
        sourceId: node.attrs.sourceId ?? null,
        sourceTitle: node.attrs.sourceTitle || 'Unknown Source',
        citationType: node.attrs.citationType || 'custom',
        reference: node.attrs.reference,
        chapterNumber: node.attrs.chapterNumber,
        sectionNumber: node.attrs.sectionNumber,
        pageNumber: node.attrs.pageNumber,
        verseNumber: node.attrs.verseNumber,
        dafNumber: node.attrs.dafNumber,
        halachaNumber: node.attrs.halachaNumber,
        customReference: node.attrs.customReference,
        quote: node.attrs.quote,
        note: node.attrs.note,
        url: node.attrs.url,
        statementId: node.attrs.statementId,
      };
      const displayText = formatCitationReference(unified);
      dom.textContent = `[${displayText}]`;

      // Hover effects
      dom.addEventListener('mouseenter', () => {
        dom.style.transform = 'scale(1.1)';
        dom.style.filter = 'brightness(1.2)';
      });
      dom.addEventListener('mouseleave', () => {
        dom.style.transform = 'scale(1)';
        dom.style.filter = 'brightness(1)';
      });

      // Single click handler
      dom.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const pos = typeof getPos === 'function' ? getPos() : 0;
        const citation: UnifiedCitation = {
          id: citationId,
          sourceId: node.attrs.sourceId ?? null,
          sourceTitle: node.attrs.sourceTitle || 'Unknown Source',
          citationType: node.attrs.citationType || 'custom',
          reference: node.attrs.reference,
          pageNumber: node.attrs.pageNumber,
          chapterNumber: node.attrs.chapterNumber,
          sectionNumber: node.attrs.sectionNumber,
          verseNumber: node.attrs.verseNumber,
          dafNumber: node.attrs.dafNumber,
          halachaNumber: node.attrs.halachaNumber,
          customReference: node.attrs.customReference,
          url: node.attrs.url,
          quote: node.attrs.quote,
          note: node.attrs.note,
          statementId: node.attrs.statementId,
        };
        
        if (this.options.onCitationClick && typeof pos === 'number') {
          this.options.onCitationClick(citation, pos);
        }
      });

      // Double click for edit
      dom.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const pos = typeof getPos === 'function' ? getPos() : 0;
        const citation: UnifiedCitation = {
          id: citationId,
          sourceId: node.attrs.sourceId ?? null,
          sourceTitle: node.attrs.sourceTitle || 'Unknown Source',
          citationType: node.attrs.citationType || 'custom',
          reference: node.attrs.reference,
          pageNumber: node.attrs.pageNumber,
          chapterNumber: node.attrs.chapterNumber,
          sectionNumber: node.attrs.sectionNumber,
          verseNumber: node.attrs.verseNumber,
          dafNumber: node.attrs.dafNumber,
          halachaNumber: node.attrs.halachaNumber,
          customReference: node.attrs.customReference,
          url: node.attrs.url,
          quote: node.attrs.quote,
          note: node.attrs.note,
          statementId: node.attrs.statementId,
        };
        
        if (this.options.onCitationEdit && typeof pos === 'number') {
          this.options.onCitationEdit(citation, pos);
        }
      });

      return {
        dom,
        contentDOM: dom,
      };
    };
  },

  // ============================================================================
  // COMMANDS
  // ============================================================================

  addCommands() {
    return {
      insertCitation:
        (citation: UnifiedCitation) =>
        ({ commands, state }) => {
          const { selection } = state;
          const citationNode = this.type.create({
            citationId: citation.id || `cite_${Math.random().toString(36).substring(2, 12)}`,
            sourceId: citation.sourceId,
            sourceTitle: citation.sourceTitle,
            citationType: citation.citationType,
            reference: citation.reference,
            pageNumber: citation.pageNumber,
            chapterNumber: citation.chapterNumber,
            sectionNumber: citation.sectionNumber,
            verseNumber: citation.verseNumber,
            dafNumber: citation.dafNumber,
            halachaNumber: citation.halachaNumber,
            customReference: citation.customReference,
            url: citation.url,
            quote: citation.quote,
            note: citation.note,
            statementId: citation.statementId,
          });

          return commands.insertContentAt(selection.to, [citationNode, { type: 'text', text: ' ' }]);
        },

      updateCitation:
        (pos: number, citation: UnifiedCitation) =>
        ({ tr, dispatch }) => {
          const node = tr.doc.nodeAt(pos);
          if (!node || node.type.name !== 'citation') return false;

          const updatedNode = this.type.create({
            ...node.attrs,
            sourceId: citation.sourceId,
            sourceTitle: citation.sourceTitle,
            citationType: citation.citationType,
            reference: citation.reference,
            pageNumber: citation.pageNumber,
            chapterNumber: citation.chapterNumber,
            sectionNumber: citation.sectionNumber,
            verseNumber: citation.verseNumber,
            dafNumber: citation.dafNumber,
            halachaNumber: citation.halachaNumber,
            customReference: citation.customReference,
            url: citation.url,
            quote: citation.quote,
            note: citation.note,
            statementId: citation.statementId,
          });

          if (dispatch) {
            tr.replaceWith(pos, pos + node.nodeSize, updatedNode);
            dispatch(tr);
          }

          return true;
        },

      deleteCitation:
        (pos: number) =>
        ({ tr, dispatch }) => {
          const node = tr.doc.nodeAt(pos);
          if (!node || node.type.name !== 'citation') return false;

          if (dispatch) {
            tr.delete(pos, pos + node.nodeSize);
            dispatch(tr);
          }

          return true;
        },

      suggestCitations:
        () =>
        ({ editor, state }) => {
          const { from, to, empty } = state.selection;
          if (empty) return false;

          const selectedText = state.doc.textBetween(from, to);
          if (!selectedText || selectedText.length < 3) return false;

          // Trigger AI citation suggestion
          this.storage.triggerCitationSuggestion(selectedText, from, to);
          return true;
        },

      insertSuggestedCitation:
        (suggestion: CitationSuggestion) =>
        ({ commands, state }) => {
          const unified: UnifiedCitation = {
            id: suggestion.id,
            sourceId: suggestion.sourceId,
            sourceTitle: suggestion.sourceTitle,
            citationType: 'reference',
            reference: suggestion.reference,
            quote: suggestion.quote,
            url: suggestion.url,
            relevanceScore: suggestion.relevanceScore,
          };

          return commands.insertCitation(unified);
        },
    };
  },

  // ============================================================================
  // STORAGE (AI Suggestion)
  // ============================================================================

  addStorage() {
    return {
      triggerCitationSuggestion: async (text: string, from: number, to: number) => {
        try {
          const response = await fetch('/api/ai/find-citations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: text,
              context: 'editor_selection',
              topicId: this.options.topicId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.citations) {
              this.options.onSuggestCitations?.(data.citations);
            }
          }
        } catch (error) {
          console.error('Citation suggestion error:', error);
        }
      },
    };
  },

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  addKeyboardShortcuts() {
    return {
      // Ctrl+Shift+S: Suggest citations for selected text
      'Mod-Shift-s': () => this.editor.commands.suggestCitations(),

      // Escape: Dismiss citation modal/palette
      Escape: () => {
        this.options.onDismiss?.();
        return false; // Allow other handlers
      },
    };
  },

  // ============================================================================
  // PROSEMIRROR PLUGINS
  // ============================================================================

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      // Citation interaction plugin
      new Plugin({
        key: citationPluginKey,
        props: {
          // @ trigger for citation insertion
          handleTextInput(view, from, to, text) {
            if (text === '@') {
              options.onTrigger?.({ from, to: from + 1 });
              return false; // Allow @ to be inserted
            }
            return false;
          },

          // Tooltip decorations
          decorations: (state) => {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, pos) => {
              if (node.type.name === 'citation') {
                const unified: UnifiedCitation = {
                  id: node.attrs.citationId || 'unknown',
                  sourceId: node.attrs.sourceId ?? null,
                  sourceTitle: node.attrs.sourceTitle || 'Unknown Source',
                  citationType: node.attrs.citationType || 'custom',
                  reference: node.attrs.reference,
                  chapterNumber: node.attrs.chapterNumber,
                  sectionNumber: node.attrs.sectionNumber,
                  pageNumber: node.attrs.pageNumber,
                  verseNumber: node.attrs.verseNumber,
                  dafNumber: node.attrs.dafNumber,
                  halachaNumber: node.attrs.halachaNumber,
                  customReference: node.attrs.customReference,
                  quote: node.attrs.quote,
                  note: node.attrs.note,
                  url: node.attrs.url,
                  statementId: node.attrs.statementId,
                };

                const tooltipText = formatCitationReference(unified);
                const fullTooltip = unified.quote
                  ? `${tooltipText}\n\n"${unified.quote}"`
                  : tooltipText;

                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: 'citation-tooltip',
                    'data-tooltip': fullTooltip,
                  })
                );
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export default UnifiedCitationNode;
