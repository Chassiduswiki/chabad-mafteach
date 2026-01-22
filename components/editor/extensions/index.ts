import { Extension } from '@tiptap/core';
import { HebrewLanguage } from './HebrewLanguage';
import { HebrewOCR } from './HebrewOCR';
import { AdvancedCitation } from './AdvancedCitation';
import { AIEnhancementExtension } from './AIEnhancementExtension';

export const createTipTapExtensions = (options?: {
  onCitationClick?: (citation: any) => void;
  onCitationEdit?: (citation: any) => void;
  onOCRResult?: (text: string) => void;
  onOCRError?: (error: string) => void;
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

    // Hebrew language support
    HebrewLanguage,

    // Hebrew OCR support
    HebrewOCR.configure({
      onOCRResult: options?.onOCRResult,
      onOCRError: options?.onOCRError,
    }),

    // Advanced citation system
    AdvancedCitation.configure({
      onCitationClick: options?.onCitationClick,
      onCitationEdit: options?.onCitationEdit,
      citations: [], // Will be populated from external data
    }),

    // AI Enhancement extension
    AIEnhancementExtension,
  ];
};
