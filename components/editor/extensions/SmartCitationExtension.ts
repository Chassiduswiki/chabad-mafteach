import { Extension } from '@tiptap/core';
import { Editor } from '@tiptap/react';

export interface SmartCitationOptions {
  onSuggestCitations?: (suggestions: CitationSuggestion[]) => void;
  onInsertCitation?: (citation: CitationSuggestion) => void;
  topicId?: string;
}

export interface CitationSuggestion {
  id: string;
  sourceId: string | number;
  sourceTitle: string;
  reference: string;
  relevanceScore: number;
  quote?: string;
  url?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    smartCitation: {
      /**
       * Suggest citations based on selected text
       */
      suggestCitations: () => ReturnType;
      /**
       * Insert a suggested citation
       */
      insertSuggestedCitation: (suggestion: CitationSuggestion) => ReturnType;
    };
  }
}

export const SmartCitationExtension = Extension.create<SmartCitationOptions>({
  name: 'smartCitation',

  addOptions() {
    return {
      topicId: undefined,
    };
  },

  addCommands() {
    return {
      suggestCitations: () => {  
        return ({ editor }: { editor: Editor }) => {
          const { from, to, empty } = editor.state.selection;
          if (empty) return false;

          const selectedText = editor.state.doc.textBetween(from, to);
          if (!selectedText || selectedText.length < 3) return false;

          const storage = this.storage as any;
          storage.triggerCitationSuggestion(selectedText, from, to);
          return true;
        };
      },

      insertSuggestedCitation: (suggestion: CitationSuggestion) => {
        return ({ editor }: { editor: Editor }) => {
          const { to } = editor.state.selection;
          
          // Insert citation node at the end of the selection
          editor.commands.insertContentAt(to, {
            type: 'citation',
            attrs: {
              citationId: suggestion.id || `cite_${Math.random().toString(36).substring(2, 12)}`,
              sourceId: suggestion.sourceId,
              sourceTitle: suggestion.sourceTitle,
              reference: suggestion.reference,
              url: suggestion.url,
              quote: suggestion.quote,
            },
          });

          return true;
        };
      },
    };
  },

  addStorage() {
    return {
      triggerCitationSuggestion: async (text: string, from: number, to: number) => {
        try {
          const response = await fetch('/api/ai/find-citations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: text,
              context: 'editor_selection',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.citations) {
              this.options.onSuggestCitations?.(data.citations);
            }
          }
        } catch (error) {
          console.error('Citation suggestion error:', error);
        }
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-s': () => this.editor.commands.suggestCitations(),
    };
  },
});
