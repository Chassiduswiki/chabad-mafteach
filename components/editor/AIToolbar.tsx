'use client';

import { Editor } from '@tiptap/react';
import { Sparkles, Languages, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIToolbarProps {
  editor: Editor | null;
}

export function AIToolbar({ editor }: AIToolbarProps) {
  if (!editor) return null;

  const hasSelection = !editor.state.selection.empty;

  return (
    <div className="flex items-center gap-1 border-l border-border pl-2 ml-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.commands.enhanceSelection()}
        disabled={!hasSelection}
        className="h-8 px-2"
        title="Enhance selected text"
      >
        <Sparkles className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.commands.translateSelection('en')}
        disabled={!hasSelection}
        className="h-8 px-2"
        title="Translate selection"
      >
        <Languages className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.commands.suggestLinks()}
        disabled={!hasSelection}
        className="h-8 px-2"
        title="Suggest topic links"
      >
        <Link2 className="h-4 w-4" />
      </Button>

    </div>
  );
}
