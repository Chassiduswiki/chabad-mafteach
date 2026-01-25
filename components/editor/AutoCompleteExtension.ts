import { Extension, Editor } from '@tiptap/core';
import { Plugin, PluginKey, EditorState } from '@tiptap/pm/state';

export interface AutoCompleteOptions {
  onGetSuggestions?: (text: string) => Promise<string[]>;
  triggerChars?: string[];
  maxSuggestions?: number;
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

interface Suggestion {
  text: string;
  type: 'topic' | 'source' | 'template';
  relevance?: number;
}

interface AutoCompleteStorage {
  suggestions: Suggestion[];
  selectedIndex: number;
  isVisible: boolean;
  triggerPosition: number | null;
  showSuggestions: (text: string, position: number) => Promise<void>;
  hideSuggestions: () => void;
  selectSuggestion: () => void;
  navigateSuggestions: (direction: 'up' | 'down') => void;
  updateSuggestionsWidget: () => void;
  findTriggerPosition: (state: EditorState) => number | null;
}

export const AutoCompleteExtension = Extension.create<AutoCompleteOptions, AutoCompleteStorage>({
  name: 'autoComplete',

  addOptions() {
    return {
      triggerChars: ['@', '#', '/'],
      maxSuggestions: 5,
    };
  },

  addStorage() {
    return {
      suggestions: [],
      selectedIndex: 0,
      isVisible: false,
      triggerPosition: null,
      
      showSuggestions: async function(text: string, position: number) {
        // @ts-ignore
        if (!this.options.onGetSuggestions) return;
        
        try {
          // @ts-ignore
          const suggestions = await this.options.onGetSuggestions(text);
          this.suggestions = suggestions.map((text: string) => ({
            text,
            type: 'topic' as const,
            relevance: 100
          }));
          this.selectedIndex = 0;
          this.isVisible = true;
          this.triggerPosition = position;
          this.updateSuggestionsWidget();
        } catch (error) {
          console.error('Auto-complete error:', error);
        }
      },
      
      hideSuggestions: function() {
        this.isVisible = false;
        this.suggestions = [];
        this.selectedIndex = 0;
        this.triggerPosition = null;
        this.updateSuggestionsWidget();
      },
      
      selectSuggestion: function() {
        if (this.suggestions.length === 0) return;
        
        const suggestion = this.suggestions[this.selectedIndex];
        // @ts-ignore
        if (!this.editor || this.triggerPosition === null) return;
        
        // @ts-ignore
        const { state } = this.editor;
        const { tr } = state;
        
        // Find the trigger character position
        const triggerPos = this.findTriggerPosition(state);
        if (triggerPos === null) return;
        
        // Replace from trigger to cursor with suggestion
        const from = triggerPos;
        const to = state.selection.from;
        
        const transaction = tr.replaceWith(from, to, 
          state.schema.text(suggestion.text)
        );
        
        // @ts-ignore
        this.editor.view.dispatch(transaction);
        this.hideSuggestions();
      },
      
      navigateSuggestions: function(direction: 'up' | 'down') {
        if (!this.isVisible || this.suggestions.length === 0) return;
        
        if (direction === 'up') {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        } else {
          this.selectedIndex = Math.min(this.suggestions.length - 1, this.selectedIndex + 1);
        }
        this.updateSuggestionsWidget();
      },
      
      findTriggerPosition: function(state: EditorState) {
        const { $from } = state.selection;
        const text = state.doc.textBetween(0, $from.pos);
        
        for (let i = text.length - 1; i >= 0; i--) {
          const char = text[i];
          // @ts-ignore
          if (this.options.triggerChars?.includes(char)) {
            return i + 1;
          }
        }
        
        return null;
      },
      
      updateSuggestionsWidget: function() {
        // @ts-ignore
        if (!this.editor) return;
        
        const event = new CustomEvent('suggestionsUpdate', {
          detail: {
            suggestions: this.suggestions,
            selectedIndex: this.selectedIndex,
            isVisible: this.isVisible,
            position: this.triggerPosition
          }
        });
        
        // @ts-ignore
        this.editor.view.dom.dispatchEvent(event);
      },
    };
  },

  addCommands() {
    return {
      triggerAutoComplete: () => ({ editor }: { editor: Editor }) => {
        const { state } = editor;
        const { $from } = state.selection;
        
        if ($from.pos === 0) return false;
        
        const text = state.doc.textBetween(0, $from.pos);
        const lastChar = text[text.length - 1];
        
        if (this.options.triggerChars?.includes(lastChar)) {
          this.storage.showSuggestions(text, $from.pos);
          return true;
        }
        
        return false;
      },
      insertSuggestedCitation: (suggestion: CitationSuggestion) => ({ editor }: { editor: Editor }) => {
        const { to } = editor.state.selection;
        
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
      },
    } as any;
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('autoComplete'),
        props: {
          handleKeyDown: (view, event) => {
            if (event.key === 'Escape') {
              this.storage.hideSuggestions();
              return true;
            }
            
            if (event.key === 'ArrowUp') {
              this.storage.navigateSuggestions('up');
              return true;
            }
            
            if (event.key === 'ArrowDown') {
              this.storage.navigateSuggestions('down');
              return true;
            }
            
            if (event.key === 'Enter' || event.key === 'Tab') {
              this.storage.selectSuggestion();
              return true;
            }
            
            return false;
          },
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Escape': () => {
        this.storage.hideSuggestions();
        return true;
      },
    };
  },
});
