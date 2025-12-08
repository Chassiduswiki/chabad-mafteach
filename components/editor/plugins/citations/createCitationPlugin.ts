import { Plugin, PluginKey } from "prosemirror-state";

export const citationPluginKey = new PluginKey("citation-plugin");

interface CitationPluginOptions {
  onTrigger?: (range: { from: number; to: number }) => void;
  onDismiss?: () => void;
}

export function createCitationPlugin(options: CitationPluginOptions = {}) {
  const { onTrigger = () => {}, onDismiss = () => {} } = options;
  return new Plugin({
    key: citationPluginKey,
    props: {
      handleKeyDown(_view, event) {
        if (event.key === "@") {
          return false; // Let handleTextInput manage it
        }
        if (event.key === "Escape") {
          onDismiss();
          return false;
        }
        return false;
      },
      handleTextInput(_view, from, to, text) {
        if (text === "@") {
          onTrigger({ from, to: from + 1 });
        }
        return false;
      },
    },
  });
}
