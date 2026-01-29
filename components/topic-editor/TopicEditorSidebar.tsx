'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Languages, Sparkles, Keyboard, ChevronDown,
  Loader2, MessageSquare, Command
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopicCompleteness } from './TopicCompleteness';
import { TopicFormData } from './types';
import { cn } from '@/lib/utils';

interface TopicEditorSidebarProps {
  formData: TopicFormData;
  relationshipCount: number;
  sourceCount: number;
  isAICompleting?: boolean;
  onGenerateField?: (fieldId: string) => void;
  onFillAllEmpty?: () => void;
  onTranslateAll?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAIChat?: () => void;
  className?: string;
}

export function TopicEditorSidebar({
  formData,
  relationshipCount,
  sourceCount,
  isAICompleting = false,
  onGenerateField,
  onFillAllEmpty,
  onTranslateAll,
  onOpenCommandPalette,
  onOpenAIChat,
  className,
}: TopicEditorSidebarProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Completeness Panel */}
      <TopicCompleteness
        formData={formData}
        relationshipCount={relationshipCount}
        sourceCount={sourceCount}
        onGenerateField={onGenerateField}
        isAICompleting={isAICompleting}
      />

      {/* Quick AI Actions */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
            Quick Actions
          </h3>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 h-9"
            onClick={onFillAllEmpty}
            disabled={isAICompleting}
          >
            {isAICompleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Fill All Empty
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 h-9"
            onClick={onTranslateAll}
            disabled={isAICompleting}
          >
            <Languages className="w-4 h-4" />
            Translate All
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 h-9"
            onClick={onOpenAIChat}
          >
            <MessageSquare className="w-4 h-4" />
            AI Chat
          </Button>
        </div>

        {/* CMD+K Hint */}
        <button
          onClick={onOpenCommandPalette}
          className="w-full mt-3 p-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Command className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">
            Press <kbd className="px-1.5 py-0.5 bg-primary/10 rounded text-[10px] font-bold">⌘K</kbd> for all commands
          </span>
        </button>
      </div>

      {/* Keyboard Shortcuts - Collapsible */}
      <div className="bg-muted/30 border border-border/50 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Keyboard Shortcuts</span>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              showShortcuts && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 pb-3 space-y-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
                <div className="flex justify-between">
                  <span>Save</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">⌘S</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Command Palette</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">⌘K</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Slash Commands</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">/</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Bold</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">⌘B</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Italic</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">⌘I</kbd>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TopicEditorSidebar;
