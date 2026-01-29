'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Wand2, Languages, Sparkles, Search, BookOpen, Link2,
  MessageSquare, FileText, Expand, ListTree, Quote, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandPaletteCommand {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  group: 'generate' | 'translate' | 'enhance' | 'find' | 'actions';
  action: () => void | Promise<void>;
  keywords?: string[];
  disabled?: boolean;
  requiresSelection?: boolean;
  requiresSection?: string;
}

interface UnifiedCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: CommandPaletteCommand[];
  hasSelection?: boolean;
  activeSection?: string;
  isLoading?: boolean;
}

const GROUP_CONFIG = {
  generate: { label: 'Generate', icon: Wand2 },
  translate: { label: 'Translate', icon: Languages },
  enhance: { label: 'Enhance', icon: Sparkles },
  find: { label: 'Find', icon: Search },
  actions: { label: 'Actions', icon: FileText },
};

export function UnifiedCommandPalette({
  open,
  onOpenChange,
  commands,
  hasSelection = false,
  activeSection,
  isLoading = false,
}: UnifiedCommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);

  // Filter commands based on context
  const filteredCommands = commands.filter((cmd) => {
    if (cmd.requiresSelection && !hasSelection) return false;
    if (cmd.requiresSection && cmd.requiresSection !== activeSection) return false;
    if (cmd.disabled) return false;
    return true;
  });

  // Group commands
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, CommandPaletteCommand[]>);

  const handleSelect = useCallback(async (command: CommandPaletteCommand) => {
    setExecutingCommand(command.id);
    try {
      await command.action();
    } finally {
      setExecutingCommand(null);
      onOpenChange(false);
      setSearch('');
    }
  }, [onOpenChange]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              onOpenChange(false);
              setSearch('');
            }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-xl mx-4 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <Command className="w-full" shouldFilter={true}>
              {/* Header */}
              <div className="flex items-center px-4 border-b border-border">
                <Sparkles className="w-4 h-4 text-primary mr-3" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search..."
                  className="flex h-14 w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <kbd className="hidden sm:inline-flex px-2 py-1 text-[10px] font-bold text-muted-foreground bg-muted rounded">
                    ESC
                  </kbd>
                  <button
                    onClick={() => {
                      onOpenChange(false);
                      setSearch('');
                    }}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Context Badges */}
              {(hasSelection || activeSection) && (
                <div className="px-4 py-2 border-b border-border/50 flex items-center gap-2">
                  {hasSelection && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded">
                      Text Selected
                    </span>
                  )}
                  {activeSection && (
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider rounded">
                      {activeSection}
                    </span>
                  )}
                </div>
              )}

              {/* Commands List */}
              <Command.List className="max-h-[50vh] overflow-y-auto p-2">
                {isLoading && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                )}

                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                  No commands found.
                </Command.Empty>

                {Object.entries(groupedCommands).map(([group, cmds]) => {
                  const config = GROUP_CONFIG[group as keyof typeof GROUP_CONFIG];
                  const GroupIcon = config?.icon || FileText;

                  return (
                    <Command.Group
                      key={group}
                      heading={
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <GroupIcon className="w-3 h-3" />
                          {config?.label || group}
                        </div>
                      }
                    >
                      {cmds.map((cmd) => {
                        const Icon = cmd.icon;
                        const isExecuting = executingCommand === cmd.id;

                        return (
                          <Command.Item
                            key={cmd.id}
                            value={`${cmd.label} ${cmd.keywords?.join(' ') || ''}`}
                            onSelect={() => handleSelect(cmd)}
                            disabled={isExecuting}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                              'aria-selected:bg-primary/10 hover:bg-muted/50',
                              isExecuting && 'opacity-50 pointer-events-none'
                            )}
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                              {isExecuting ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              ) : (
                                <Icon className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-foreground">
                                {cmd.label}
                              </div>
                              {cmd.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {cmd.description}
                                </div>
                              )}
                            </div>
                            {cmd.requiresSelection && (
                              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                                Selection
                              </span>
                            )}
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  );
                })}
              </Command.List>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background border border-border/50 rounded">↑↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background border border-border/50 rounded">↵</kbd>
                    <span>Select</span>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-muted-foreground/40 tracking-widest">
                  AI COMMANDS
                </div>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default UnifiedCommandPalette;
