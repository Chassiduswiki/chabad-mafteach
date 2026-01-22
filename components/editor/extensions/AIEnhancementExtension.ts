import { Extension } from '@tiptap/core';

export const AIEnhancementExtension = Extension.create({
  name: 'aiEnhancement',

  addCommands() {
    return {
      enhanceSelection: () => ({ state, dispatch }) => {
        const { from, to } = state.selection;
        const selectedText = state.doc.textBetween(from, to);
        if (!selectedText) return false;

        window.dispatchEvent(new CustomEvent('ai-enhance-text', { detail: { text: selectedText, from, to } }));
        return true;
      },
      translateSelection: (targetLang: string) => ({ state }) => {
        const { from, to } = state.selection;
        const selectedText = state.doc.textBetween(from, to);
        if (!selectedText) return false;

        window.dispatchEvent(new CustomEvent('ai-translate-text', { detail: { text: selectedText, targetLang, from, to } }));
        return true;
      },
      suggestLinks: () => ({ state }) => {
        const { from, to } = state.selection;
        const selectedText = state.doc.textBetween(from, to);
        if (!selectedText) return false;

        window.dispatchEvent(new CustomEvent('ai-suggest-links', { detail: { text: selectedText } }));
        return true;
      },
    };
  },
});
