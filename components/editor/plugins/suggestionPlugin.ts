import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

export const suggestionPluginKey = new PluginKey("suggestion");

export const suggestionPlugin = (
  onTrigger: (range: { from: number; to: number }) => void,
  onDismiss: () => void
) => {
  return new Plugin({
    key: suggestionPluginKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, set) {
        // Adjust decoration positions
        return set.map(tr.mapping, tr.doc);
      },
    },
    props: {
      handleKeyDown(view, event) {
        // Trigger on '@' key
        if (event.key === "@") {
            // We need to wait for the character to be inserted
            // So we use setTimeout or handleTextInput, but handleTextInput is cleaner
            return false; 
        }
        
        // Dismiss on Escape
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
      }
    },
  });
};
