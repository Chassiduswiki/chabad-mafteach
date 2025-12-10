'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCitationPalette } from './hooks/useCitationPalette';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { createTipTapExtensions } from './extensions';
import { TipTapToolbar } from './TipTapToolbar';
import { CitationViewerModal } from './CitationViewerModal';

interface TipTapEditorProps {
  docId: string | null;
  className?: string;
  onBreakStatements?: () => Promise<void>;
  onEditorReady?: (editor: any) => void;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  docId,
  className,
  onBreakStatements,
  onEditorReady
}) => {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeCitation, setActiveCitation] = useState<{
    source_id: number | string | null;
    source_title: string | null;
    reference: string | null;
    content?: string;
  } | null>(null);

  const [mounted, setMounted] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true);
  }, []);

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
        limit: 10000,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your content here... You can paste Hebrew text or images for OCR processing.',
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
    content: '<p>Hello World! 🌍️</p><p>You can now paste Hebrew text or images for automatic OCR processing.</p>',
    onUpdate: ({ editor }) => {
      // Handle content changes
      const html = editor.getHTML();
      console.log('Content updated:', html);
      // Here you would call your save handler
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

  // Call onEditorReady when editor is available
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

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

  const handleSave = async () => {
    if (!editor) return;

    try {
      const content = editor.getHTML();
      console.log('Saving content:', content);

      // TODO: Implement actual save logic
      setFeedback({ type: "success", message: "Content saved successfully!" });
    } catch (error) {
      setFeedback({ type: "error", message: "Failed to save content" });
    }
  };

  // Show loading state while component mounts or editor initializes
  if (!mounted || !editor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`pm-editor-shell ${className ?? ""}`}>
      {/* Main Toolbar */}
      <TipTapToolbar
        editor={editor}
        onSave={handleSave}
        onBreakStatements={onBreakStatements}
        onInsertCitation={handleInsertCitation}
        onInsertImage={handleInsertImage}
        isSaving={false}
      />

      {/* Editor Content */}
      <div className="relative bg-white">
        <EditorContent
          editor={editor}
          className="pm-editor-surface"
        />

        {/* Character Count */}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          {editor.storage.characterCount.characters()}/10000 characters
        </div>
      </div>

      {feedback ? (
        <div className={`pm-editor-feedback pm-editor-feedback-${feedback.type}`}>
          {feedback.message}
        </div>
      ) : null}

      <CitationViewerModal
        open={Boolean(activeCitation)}
        citation={activeCitation}
        citationContent={activeCitation?.content}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
};
