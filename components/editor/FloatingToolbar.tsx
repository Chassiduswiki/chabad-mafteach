import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EditorView } from 'prosemirror-view';
import { mySchema } from '../schema';
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
  Redo
} from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

interface FloatingToolbarProps {
  view: EditorView;
  className?: string;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ view, className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updateToolbar = useCallback(() => {
    const { state } = view;
    const { from, to } = state.selection;

    if (from !== to && !state.selection.empty) {
      // Text is selected
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const middle = (start.top + end.top) / 2;

      setPosition({
        top: middle - 40, // Position above the selection
        left: (start.left + end.left) / 2,
      });
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [view]);

  useEffect(() => {
    const handleSelectionChange = () => updateToolbar();

    // Listen for selection changes
    view.dom.addEventListener('mouseup', handleSelectionChange);
    view.dom.addEventListener('keyup', handleSelectionChange);

    return () => {
      view.dom.removeEventListener('mouseup', handleSelectionChange);
      view.dom.removeEventListener('keyup', handleSelectionChange);
    };
  }, [view, updateToolbar]);

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

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className={`fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-1 flex gap-1 ${className || ''}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Headings */}
      <div className="flex gap-0.5 border-r border-gray-200 pr-1 mr-1">
        <IconButton
          label="Heading 1"
          onClick={() => setBlockType('heading1')}
          className="p-1.5"
        >
          <Heading1 className="w-4 h-4" />
        </IconButton>
        <IconButton
          label="Heading 2"
          onClick={() => setBlockType('heading2')}
          className="p-1.5"
        >
          <Heading2 className="w-4 h-4" />
        </IconButton>
        <IconButton
          label="Heading 3"
          onClick={() => setBlockType('heading3')}
          className="p-1.5"
        >
          <Heading3 className="w-4 h-4" />
        </IconButton>
      </div>

      {/* Text Formatting */}
      <div className="flex gap-0.5 border-r border-gray-200 pr-1 mr-1">
        <IconButton
          label="Bold"
          onClick={() => applyMark('strong')}
          className="p-1.5"
        >
          <Bold className="w-4 h-4" />
        </IconButton>
        <IconButton
          label="Italic"
          onClick={() => applyMark('em')}
          className="p-1.5"
        >
          <Italic className="w-4 h-4" />
        </IconButton>
        <IconButton
          label="Code"
          onClick={() => applyMark('code')}
          className="p-1.5"
        >
          <Code className="w-4 h-4" />
        </IconButton>
      </div>

      {/* Lists & Blocks */}
      <div className="flex gap-0.5">
        <IconButton
          label="Bullet List"
          onClick={() => toggleList('bulletList')}
          className="p-1.5"
        >
          <List className="w-4 h-4" />
        </IconButton>
        <IconButton
          label="Numbered List"
          onClick={() => toggleList('orderedList')}
          className="p-1.5"
        >
          <ListOrdered className="w-4 h-4" />
        </IconButton>
        <IconButton
          label="Blockquote"
          onClick={() => setBlockType('blockquote')}
          className="p-1.5"
        >
          <Quote className="w-4 h-4" />
        </IconButton>
        <IconButton
          label="Code Block"
          onClick={() => setBlockType('codeBlock')}
          className="p-1.5"
        >
          <Code2 className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  );
};
