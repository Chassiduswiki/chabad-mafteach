import React from 'react';
import { EditorView } from 'prosemirror-view';
import { mySchema } from './schema';
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
  Loader2
} from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

interface EditorToolbarProps {
  view: EditorView;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  view,
  onUndo,
  onRedo,
  onSave,
  isSaving = false,
  canUndo = false,
  canRedo = false,
  className
}) => {
  const applyMark = (markType: string) => {
    const { state, dispatch } = view;
    const mark = mySchema.marks[markType];

    if (mark) {
      const { from, to } = state.selection;
      const hasMark = state.storedMarks?.some(m => m.type === mark) ||
                     state.doc.rangeHasMark(from, to, mark);

      if (hasMark) {
        dispatch(state.tr.removeMark(from, to, mark));
      } else {
        dispatch(state.tr.addMark(from, to, mark.create()));
      }
    }
  };

  const setBlockType = (nodeType: string) => {
    const { state, dispatch } = view;
    const node = mySchema.nodes[nodeType];

    if (node) {
      const { from, to } = state.selection;
      dispatch(state.tr.setBlockType(from, to, node));
    }
  };

  const toggleList = (listType: string) => {
    const { state, dispatch } = view;
    const listNode = mySchema.nodes[listType];
    const listItemNode = mySchema.nodes.listItem;

    if (!listNode || !listItemNode) return;

    const { $from, $to } = state.selection;
    const range = $from.blockRange($to);

    if (!range) return;

    const tr = state.tr;

    // Check if we're already in a list
    const parentList = $from.node(range.depth - 1);
    if (parentList.type === listNode) {
      // Convert list to paragraphs
      tr.setBlockType(range.start, range.end, mySchema.nodes.paragraph);
    } else {
      // Wrap in list
      tr.wrap(range, [{ type: listNode }, { type: listItemNode }]);
    }

    dispatch(tr);
  };

  return (
    <div className={`flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 ${className || ''}`}>
      <div className="flex items-center gap-1">
        {/* History Controls */}
        <div className="flex gap-0.5 border-r border-gray-300 pr-2 mr-2">
          <IconButton
            label="Undo"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2"
          >
            <Undo className="w-4 h-4" />
          </IconButton>
          <IconButton
            label="Redo"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2"
          >
            <Redo className="w-4 h-4" />
          </IconButton>
        </div>

        {/* Headings */}
        <div className="flex gap-0.5 border-r border-gray-300 pr-2 mr-2">
          <IconButton
            label="Normal Text"
            onClick={() => setBlockType('paragraph')}
            className="p-2 px-3"
          >
            <span className="text-sm font-medium">P</span>
          </IconButton>
          <IconButton
            label="Heading 1"
            onClick={() => setBlockType('heading1')}
            className="p-2"
          >
            <Heading1 className="w-4 h-4" />
          </IconButton>
          <IconButton
            label="Heading 2"
            onClick={() => setBlockType('heading2')}
            className="p-2"
          >
            <Heading2 className="w-4 h-4" />
          </IconButton>
          <IconButton
            label="Heading 3"
            onClick={() => setBlockType('heading3')}
            className="p-2"
          >
            <Heading3 className="w-4 h-4" />
          </IconButton>
        </div>

        {/* Text Formatting */}
        <div className="flex gap-0.5 border-r border-gray-300 pr-2 mr-2">
          <IconButton
            label="Bold"
            onClick={() => applyMark('strong')}
            className="p-2"
          >
            <Bold className="w-4 h-4" />
          </IconButton>
          <IconButton
            label="Italic"
            onClick={() => applyMark('em')}
            className="p-2"
          >
            <Italic className="w-4 h-4" />
          </IconButton>
          <IconButton
            label="Code"
            onClick={() => applyMark('code')}
            className="p-2"
          >
            <Code className="w-4 h-4" />
          </IconButton>
        </div>

        {/* Lists & Blocks */}
        <div className="flex gap-0.5">
          <IconButton
            label="Bullet List"
            onClick={() => toggleList('bulletList')}
            className="p-2"
          >
            <List className="w-4 h-4" />
          </IconButton>
          <IconButton
            label="Numbered List"
            onClick={() => toggleList('orderedList')}
            className="p-2"
          >
            <ListOrdered className="w-4 h-4" />
          </IconButton>
          <IconButton
            label="Blockquote"
            onClick={() => setBlockType('blockquote')}
            className="p-2"
          >
            <Quote className="w-4 h-4" />
          </IconButton>
          <IconButton
            label="Code Block"
            onClick={() => setBlockType('codeBlock')}
            className="p-2"
          >
            <Code2 className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
};
