'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
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
        blockquote: {},
        codeBlock: {},
        bulletList: {},
        orderedList: {},
      }),
      CharacterCount.configure({
        limit: characterLimit,
      }),
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
    onUpdate: ({ editor }) => {
      // Handle content changes
      const html = editor.getHTML();
      console.log('Content updated:', html);
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

    // Insert citation as a formatted node
    editor.commands.insertContent({
      type: 'citation',
      attrs: {
        sourceTitle: citation.sourceTitle,
        reference: citation.reference,
        sourceId: citation.sourceId,
        quote: citation.quote,
        note: citation.note,
        url: citation.url,
      },
    });

    setShowCitationModal(false);
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
