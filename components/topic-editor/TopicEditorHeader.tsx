'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, CheckCircle, MoreHorizontal,
  Eye, History, Languages, Wand2, Command
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TopicEditorHeaderProps {
  topicId: number;
  topicSlug: string;
  title: string;
  topicType?: string;
  status: string;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  lastSaved?: Date;
  hasUnsavedChanges?: boolean;
  isLocked?: boolean;
  isOwner?: boolean;
  onSave: () => void;
  onStatusChange: (status: string) => void;
  onHistoryClick: () => void;
  onTranslateAll: () => void;
  onFillAll: () => void;
  onOpenCommandPalette: () => void;
}

export function TopicEditorHeader({
  topicId,
  topicSlug,
  title,
  topicType,
  status,
  saveStatus,
  lastSaved,
  hasUnsavedChanges,
  isLocked,
  isOwner,
  onSave,
  onStatusChange,
  onHistoryClick,
  onTranslateAll,
  onFillAll,
  onOpenCommandPalette,
}: TopicEditorHeaderProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const getSaveStatusDisplay = () => {
    if (saveStatus === 'saving') {
      return { text: 'Saving...', color: 'text-muted-foreground' };
    }
    if (saveStatus === 'success') {
      return { text: 'Saved', color: 'text-green-600' };
    }
    if (saveStatus === 'error') {
      return { text: 'Save failed', color: 'text-red-600' };
    }
    if (hasUnsavedChanges) {
      return { text: 'Unsaved changes', color: 'text-yellow-600' };
    }
    if (lastSaved) {
      return { text: `Saved ${lastSaved.toLocaleTimeString()}`, color: 'text-muted-foreground' };
    }
    return null;
  };

  const saveStatusDisplay = getSaveStatusDisplay();

  return (
    <header className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/editor/topics')}
              className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Topics</span>
            </button>

            <div className="border-l border-border pl-4">
              <h1 className="text-lg font-semibold text-foreground line-clamp-1">
                {title || 'Untitled Topic'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{topicType || 'No type'}</span>
                {saveStatusDisplay && (
                  <>
                    <span>•</span>
                    <span className={saveStatusDisplay.color}>{saveStatusDisplay.text}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* CMD+K Badge */}
            <button
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-muted/50 hover:bg-muted rounded-md transition-colors"
            >
              <Command className="w-3 h-3 text-muted-foreground" />
              <kbd className="text-[10px] font-bold text-muted-foreground">⌘K</kbd>
            </button>

            {/* Status Selector */}
            <select
              value={status || 'draft'}
              onChange={(e) => onStatusChange(e.target.value)}
              className={cn(
                "h-8 px-2 text-xs font-bold uppercase tracking-wider bg-muted/50 border border-border/50 rounded-md outline-none cursor-pointer",
                status === 'published' ? "text-emerald-600" :
                  status === 'draft' ? "text-amber-600" :
                    status === 'reviewed' ? "text-blue-600" :
                      "text-rose-600"
              )}
            >
              <option value="draft">Draft</option>
              <option value="reviewed">Reviewed</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            {/* Save Button */}
            <Button
              onClick={onSave}
              disabled={saveStatus === 'saving' || (isLocked && !isOwner)}
              className="gap-2"
            >
              {saveStatus === 'saving' ? (
                <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : saveStatus === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {saveStatus === 'saving' ? 'Saving...' : 'Save'}
              </span>
            </Button>

            {/* More Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDropdown(!showDropdown)}
                className="h-9 w-9"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                    <button
                      onClick={() => {
                        onHistoryClick();
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <History className="h-4 w-4" />
                      Version History
                    </button>
                    <button
                      onClick={() => {
                        router.push(`/topics/${topicSlug}`);
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={() => {
                        onTranslateAll();
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Languages className="h-4 w-4" />
                      Translate All
                    </button>
                    <button
                      onClick={() => {
                        onFillAll();
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Wand2 className="h-4 w-4" />
                      Fill All Empty
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopicEditorHeader;
