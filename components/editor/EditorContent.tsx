'use client';

import React, { useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { TipTapToolbar } from './TipTapToolbar';
import { CitationViewerModal } from './CitationViewerModal';
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
  } = useEditorContext();

  // Call onEditorReady when editor becomes available
  useEffect(() => {
    if (editor && onEditorReady && isEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady, isEditorReady]);

  if (!isEditorReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading editor...</div>
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

      <div className="border border-border rounded-md overflow-hidden">
        <EditorContent
          editor={editor}
          className="min-h-[400px] focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
        />
      </div>

      {feedback && (
        <div className={`mt-2 p-2 rounded text-sm ${
          feedback.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {feedback.message}
        </div>
      )}

      {activeCitation && (
        <CitationViewerModal
          open={Boolean(activeCitation)}
          citation={activeCitation}
          onClose={() => setActiveCitation(null)}
        />
      )}
    </div>
  );
};
