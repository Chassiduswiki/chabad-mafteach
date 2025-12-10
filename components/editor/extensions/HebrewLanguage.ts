import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const HebrewLanguage = Extension.create({
  name: 'hebrewLanguage',

  addOptions() {
    return {
      hebrewRegex: /[\u0590-\u05FF\u200f\u202b\u202c]/g,
      autoDirection: true,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const { doc } = state;

            // Walk through all text nodes
            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const text = node.text;
                const hebrewMatches = text.match(this.options.hebrewRegex);

                if (hebrewMatches && hebrewMatches.length > 0) {
                  // Mark Hebrew text with RTL direction
                  decorations.push(
                    Decoration.inline(pos, pos + text.length, {
                      class: 'hebrew-text',
                      style: 'direction: rtl; text-align: right; font-family: "Noto Sans Hebrew", "Arial Hebrew", "David", serif;',
                    })
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
