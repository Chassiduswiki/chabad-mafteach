import { Plugin, PluginKey } from "prosemirror-state";

export const citationPluginKey = new PluginKey("citation-plugin");

interface CitationPluginOptions {
  onTrigger?: (range: { from: number; to: number }) => void;
  onDismiss?: () => void;
  onClick?: (citation: {
    source_id: number | string | null;
    source_title: string | null;
    reference: string | null;
  }) => void;
}

export function createComprehensiveCitationPlugin(options: CitationPluginOptions = {}) {
  const { onTrigger = () => {}, onDismiss = () => {}, onClick = () => {} } = options;

  return new Plugin({
    key: citationPluginKey,
    props: {
      handleClick(view, pos, event) {
        const target = event.target as HTMLElement | null;
        if (!target) return false;

        const citationEl = target.closest("[data-type='citation']") as HTMLElement | null;
        if (!citationEl) return false;

        const sourceId = citationEl.getAttribute("data-source-id");
        const sourceTitle = citationEl.getAttribute("data-source-title");
        const reference = citationEl.getAttribute("data-reference");

        onClick({
          source_id: sourceId ? Number(sourceId) || sourceId : null,
          source_title: sourceTitle,
          reference,
        });
        return true;
      },
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
