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
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
  children: ReactNode;
  docId?: string | null;
  placeholder?: string;
  characterLimit?: number;
  onUpdate?: (content: string) => void;
  initialContent?: string;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  docId = null,
  placeholder = 'Start writing your content here... You can paste Hebrew text or images for OCR processing.',
  characterLimit = 10000,
  onUpdate,
  initialContent = '<p>Hello World! 🌍️</p><p>You can now paste Hebrew text or images for automatic OCR processing.</p>',
}) => {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeCitation, setActiveCitation] = useState<CitationData | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

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
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // Handle content changes
      const html = editor.getHTML();
      console.log('Content updated:', html);
      onUpdate?.(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6',
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
      setIsEditorReady(true);
    }
  }, [editor]);

  const handleInsertCitation = () => {
    // Open citation palette or dialog
    console.log('Insert citation clicked');

    // For now, open a simple citation dialog
    const citationText = prompt('Enter citation (e.g., Tanya 1:1 or "Book Title" p. 45):');
    if (citationText && editor) {
      // Insert citation as a formatted node
      editor.commands.insertContent({
        type: 'citation',
        attrs: {
          sourceTitle: citationText,
          reference: citationText,
          sourceId: null,
        },
      });
    }
  };

  const handleInsertImage = () => {
    // Trigger file input for image upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // The OCR extension will handle this automatically when pasted
        // For now, we'll just insert a placeholder
        editor?.commands.insertContent(`<p>[Image: ${file.name}]</p>`);
      }
    };
    input.click();
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
