import { Extension, CommandProps } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiEnhancement: {
      /**
       * Enhance selected text using AI
       */
      enhanceSelection: () => ReturnType;
      /**
       * Translate selected text using AI
       */
      translateSelection: (targetLang?: string) => ReturnType;
      /**
       * Suggest conceptual links for the current selection
       */
      suggestLinks: () => ReturnType;
    };
  }
}

export const AIEnhancementExtension = Extension.create({
  name: 'aiEnhancement',

  addCommands() {
    return {
      enhanceSelection: () => ({ state }: CommandProps) => {
        const { from, to } = state.selection;
        const selectedText = state.doc.textBetween(from, to);
        if (!selectedText) return false;

        window.dispatchEvent(new CustomEvent('ai-enhance-text', { detail: { text: selectedText, from, to } }));
        return true;
      },
      translateSelection: (targetLang?: string) => ({ state }: CommandProps) => {
        const { from, to } = state.selection;
        const selectedText = state.doc.textBetween(from, to);
        if (!selectedText) return false;

        window.dispatchEvent(new CustomEvent('ai-translate-text', { detail: { text: selectedText, targetLang: targetLang || 'en', from, to } }));
        return true;
      },
      suggestLinks: () => ({ state }: CommandProps) => {
        const { from, to } = state.selection;
        const selectedText = state.doc.textBetween(from, to);
        if (!selectedText) return false;

        window.dispatchEvent(new CustomEvent('ai-suggest-links', { detail: { text: selectedText } }));
        return true;
      },
    } as any;
  },
});
