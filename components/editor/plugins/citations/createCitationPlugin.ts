import { Plugin, PluginKey } from "prosemirror-state";

export const citationPluginKey = new PluginKey("citation-plugin");

interface CitationPluginHandlers {
  onTrigger: (range: { from: number; to: number }) => void;
  onDismiss: () => void;
}

export function createCitationPlugin({
  onTrigger,
  onDismiss,
}: CitationPluginHandlers) {
  return new Plugin({
    key: citationPluginKey,
    props: {
      handleKeyDown(_view, event) {
        if (event.key === "@") {
          // Let ProseMirror insert the character first, handle in handleTextInput
          return false;
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
