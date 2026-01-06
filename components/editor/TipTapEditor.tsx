'use client';

import React from 'react';
import { EditorProvider } from './EditorProvider';
import { EditorContentComponent } from './EditorContent';

interface TipTapEditorProps {
  docId: string | null;
  className?: string;
  onBreakStatements?: () => Promise<void>;
  onEditorReady?: (editor: any) => void;
  onGrammarCheck?: () => Promise<void>;
  onParaphrase?: () => Promise<void>;
  placeholder?: string;
  characterLimit?: number;
  initialContent?: string;
  onUpdate?: (content: string) => void;
  showToolbar?: boolean;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  docId,
  className,
  onBreakStatements,
  onEditorReady,
  onGrammarCheck,
  onParaphrase,
  placeholder,
  characterLimit,
  initialContent,
  onUpdate,
  showToolbar = true,
}) => {
  return (
    <EditorProvider
      docId={docId}
      placeholder={placeholder}
      characterLimit={characterLimit}
      onUpdate={onUpdate}
      initialContent={initialContent}
    >
      <EditorContentComponent
        className={className}
        showToolbar={showToolbar}
        onBreakStatements={onBreakStatements}
        onEditorReady={onEditorReady}
        onGrammarCheck={onGrammarCheck}
        onParaphrase={onParaphrase}
      />
    </EditorProvider>
  );
};
