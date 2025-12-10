'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { CitationCommandPalette } from './CitationCommandPalette';
import { TipTapToolbar } from './TipTapToolbar';
import { useCitationPalette } from './hooks/useCitationPalette';

interface TipTapEditorProps {
  docId: string | null;
  className?: string;
  onBreakStatements?: () => Promise<void>;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  docId,
  className,
  onBreakStatements
}) => {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    isOpen: showCitationPalette,
    range: citationRange,
    openWithRange,
    closePalette,
    handleOpenChange,
  } = useCitationPalette();

  // Initialize TipTap editor
  const editor = useEditor({
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
        placeholder: 'Start writing your content here...',
      }),
    ],
    content: '<p>Hello World! 🌍️</p>',
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
    },
  });

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

  // Show loading state while editor initializes
  if (!editor) {
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

      <CitationCommandPalette
        open={showCitationPalette}
        onOpenChange={(open) => {
          handleOpenChange(open);
          if (!open) {
            editor?.commands.focus();
          }
        }}
        onComplete={(source, reference) => {
          // TODO: Implement citation insertion
          console.log('Insert citation:', source, reference);
          closePalette();
        }}
        onFeedback={(payload) => setFeedback(payload)}
      />
    </div>
  );
};
