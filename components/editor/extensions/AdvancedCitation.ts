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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-citation-id]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const citationText = `[${node.attrs.sourceTitle}${node.attrs.reference ? `, ${node.attrs.reference}` : ''}]`;

    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-citation-id': node.attrs.citationId,
        'data-source-id': node.attrs.sourceId,
        'data-source-title': node.attrs.sourceTitle,
        'data-reference': node.attrs.reference,
        'data-url': node.attrs.url,
        class: 'citation-node cursor-pointer bg-accent/20 hover:bg-accent/40 px-2 py-1 rounded border border-accent/30 transition-colors duration-200 inline-block mx-1 select-none',
      }),
      citationText,
    ];
  },

  renderText({ node }) {
    return `[${node.attrs.sourceTitle}${node.attrs.reference ? `, ${node.attrs.reference}` : ''}]`;
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('span');
      dom.className = 'citation-node cursor-pointer bg-accent/20 hover:bg-accent/40 px-2 py-1 rounded border border-accent/30 transition-colors duration-200 inline-block mx-1 select-none';
      dom.setAttribute('data-citation-id', node.attrs.citationId);
      dom.setAttribute('data-source-id', node.attrs.sourceId);
      dom.setAttribute('data-source-title', node.attrs.sourceTitle);
      dom.setAttribute('data-reference', node.attrs.reference);

      if (node.attrs.url) {
        dom.setAttribute('data-url', node.attrs.url);
      }

      // Citation text
      const citationText = node.textContent ||
        `[${node.attrs.sourceTitle}${node.attrs.reference ? `, ${node.attrs.reference}` : ''}]`;

      dom.textContent = citationText;

      // Click handler
      dom.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const citationData: CitationData = {
          id: node.attrs.citationId,
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
          id: node.attrs.citationId,
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
