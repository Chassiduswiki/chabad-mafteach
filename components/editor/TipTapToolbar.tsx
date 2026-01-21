import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Undo,
  Redo,
  Save,
  Loader2,
  Split,
  Image,
  Link,
  BookOpen,
  Check,
  RefreshCw
} from 'lucide-react';

interface TipTapToolbarProps {
  editor: any;
  onSave?: () => void;
  onBreakStatements?: () => Promise<void>;
  onInsertCitation?: () => void;
  onInsertImage?: () => void;
  onGrammarCheck?: () => Promise<void>;
  onParaphrase?: () => Promise<void>;
  isSaving?: boolean;
  className?: string;
}

export const TipTapToolbar: React.FC<TipTapToolbarProps> = ({
  editor,
  onSave,
  onBreakStatements,
  onInsertCitation,
  onInsertImage,
  onGrammarCheck,
  onParaphrase,
  isSaving = false,
  className
}) => {
  return (
    <div className={`flex items-center justify-between p-3 border-b border-border bg-muted/50 ${className || ''}`}>
      <div className="flex items-center gap-1">
        {/* History Controls */}
        <div className="flex gap-0.5 border-r border-border pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
            title="Undo"
            aria-label="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
            title="Redo"
            aria-label="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex gap-0.5 border-r border-border pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`p-2 px-3 rounded hover:bg-muted text-foreground ${editor.isActive('paragraph') ? 'bg-muted' : ''}`}
            title="Normal Text"
            aria-label="Normal Text"
          >
            <span className="text-sm font-medium">P</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-muted text-foreground ${editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}`}
            title="Heading 1"
            aria-label="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-muted text-foreground ${editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}`}
            title="Heading 2"
            aria-label="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-muted text-foreground ${editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}`}
            title="Heading 3"
            aria-label="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Text Formatting */}
        <div className="flex gap-0.5 border-r border-border pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-muted text-foreground ${editor.isActive('bold') ? 'bg-muted' : ''}`}
            title="Bold"
            aria-label="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-muted text-foreground ${editor.isActive('italic') ? 'bg-muted' : ''}`}
            title="Italic"
            aria-label="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-muted text-foreground ${editor.isActive('code') ? 'bg-muted' : ''}`}
            title="Code"
            aria-label="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Blocks */}
        <div className="flex gap-0.5 border-r border-border pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-muted text-foreground ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
            title="Bullet List"
            aria-label="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-muted text-foreground ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
            title="Numbered List"
            aria-label="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-muted text-foreground ${editor.isActive('blockquote') ? 'bg-muted' : ''}`}
            title="Blockquote"
            aria-label="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-muted text-foreground ${editor.isActive('codeBlock') ? 'bg-muted' : ''}`}
            title="Code Block"
            aria-label="Code Block"
          >
            <Code2 className="w-4 h-4" />
          </button>
        </div>

        {/* Advanced Features */}
        <div className="flex gap-0.5">
          {onGrammarCheck && (
            <button
              onClick={onGrammarCheck}
              className="p-2 rounded hover:bg-muted text-foreground"
              title="Check Grammar & Spelling"
              aria-label="Check Grammar & Spelling"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {onParaphrase && (
            <button
              onClick={onParaphrase}
              className="p-2 rounded hover:bg-muted text-foreground"
              title="Improve & Paraphrase Text"
              aria-label="Improve & Paraphrase Text"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onInsertImage && (
            <button
              onClick={onInsertImage}
              className="p-2 rounded hover:bg-muted text-foreground"
              title="Insert Image (OCR supported)"
              aria-label="Insert Image"
            >
              <Image className="w-4 h-4" />
            </button>
          )}
          {onInsertCitation && (
            <button
              onClick={onInsertCitation}
              className="p-2 rounded hover:bg-muted text-foreground"
              title="Insert Citation"
              aria-label="Insert Citation"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-2">
        {onBreakStatements && (
          <button
            onClick={onBreakStatements}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Automatically split paragraphs into individual statements"
          >
            <Split className="w-4 h-4" />
          </button>
        )}
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
};
