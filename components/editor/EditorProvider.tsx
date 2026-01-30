'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import Gapcursor from '@tiptap/extension-gapcursor';
import Dropcursor from '@tiptap/extension-dropcursor';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Focus from '@tiptap/extension-focus';
import { createTipTapExtensions } from './extensions';

interface CitationData {
  source_id: number | string | null;
  source_title: string | null;
  reference: string | null;
  content?: string;
}

interface EditorContextType {
  editor: Editor | null;
  feedback: { type: "success" | "error"; message: string } | null;
  activeCitation: CitationData | null;
  setActiveCitation: (citation: CitationData | null) => void;
  setFeedback: (feedback: { type: "success" | "error"; message: string } | null) => void;
  handleInsertCitation: () => void;
  handleInsertImage: () => void;
  isEditorReady: boolean;
  showCitationModal: boolean;
  setShowCitationModal: (show: boolean) => void;
  insertCitation: (citation: { sourceId: number | null; sourceTitle: string; reference: string; quote?: string; note?: string; url?: string }) => void;
  showImageModal: boolean;
  setShowImageModal: (show: boolean) => void;
  insertImage: (imageUrl: string, altText: string) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
  children: ReactNode;
  docId?: string | null;
  placeholder?: string;
  characterLimit?: number;
  onUpdate?: (newContent: string) => void;
  initialContent?: string;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  docId = null,
  placeholder = 'Start writing your content here... You can paste Hebrew text or images for OCR processing.',
  characterLimit = 10000,
  onUpdate,
  initialContent = '',
}) => {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeCitation, setActiveCitation] = useState<CitationData | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Initialize TipTap editor
  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration issues
    extensions: [
      StarterKit.configure({
        // Configure starter kit to match our needs
        heading: {
          levels: [1, 2, 3],
        },
        paragraph: {
          HTMLAttributes: {
            class: 'mb-4',
          },
        },
        hardBreak: {
          // Allow Shift+Enter for hard breaks
          HTMLAttributes: {
            class: 'hard-break',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-primary pl-4 italic',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-muted rounded-lg p-4 font-mono text-sm',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc ml-6',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ml-6',
          },
        },
      }),

      // Text formatting
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),

      // Links
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),

      // Text alignment
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),

      // Typography
      Typography,

      // Navigation helpers
      Gapcursor,
      Dropcursor,

      // Tables
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,

      // Focus
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),

      // Character count
      CharacterCount.configure({
        limit: characterLimit,
      }),

      // Placeholder
      Placeholder.configure({
        placeholder,
      }),

      // Custom extensions for Hebrew and citations
      ...createTipTapExtensions({
        topicId: docId || undefined,
        onCitationClick: (citation) => {
          setActiveCitation({
            source_id: citation.sourceId,
            source_title: citation.sourceTitle,
            reference: citation.reference,
            content: `${citation.sourceTitle} - ${citation.reference}`,
          });
        },
        onCitationEdit: (citation) => {
          console.log('Edit citation:', citation);
          // TODO: Open citation edit dialog
        },
        onTrigger: () => {
          // Open citation modal when @ is typed
          setShowCitationModal(true);
        },
        onDismiss: () => {
          // Close citation modal on Escape
          setShowCitationModal(false);
        },
        onOCRResult: (text) => {
          console.log('OCR Result:', text);
          setFeedback({ type: "success", message: "Hebrew text extracted from image!" });
        },
        onOCRError: (error) => {
          console.error('OCR Error:', error);
          setFeedback({ type: "error", message: `OCR failed: ${error}` });
        },
        onSuggestCitations: (suggestions) => {
          console.log('AI Citation Suggestions:', suggestions);
          // This event will be handled by AICitationSuggestorDialog if it listens for it
          window.dispatchEvent(new CustomEvent('ai-suggest-citations', { detail: { suggestions } }));
        },
        onTranslateText: async (text, targetLang) => {
          const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'translate',
              content: text,
              targetLanguage: targetLang
            }),
          });
          const data = await response.json();
          return data.content || text;
        },
        onGetAutocompleteSuggestions: async (text) => {
          const response = await fetch(`/api/search?q=${encodeURIComponent(text)}`);
          if (response.ok) {
            const data = await response.json();
            return (data.topics || []).map((t: { name: string }) => t.name).slice(0, 5);
          }
          return [];
        },
      }),
    ],
    content: initialContent,
    onBlur: ({ editor }) => {
      // Handle content changes when editor loses focus
      const html = editor.getHTML();
      console.log('Content updated on blur:', html);
      if (onUpdate) {
        onUpdate(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6',
        dir: 'auto', // Enable browser-native RTL detection
      },
      handlePaste: (view, event) => {
        // Let the OCR extension handle image pastes
        return false;
      },
    },
  });

  // Mark editor as ready when available
  useEffect(() => {
    if (editor) {
      Promise.resolve().then(() => setIsEditorReady(true));
    }
  }, [editor]);

  const handleInsertCitation = () => {
    // Open citation modal
    setShowCitationModal(true);
  };

  const insertCitation = (citation: {
    sourceId: number | null;
    sourceTitle: string;
    reference: string;
    quote?: string;
    note?: string;
    url?: string;
  }) => {
    if (!editor) return;

    try {
      // Use the dedicated insertCitation command from our extension
      const success = editor.commands.insertCitation({
        id: `cite_${Math.random().toString(36).substring(2, 12)}`,
        sourceId: citation.sourceId,
        sourceTitle: citation.sourceTitle,
        citationType: 'reference',
        reference: citation.reference,
        quote: citation.quote,
        note: citation.note,
        url: citation.url,
      });

      if (success) {
        setShowCitationModal(false);
        setFeedback({
          type: "success",
          message: `Citation added: ${citation.sourceTitle} ${citation.reference ? '— ' + citation.reference : ''}`
        });

        // Auto-dismiss success message after 3 seconds
        setTimeout(() => setFeedback(null), 3000);
      } else {
        throw new Error('Citation insertion failed');
      }
    } catch (error) {
      console.error('Failed to insert citation:', error);
      setFeedback({ type: "error", message: "Failed to insert citation" });

      // Auto-dismiss error message after 5 seconds
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleInsertImage = () => {
    // Open image upload modal
    setShowImageModal(true);
  };

  const insertImage = (imageUrl: string, altText: string) => {
    if (!editor) return;

    // Insert image into editor
    editor.commands.insertContent(`<img src="${imageUrl}" alt="${altText}" />`);
    setShowImageModal(false);
  };

  const contextValue: EditorContextType = {
    editor,
    feedback,
    activeCitation,
    setActiveCitation,
    setFeedback,
    handleInsertCitation,
    handleInsertImage,
    isEditorReady,
    showCitationModal,
    setShowCitationModal,
    insertCitation,
    showImageModal,
    setShowImageModal,
    insertImage,
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
};
