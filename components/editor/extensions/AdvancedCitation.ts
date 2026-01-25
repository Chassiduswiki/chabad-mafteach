import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface CitationData {
  id: string;
  sourceId?: string;
  sourceTitle: string;
  reference: string;
  url?: string;
  page?: number;
  verse?: string;
}

export interface AdvancedCitationOptions {
  onCitationClick?: (citation: CitationData) => void;
  onCitationEdit?: (citation: CitationData) => void;
  citations: CitationData[];
}

export const AdvancedCitation = Node.create<AdvancedCitationOptions>({
  name: 'citation',

  group: 'inline',

  inline: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
      onCitationClick: (citation: CitationData) => console.log('Citation clicked:', citation),
      onCitationEdit: (citation: CitationData) => console.log('Citation edit:', citation),
      citations: [],
    };
  },

  addAttributes() {
    return {
      citationId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-citation-id'),
        renderHTML: (attributes: any) => {
          if (!attributes.citationId) return {};
          return { 'data-citation-id': attributes.citationId };
        },
      },
      sourceId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-source-id'),
        renderHTML: (attributes: any) => {
          if (!attributes.sourceId) return {};
          return { 'data-source-id': attributes.sourceId };
        },
      },
      sourceTitle: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-source-title') || '',
        renderHTML: (attributes: any) => {
          if (!attributes.sourceTitle) return {};
          return { 'data-source-title': attributes.sourceTitle };
        },
      },
      reference: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-reference') || '',
        renderHTML: (attributes: any) => {
          if (!attributes.reference) return {};
          return { 'data-reference': attributes.reference };
        },
      },
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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.citation-ref',
      },
      {
        tag: 'span[data-citation-id]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    // Generate a citation ID if none exists
    const citationId = node.attrs.citationId || `cite_${Math.random().toString(36).substring(2, 12)}`;
    const citationText = node.attrs.reference || node.attrs.sourceTitle?.slice(0, 15) || '†';

    // Use the new citation-ref format for consistency between editor and frontend
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'class': 'citation-ref',
        'data-citation-id': citationId,
        'data-source-id': node.attrs.sourceId,
        'data-source-title': node.attrs.sourceTitle,
        'data-reference': node.attrs.reference,
        'data-url': node.attrs.url,
        'data-quote': node.attrs.quote,
        'data-note': node.attrs.note,
        style: 'font-size: 0.85em; color: var(--color-primary); cursor: pointer;',
      }),
      // Keep the display format consistent
      `[${citationText}]`,
    ];
  },

  renderText({ node }) {
    return `[${node.attrs.sourceTitle}${node.attrs.reference ? `, ${node.attrs.reference}` : ''}]`;
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      // Generate a citation ID if none exists
      const citationId = node.attrs.citationId || `cite_${Math.random().toString(36).substring(2, 12)}`;
      
      // Create the citation reference span
      const dom = document.createElement('span');
      dom.className = 'citation-ref';
      dom.setAttribute('data-citation-id', citationId);
      dom.setAttribute('data-source-id', node.attrs.sourceId || '');
      dom.setAttribute('data-source-title', node.attrs.sourceTitle || 'Unknown Source');
      dom.setAttribute('data-reference', node.attrs.reference || '');

      if (node.attrs.url) {
        dom.setAttribute('data-url', node.attrs.url);
      }
      if (node.attrs.quote) {
        dom.setAttribute('data-quote', node.attrs.quote);
      }
      if (node.attrs.note) {
        dom.setAttribute('data-note', node.attrs.note);
      }
      
      // Apply consistent styling
      dom.style.fontSize = '0.85em';
      dom.style.color = node.attrs.sourceId ? 'var(--color-primary)' : '#94a3b8';
      dom.style.cursor = 'pointer';
      dom.style.fontWeight = '600';
      dom.style.transition = 'all 0.2s ease';
      
      // If no sourceId, it's unsynced/needs attention
      if (!node.attrs.sourceId) {
        dom.classList.add('citation-unsynced');
        dom.title = 'Unsynced Citation: Click to add source';
      }
      
      // Set the content as simple bracketed text
      const citationText = node.attrs.reference || node.attrs.sourceTitle?.slice(0, 12) || '†';
      dom.textContent = `[${citationText}]`;

      // Hover effects
      dom.addEventListener('mouseenter', () => {
        dom.style.transform = 'scale(1.1)';
        dom.style.filter = 'brightness(1.2)';
      });
      dom.addEventListener('mouseleave', () => {
        dom.style.transform = 'scale(1)';
        dom.style.filter = 'brightness(1)';
      });

      // Click handler
      dom.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const citationData: CitationData = {
          id: citationId,
          sourceId: node.attrs.sourceId,
          sourceTitle: node.attrs.sourceTitle,
          reference: node.attrs.reference,
          url: node.attrs.url,
        };

        this.options.onCitationClick?.(citationData);
      });

      // Double click for edit
      dom.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const citationData: CitationData = {
          id: citationId,
          sourceId: node.attrs.sourceId,
          sourceTitle: node.attrs.sourceTitle,
          reference: node.attrs.reference,
          url: node.attrs.url,
        };

        this.options.onCitationEdit?.(citationData);
      });

      return {
        dom,
        contentDOM: dom,
      };
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, pos) => {
              if (node.type.name === 'citation') {
                // Add hover tooltip
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: 'citation-tooltip',
                    'data-tooltip': `${node.attrs.sourceTitle}${node.attrs.reference ? ` - ${node.attrs.reference}` : ''}`,
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
