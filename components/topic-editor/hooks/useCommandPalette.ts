'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Wand2, Languages, Sparkles, Search, BookOpen, Link2,
  MessageSquare, FileText, Expand, ListTree, Quote
} from 'lucide-react';
import { CommandPaletteCommand } from '../ai/UnifiedCommandPalette';

interface UseCommandPaletteOptions {
  topicId?: number;
  topicTitle?: string;
  onGenerateArticle?: () => void;
  onGenerateSection?: (sectionId: string) => void;
  onFillAllEmpty?: () => void;
  onTranslateSelection?: () => void;
  onTranslateAll?: () => void;
  onEnhanceSelection?: () => void;
  onExpandSelection?: () => void;
  onSummarizeSelection?: () => void;
  onFindRelatedTopics?: () => void;
  onSuggestCitations?: () => void;
  onSearchSefaria?: () => void;
  onInsertCitation?: () => void;
  onOpenAIChat?: () => void;
}

export function useCommandPalette(options: UseCommandPaletteOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [activeSection, setActiveSection] = useState<string | undefined>();

  const commands: CommandPaletteCommand[] = useMemo(() => [
    // Generate commands
    {
      id: 'generate-article',
      label: 'Generate Article',
      description: 'Create a full article based on topic info',
      icon: FileText,
      group: 'generate',
      action: () => options.onGenerateArticle?.(),
      keywords: ['write', 'create', 'article', 'content'],
    },
    {
      id: 'generate-section',
      label: 'Generate Current Section',
      description: 'Fill in the currently focused section',
      icon: Wand2,
      group: 'generate',
      action: () => {
        if (activeSection) {
          options.onGenerateSection?.(activeSection);
        }
      },
      requiresSection: activeSection,
      keywords: ['fill', 'section', 'generate'],
    },
    {
      id: 'fill-all-empty',
      label: 'Fill All Empty Sections',
      description: 'Auto-generate content for all empty fields',
      icon: Sparkles,
      group: 'generate',
      action: () => options.onFillAllEmpty?.(),
      keywords: ['fill', 'all', 'empty', 'auto'],
    },

    // Translate commands
    {
      id: 'translate-selection',
      label: 'Translate Selection',
      description: 'Translate selected text to English',
      icon: Languages,
      group: 'translate',
      action: () => options.onTranslateSelection?.(),
      requiresSelection: true,
      keywords: ['translate', 'english', 'hebrew'],
    },
    {
      id: 'translate-all',
      label: 'Translate All to English',
      description: 'Translate all Hebrew content to English',
      icon: Languages,
      group: 'translate',
      action: () => options.onTranslateAll?.(),
      keywords: ['translate', 'all', 'english'],
    },

    // Enhance commands
    {
      id: 'enhance-selection',
      label: 'Enhance Selected Text',
      description: 'Improve clarity and style',
      icon: Sparkles,
      group: 'enhance',
      action: () => options.onEnhanceSelection?.(),
      requiresSelection: true,
      keywords: ['improve', 'enhance', 'polish'],
    },
    {
      id: 'expand-selection',
      label: 'Expand Selection',
      description: 'Add more detail to selected text',
      icon: Expand,
      group: 'enhance',
      action: () => options.onExpandSelection?.(),
      requiresSelection: true,
      keywords: ['expand', 'elaborate', 'detail'],
    },
    {
      id: 'summarize-selection',
      label: 'Summarize Selection',
      description: 'Create a concise summary',
      icon: ListTree,
      group: 'enhance',
      action: () => options.onSummarizeSelection?.(),
      requiresSelection: true,
      keywords: ['summarize', 'brief', 'short'],
    },

    // Find commands
    {
      id: 'find-related-topics',
      label: 'Find Related Topics',
      description: 'Discover connections to other topics',
      icon: Link2,
      group: 'find',
      action: () => options.onFindRelatedTopics?.(),
      keywords: ['related', 'connections', 'topics'],
    },
    {
      id: 'suggest-citations',
      label: 'Suggest Citations',
      description: 'Find relevant sources to cite',
      icon: BookOpen,
      group: 'find',
      action: () => options.onSuggestCitations?.(),
      keywords: ['cite', 'sources', 'references'],
    },
    {
      id: 'search-sefaria',
      label: 'Search Sefaria',
      description: 'Find relevant texts in Sefaria',
      icon: Search,
      group: 'find',
      action: () => options.onSearchSefaria?.(),
      keywords: ['sefaria', 'texts', 'search'],
    },

    // Action commands
    {
      id: 'insert-citation',
      label: 'Insert Citation',
      description: 'Add a source reference at cursor',
      icon: Quote,
      group: 'actions',
      action: () => options.onInsertCitation?.(),
      keywords: ['citation', 'reference', 'source'],
    },
    {
      id: 'open-ai-chat',
      label: 'Open AI Chat',
      description: 'Ask questions about this topic',
      icon: MessageSquare,
      group: 'actions',
      action: () => options.onOpenAIChat?.(),
      keywords: ['chat', 'ask', 'question'],
    },
  ], [options, activeSection]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const updateSelection = useCallback((hasText: boolean) => {
    setHasSelection(hasText);
  }, []);

  const updateActiveSection = useCallback((sectionId: string | undefined) => {
    setActiveSection(sectionId);
  }, []);

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
    commands,
    hasSelection,
    activeSection,
    updateSelection,
    updateActiveSection,
  };
}

export default useCommandPalette;
