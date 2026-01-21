'use client';

import React, { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['⌘/Ctrl', 'S'], description: 'Save document' },
      { keys: ['⌘/Ctrl', 'Z'], description: 'Undo' },
      { keys: ['⌘/Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['/'], description: 'Open slash commands' },
    ],
  },
  {
    title: 'Text Formatting',
    shortcuts: [
      { keys: ['⌘/Ctrl', 'B'], description: 'Bold' },
      { keys: ['⌘/Ctrl', 'I'], description: 'Italic' },
      { keys: ['⌘/Ctrl', 'E'], description: 'Code' },
      { keys: ['⌘/Ctrl', 'Shift', 'S'], description: 'Strikethrough' },
    ],
  },
  {
    title: 'Blocks',
    shortcuts: [
      { keys: ['⌘/Ctrl', 'Alt', '1'], description: 'Heading 1' },
      { keys: ['⌘/Ctrl', 'Alt', '2'], description: 'Heading 2' },
      { keys: ['⌘/Ctrl', 'Alt', '3'], description: 'Heading 3' },
      { keys: ['⌘/Ctrl', 'Shift', '8'], description: 'Bullet list' },
      { keys: ['⌘/Ctrl', 'Shift', '9'], description: 'Numbered list' },
      { keys: ['⌘/Ctrl', 'Shift', 'B'], description: 'Blockquote' },
    ],
  },
];

interface KeyboardShortcutsPanelProps {
  className?: string;
}

export function KeyboardShortcutsPanel({ className = '' }: KeyboardShortcutsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for ? key to toggle panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        // Only if not typing in an input
        const activeElement = document.activeElement;
        const isTyping = activeElement?.tagName === 'INPUT' || 
                         activeElement?.tagName === 'TEXTAREA' ||
                         activeElement?.getAttribute('contenteditable') === 'true';
        
        if (!isTyping) {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors ${className}`}
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="h-4 w-4" />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-background shadow-2xl border border-border overflow-hidden max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {SHORTCUTS.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-sm font-semibold text-foreground mb-3">{group.title}</h3>
                    <div className="space-y-2">
                      {group.shortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">{shortcut.description}</span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIndex) => (
                              <React.Fragment key={keyIndex}>
                                <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded font-mono">
                                  {key}
                                </kbd>
                                {keyIndex < shortcut.keys.length - 1 && (
                                  <span className="text-muted-foreground">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tip */}
              <div className="mt-6 p-3 bg-muted/30 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Tip:</strong> Press{' '}
                  <kbd className="px-1 py-0.5 text-xs bg-muted border border-border rounded">?</kbd>
                  {' '}anywhere to toggle this panel. Press{' '}
                  <kbd className="px-1 py-0.5 text-xs bg-muted border border-border rounded">/</kbd>
                  {' '}at the start of a line to access quick commands.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
