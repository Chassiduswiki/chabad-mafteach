import { Extension } from '@tiptap/core';
import { HebrewLanguage } from './HebrewLanguage';
import { HebrewOCR } from './HebrewOCR';
import CitationExtension from './citation/CitationExtension';
import { AIEnhancementExtension } from './AIEnhancementExtension';
import { RealTimeTranslationExtension } from './RealTimeTranslationExtension';
import { AutoCompleteExtension } from '../AutoCompleteExtension';
import { InlineAISuggestionExtension, SuggestionContext } from './InlineAISuggestionExtension';

export { InlineAISuggestionExtension } from './InlineAISuggestionExtension';
export type { InlineAISuggestionOptions, SuggestionContext } from './InlineAISuggestionExtension';

export const createTipTapExtensions = (options?: {
  onCitationClick?: (citation: any, pos: number) => void;
  onCitationEdit?: (citation: any, pos: number) => void;
  onTrigger?: (range: { from: number; to: number }) => void;
  onDismiss?: () => void;
  onOCRResult?: (text: string) => void;
  onOCRError?: (error: string) => void;
  onSuggestCitations?: (suggestions: any[]) => void;
  onTranslateText?: (text: string, targetLang: string) => Promise<string>;
  onGetAutocompleteSuggestions?: (text: string) => Promise<string[]>;
  topicId?: string;
}) => {
  return [
    // Base extensions
    Extension.create({
      name: 'customKeyboardShortcuts',
      addKeyboardShortcuts() {
        return {
          'Mod-b': () => this.editor.commands.toggleBold(),
          'Mod-i': () => this.editor.commands.toggleItalic(),
          'Mod-u': () => this.editor.commands.toggleUnderline(),
          'Mod-Shift-7': () => this.editor.commands.toggleBulletList(),
          'Mod-Shift-8': () => this.editor.commands.toggleOrderedList(),
          'Mod-Shift-9': () => this.editor.commands.toggleBlockquote(),
          'Mod-Shift-c': () => this.editor.commands.toggleCodeBlock(),
        };
      },
    }),

    // Base extensions

    // Hebrew language support
    HebrewLanguage,

    // Hebrew OCR support
    HebrewOCR.configure({
      onOCRResult: options?.onOCRResult,
      onOCRError: options?.onOCRError,
    }),

    // Unified citation system (node, commands, AI suggestions, keyboard shortcuts)
    CitationExtension.configure({
      onCitationClick: options?.onCitationClick,
      onCitationEdit: options?.onCitationEdit,
      onTrigger: options?.onTrigger,
      onDismiss: options?.onDismiss,
      onSuggestCitations: options?.onSuggestCitations,
      topicId: options?.topicId ? parseInt(options.topicId) : undefined,
    }),

    // Real-time Translation
    RealTimeTranslationExtension.configure({
      onTranslateText: options?.onTranslateText,
    }),

    // Auto-complete
    AutoCompleteExtension.configure({
      onGetSuggestions: options?.onGetAutocompleteSuggestions,
    }),

    // AI Enhancement extension
    AIEnhancementExtension,
  ];
};
