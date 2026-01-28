import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface InlineAISuggestionOptions {
  debounceMs?: number;
  minCharsBeforeSuggest?: number;
  onGetSuggestion?: (context: SuggestionContext) => Promise<string | null>;
  enabled?: boolean;
}

export interface SuggestionContext {
  textBefore: string;
  currentParagraph: string;
  sectionType?: string;
  topicTitle?: string;
  topicType?: string;
}

const PLUGIN_KEY = new PluginKey('inlineAISuggestion');

export const InlineAISuggestionExtension = Extension.create<InlineAISuggestionOptions>({
  name: 'inlineAISuggestion',

  addOptions() {
    return {
      debounceMs: 500,
      minCharsBeforeSuggest: 20,
      onGetSuggestion: undefined,
      enabled: true,
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const pluginState = PLUGIN_KEY.getState(editor.state);
        if (pluginState?.suggestion) {
          // Accept the suggestion
          const { from, suggestion } = pluginState;
          editor.commands.insertContentAt(from, suggestion);
          return true;
        }
        return false;
      },
      Escape: ({ editor }) => {
        const pluginState = PLUGIN_KEY.getState(editor.state);
        if (pluginState?.suggestion) {
          // Dismiss the suggestion
          editor.view.dispatch(
            editor.state.tr.setMeta(PLUGIN_KEY, { action: 'dismiss' })
          );
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const { options } = this;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let currentSuggestion: string | null = null;
    let suggestionFrom: number | null = null;

    return [
      new Plugin({
        key: PLUGIN_KEY,

        state: {
          init() {
            return { suggestion: null, from: null };
          },
          apply(tr, oldState) {
            const meta = tr.getMeta(PLUGIN_KEY);
            if (meta?.action === 'dismiss') {
              return { suggestion: null, from: null };
            }
            if (meta?.suggestion !== undefined) {
              return { suggestion: meta.suggestion, from: meta.from };
            }
            // Clear suggestion on any document change
            if (tr.docChanged) {
              return { suggestion: null, from: null };
            }
            return oldState;
          },
        },

        props: {
          decorations(state) {
            const pluginState = PLUGIN_KEY.getState(state);
            if (!pluginState?.suggestion) {
              return DecorationSet.empty;
            }

            const { suggestion, from } = pluginState;
            const widget = Decoration.widget(from, () => {
              const span = document.createElement('span');
              span.className = 'inline-ai-suggestion';
              span.textContent = suggestion;
              span.style.cssText = `
                opacity: 0.4;
                font-style: italic;
                pointer-events: none;
                user-select: none;
              `;

              // Add Tab hint
              const hint = document.createElement('span');
              hint.className = 'inline-ai-hint';
              hint.textContent = ' ⇥';
              hint.style.cssText = `
                opacity: 0.3;
                font-size: 0.75em;
                margin-left: 4px;
              `;
              span.appendChild(hint);

              return span;
            }, { side: 1 });

            return DecorationSet.create(state.doc, [widget]);
          },
        },

        view(view) {
          const fetchSuggestion = async () => {
            if (!options.enabled || !options.onGetSuggestion) {
              return;
            }

            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

            // Only suggest at end of text
            if (!selection.empty) {
              return;
            }

            // Get text before cursor
            const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

            if (textBefore.length < (options.minCharsBeforeSuggest || 20)) {
              return;
            }

            // Don't suggest if cursor is in the middle of a word
            if (textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('.')) {
              return;
            }

            const context: SuggestionContext = {
              textBefore: textBefore.slice(-500), // Last 500 chars
              currentParagraph: $from.parent.textContent,
            };

            try {
              const suggestion = await options.onGetSuggestion(context);
              if (suggestion && view.state.selection.from === $from.pos) {
                currentSuggestion = suggestion;
                suggestionFrom = $from.pos;
                view.dispatch(
                  view.state.tr.setMeta(PLUGIN_KEY, {
                    suggestion,
                    from: $from.pos,
                  })
                );
              }
            } catch (error) {
              console.error('Failed to get AI suggestion:', error);
            }
          };

          return {
            update(view, prevState) {
              // Only trigger on text changes
              if (!view.state.doc.eq(prevState.doc)) {
                // Clear any pending debounce
                if (debounceTimer) {
                  clearTimeout(debounceTimer);
                }

                // Clear current suggestion
                currentSuggestion = null;
                suggestionFrom = null;

                // Debounce the fetch
                debounceTimer = setTimeout(fetchSuggestion, options.debounceMs || 500);
              }
            },

            destroy() {
              if (debounceTimer) {
                clearTimeout(debounceTimer);
              }
            },
          };
        },
      }),
    ];
  },
});

export default InlineAISuggestionExtension;
