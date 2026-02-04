'use client';

import React, { useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { TipTapToolbar } from './TipTapToolbar';
import { CitationViewerModal } from './CitationViewerModal';
import { EliteCitationModal } from './EliteCitationModal';
import { ImageUploadModal } from './ImageUploadModal';
import { SlashCommandMenu } from './SlashCommandMenu';
import { BubbleToolbar } from './BubbleToolbar';
import { useEditorContext } from './EditorProvider';

interface EditorContentProps {
  className?: string;
  showToolbar?: boolean;
  onBreakStatements?: () => Promise<void>;
  onEditorReady?: (editor: any) => void;
  onGrammarCheck?: () => Promise<void>;
  onParaphrase?: () => Promise<void>;
}

export const EditorContentComponent: React.FC<EditorContentProps> = ({
  className = '',
  showToolbar = true,
  onEditorReady,
}) => {
  const {
    editor,
    feedback,
    activeCitation,
    setActiveCitation,
    handleInsertCitation,
    handleInsertImage,
    isEditorReady,
    showCitationModal,
    setShowCitationModal,
    insertCitation,
    showImageModal,
    setShowImageModal,
    insertImage,
    editingCitation,
    setEditingCitation,
    updateCitation,
  } = useEditorContext();

  // Call onEditorReady when editor becomes available
  useEffect(() => {
    if (editor && onEditorReady && isEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady, isEditorReady]);

  if (!isEditorReady) {
    return (
      <div className={`relative ${className}`}>
        {/* Skeleton toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-1 pr-2 mr-2 border-r border-border last:border-r-0">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="w-8 h-8 rounded bg-muted animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Skeleton content */}
        <div className="p-6 space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
          <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {showToolbar && (
        <TipTapToolbar
          editor={editor}
          onInsertCitation={handleInsertCitation}
          onInsertImage={handleInsertImage}
        />
      )}

      <EditorContent
        editor={editor}
        className="min-h-[200px] focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      />

      {editor && (
        <>
          <SlashCommandMenu
            editor={editor}
            onInsertCitation={handleInsertCitation}
            onInsertImage={handleInsertImage}
          />
          <BubbleToolbar editor={editor} />
        </>
      )}

      {feedback && (
        <div className={`mt-2 p-2 rounded text-sm ${
          feedback.type === 'success'
            ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
            : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
        }`}>
          {feedback.message}
        </div>
      )}

      {activeCitation && (
        <CitationViewerModal
          open={Boolean(activeCitation)}
          citation={activeCitation as any}
          onClose={() => setActiveCitation(null)}
        />
      )}

      <EliteCitationModal
        open={showCitationModal}
        onClose={() => setShowCitationModal(false)}
        onInsert={insertCitation}
      />

      <EliteCitationModal
        open={Boolean(editingCitation)}
        onClose={() => setEditingCitation(null)}
        onInsert={updateCitation}
        initialCitation={editingCitation?.citation}
      />

      <ImageUploadModal
        open={showImageModal}
        onClose={() => setShowImageModal(false)}
        onInsert={insertImage}
      />
    </div>
  );
};
