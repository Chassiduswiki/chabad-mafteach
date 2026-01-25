import { Extension, Editor } from '@tiptap/core';
import { Plugin, PluginKey, EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Node as ProsemirrorNode } from '@tiptap/pm/model';

export interface RealTimeTranslationOptions {
  onTranslateText?: (text: string, targetLang: string) => Promise<string>;
  supportedLanguages?: string[];
  defaultLanguage?: string;
}

interface TranslationState {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  isLoading: boolean;
}

interface RealTimeTranslationStorage {
  translations: Map<string, TranslationState>;
  currentLanguage: string;
  isTranslationMode: boolean;
  toggleTranslationMode: (enabled: boolean) => void;
  setTargetLanguage: (lang: string) => void;
  translateText: (text: string, targetLang: string) => Promise<string>;
  updateAllDecorations: () => void;
  decorationSet: DecorationSet;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    realTimeTranslation: {
      /**
       * Toggle real-time translation mode
       */
      toggleTranslation: () => ReturnType;
      /**
       * Set the target language for translation
       */
      setTranslationLanguage: (language: string) => ReturnType;
      /**
       * Translate the current selection
       */
      translateSelection: (targetLang?: string) => ReturnType;
    };
  }
}

export const RealTimeTranslationExtension = Extension.create<RealTimeTranslationOptions, RealTimeTranslationStorage>({
  name: 'realTimeTranslation',

  addOptions() {
    return {
      supportedLanguages: ['en', 'he', 'ru', 'es', 'fr'],
      defaultLanguage: 'en',
    };
  },

  addStorage() {
    return {
      translations: new Map<string, TranslationState>(),
      currentLanguage: 'en',
      isTranslationMode: false,
      decorationSet: DecorationSet.empty,
      
      toggleTranslationMode: function(enabled: boolean) {
        this.isTranslationMode = enabled;
        this.updateAllDecorations();
      },
      
      setTargetLanguage: function(lang: string) {
        this.currentLanguage = lang;
        this.updateAllDecorations();
      },
      
      translateText: async function(text: string, targetLang: string) {
        // @ts-ignore
        if (!this.options.onTranslateText) return text;
        
        try {
          // @ts-ignore
          const translated = await this.options.onTranslateText(text, targetLang);
          return translated;
        } catch (error) {
          console.error('Translation error:', error);
          return text;
        }
      },
      
      updateAllDecorations: function() {
        // @ts-ignore
        if (!this.editor) return;
        
        const decorations: Decoration[] = [];
        // @ts-ignore
        const { doc } = this.editor.state;
        
        // @ts-ignore
        if (this.isTranslationMode && this.currentLanguage !== this.options.defaultLanguage) {
          doc.descendants((node: ProsemirrorNode, pos: number) => {
            if (node.isText && node.text && node.text.length > 0) {
              const text = node.text;
              const translationKey = `${pos}-${text}`;
              
              let translationState = this.translations.get(translationKey);
              
              if (!translationState || translationState.targetLang !== this.currentLanguage) {
                // Start translation
                // @ts-ignore
                this.translateText(text, this.currentLanguage).then(translated => {
                  translationState = {
                    originalText: text,
                    translatedText: translated,
                    // @ts-ignore
                    sourceLang: this.options.defaultLanguage || 'en',
                    targetLang: this.currentLanguage,
                    isLoading: false
                  };
                  this.translations.set(translationKey, translationState);
                  this.updateAllDecorations();
                });
                
                translationState = {
                  originalText: text,
                  translatedText: '...',
                  // @ts-ignore
                  sourceLang: this.options.defaultLanguage || 'en',
                  targetLang: this.currentLanguage,
                  isLoading: true
                };
                this.translations.set(translationKey, translationState);
              }
              
              const widget = document.createElement('span');
              widget.className = 'real-time-translation';
              widget.setAttribute('data-original', translationState.originalText);
              widget.setAttribute('data-translated', translationState.translatedText);
              widget.setAttribute('data-loading', translationState.isLoading.toString());
              
              if (translationState.isLoading) {
                widget.innerHTML = `
                  <span class="text-muted-foreground italic animate-pulse">
                    Translating...
                  </span>
                `;
              } else {
                widget.textContent = translationState.translatedText;
              }
              
              const decoration = Decoration.widget(pos, widget, {
                side: 1,
              });
              
              decorations.push(decoration);
            }
          });
        }
        
        this.decorationSet = DecorationSet.create(doc, decorations);
        // Trigger a state update to refresh decorations
        // @ts-ignore
        this.editor.view.dispatch(this.editor.state.tr);
      },
    };
  },

  addCommands() {
    return {
      toggleTranslation: () => ({ editor }: { editor: Editor }) => {
        this.storage.toggleTranslationMode(!this.storage.isTranslationMode);
        return true;
      },
      
      setTranslationLanguage: (language: string) => () => {
        this.storage.setTargetLanguage(language);
        return true;
      },
      
      translateSelection: (targetLang?: string) => ({ editor }: { editor: Editor }) => {
        const { from, to, empty } = editor.state.selection;
        if (empty) return false;

        const selectedText = editor.state.doc.textBetween(from, to);
        const lang = targetLang || this.storage.currentLanguage;
        
        this.storage.translateText(selectedText, lang).then(translated => {
          const tr = editor.state.tr.replaceWith(from, to, 
            editor.state.schema.text(translated)
          );
          editor.view.dispatch(tr);
        });
        
        return true;
      },
    } as any;
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-t': () => (this.editor as Editor).commands.toggleTranslation(),
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    return [
      new Plugin({
        key: new PluginKey('realTimeTranslation'),
        props: {
          decorations() {
            return extension.storage.decorationSet;
          },
        },
      }),
    ];
  },
});
