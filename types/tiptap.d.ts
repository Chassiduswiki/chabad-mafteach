import { Editor } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiEnhancement: {
      enhanceSelection: () => ReturnType;
      translateSelection: (targetLang: string) => ReturnType;
      suggestLinks: () => ReturnType;
    };
  }
}
