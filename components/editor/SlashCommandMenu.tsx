'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  BookOpen,
  Image,
  Table,
  CheckSquare,
  AlignLeft,
} from 'lucide-react';

interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ElementType;
  command: (editor: Editor) => void;
  keywords?: string[];
}

interface SlashCommandMenuProps {
  editor: Editor;
  onInsertCitation?: () => void;
  onInsertImage?: () => void;
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Paragraph',
    description: 'Normal text block',
    icon: AlignLeft,
    keywords: ['text', 'paragraph', 'normal'],
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    keywords: ['h1', 'header', 'title', 'large'],
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    keywords: ['h2', 'header', 'subtitle'],
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    keywords: ['h3', 'header', 'small'],
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Create a bullet list',
    icon: List,
    keywords: ['ul', 'unordered', 'bullets', 'list'],
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: ListOrdered,
    keywords: ['ol', 'ordered', 'numbers', 'list'],
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Quote',
    description: 'Capture a quote',
    icon: Quote,
    keywords: ['blockquote', 'citation', 'quote'],
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    description: 'Display code with syntax',
    icon: Code2,
    keywords: ['code', 'pre', 'snippet'],
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Divider',
    description: 'Horizontal rule separator',
    icon: Minus,
    keywords: ['hr', 'line', 'separator', 'divider'],
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

export function SlashCommandMenu({ editor, onInsertCitation, onInsertImage }: SlashCommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Build commands list with dynamic items
  const allCommands: SlashCommandItem[] = [
    ...SLASH_COMMANDS,
    ...(onInsertCitation
      ? [
          {
            title: 'Citation',
            description: 'Insert a source citation',
            icon: BookOpen,
            keywords: ['cite', 'source', 'reference', 'book'],
            command: () => {
              onInsertCitation();
            },
          },
        ]
      : []),
    ...(onInsertImage
      ? [
          {
            title: 'Image',
            description: 'Upload or embed an image',
            icon: Image,
            keywords: ['img', 'picture', 'photo', 'upload'],
            command: () => {
              onInsertImage();
            },
          },
        ]
      : []),
  ];

  const filteredCommands = query
    ? allCommands.filter((cmd) => {
        const q = query.toLowerCase();
        return (
          cmd.title.toLowerCase().includes(q) ||
          cmd.description.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        );
      })
    : allCommands;

  // Listen for / keypress to open menu
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if event is from the editor element to avoid capturing global events
      const editorElement = editor.view.dom;
      if (!editorElement.contains(event.target as Node)) {
        return; // Ignore events outside the editor
      }

      // Open menu on /
      if (event.key === '/' && !isOpen) {
        const { from } = editor.state.selection;
        const textBefore = editor.state.doc.textBetween(
          Math.max(0, from - 1),
          from,
          '\n'
        );

        // Only open if at start of line or after space
        if (from === 1 || textBefore === '' || textBefore === ' ' || textBefore === '\n') {
          event.preventDefault();

          // Get cursor position for menu placement
          const coords = editor.view.coordsAtPos(from);
          setPosition({
            top: coords.bottom + 8,
            left: coords.left,
          });

          setIsOpen(true);
          setQuery('');
          setSelectedIndex(0);
        }
      }

      // Handle navigation when menu is open
      if (isOpen) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
        } else if (event.key === 'Escape') {
          event.preventDefault();
          closeMenu();
        } else if (event.key === 'Backspace' && query === '') {
          closeMenu();
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          // Filter by typed character
          setQuery((prev) => prev + event.key);
          setSelectedIndex(0);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, isOpen, query, filteredCommands, selectedIndex]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };

  const executeCommand = (cmd: SlashCommandItem) => {
    closeMenu();
    cmd.command(editor);
    editor.commands.focus();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] w-72 rounded-lg border border-border bg-background shadow-lg overflow-hidden"
      style={{
        top: Math.min(position.top, window.innerHeight - 300),
        left: Math.min(position.left, window.innerWidth - 300),
      }}
    >
      {/* Search input display */}
      {query && (
        <div className="px-3 py-2 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Filtering: <span className="font-medium text-foreground">{query}</span>
          </p>
        </div>
      )}

      {/* Commands list */}
      <div className="max-h-64 overflow-y-auto p-1">
        {filteredCommands.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            No commands found
          </div>
        ) : (
          filteredCommands.map((cmd, index) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.title}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                    index === selectedIndex
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-muted/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{cmd.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {cmd.description}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Keyboard hints */}
      <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">↑↓</kbd>
          {' '}navigate
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">Enter</kbd>
          {' '}select
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">Esc</kbd>
          {' '}close
        </span>
      </div>
    </div>
  );
}
