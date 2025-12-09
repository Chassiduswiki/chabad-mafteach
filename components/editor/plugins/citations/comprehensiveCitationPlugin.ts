import { Plugin, PluginKey } from "prosemirror-state";

export const citationPluginKey = new PluginKey("citation-plugin");

interface CitationPluginOptions {
  onTrigger?: (range: { from: number; to: number }) => void;
  onDismiss?: () => void;
}

export function createComprehensiveCitationPlugin(options: CitationPluginOptions = {}) {
  const { onTrigger = () => {}, onDismiss = () => {} } = options;

  return new Plugin({
    key: citationPluginKey,
    props: {
      handleKeyDown(view, event) {
        if (event.key === "@") {
          return false; // Let handleTextInput manage it
        }
        if (event.key === "Escape") {
          onDismiss();
          return false;
        }
        return false;
      },
      handleTextInput(view, from, to, text) {
        if (text === "@") {
          onTrigger({ from, to: from + 1 });
        }
        return false;
      },
    },
  });
}

// Citation insertion utility function
export function insertCitation(
  view: any,
  range: { from: number; to: number } | null,
  source: { id: number; title: string },
  reference: string,
  schema: any
) {
  if (!view || !range) return;

  const citationNode = schema.nodes.citation.create({
    source_id: source.id,
    source_title: source.title,
    reference: reference
  });

  const tr = view.state.tr.replaceWith(
    range.from,
    range.to,
    citationNode
  );
  tr.insertText(" ", range.from + citationNode.nodeSize);
  view.dispatch(tr);
  view.focus();
}
