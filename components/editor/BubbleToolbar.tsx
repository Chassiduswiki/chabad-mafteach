'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Code, Link, Strikethrough } from 'lucide-react';

interface BubbleToolbarProps {
  editor: Editor;
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const { state } = editor;
    const { from, to } = state.selection;

    // Only show when there's a text selection (not just cursor)
    if (from === to || state.selection.empty) {
      setIsVisible(false);
      return;
    }

    // Get the coordinates of the selection
    const { view } = editor;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);

    // Position above the selection, centered
    const top = start.top - 48;
    const left = (start.left + end.left) / 2;

    // Keep within viewport bounds
    const adjustedLeft = Math.max(120, Math.min(left, window.innerWidth - 120));
    const adjustedTop = Math.max(8, top);

    setPosition({ top: adjustedTop, left: adjustedLeft });
    setIsVisible(true);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    // Listen for selection changes
    const handleSelectionUpdate = () => {
      // Small delay to let the selection settle
      requestAnimationFrame(updatePosition);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('blur', () => setIsVisible(false));

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('blur', () => setIsVisible(false));
    };
  }, [editor, updatePosition]);

  // Hide on scroll
  useEffect(() => {
    const handleScroll = () => setIsVisible(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  if (!isVisible) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      onMouseDown={(e) => e.preventDefault()}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted text-foreground'
      }`}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );

  return (
    <div
      className="fixed z-[100] flex items-center gap-0.5 px-1 py-0.5 rounded-lg border border-border bg-background shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (⌘B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (⌘I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Code (⌘E)"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-4 bg-border mx-0.5" />

      <ToolbarButton
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        isActive={editor.isActive('link')}
        title="Add Link"
      >
        <Link className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
