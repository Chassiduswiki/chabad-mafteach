"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history, undo, redo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { mySchema } from "./schema";
import "prosemirror-view/style/prosemirror.css";
import "./editor-styles.css";
import { createComprehensiveCitationPlugin, insertCitation } from "./plugins/citations/comprehensiveCitationPlugin";
import { CitationCommandPalette } from "./CitationCommandPalette";
import { EditorToolbar } from "./EditorToolbar";
import { useCitationPalette } from "./hooks/useCitationPalette";
import { useEditor } from '@/lib/hooks/useEditor';

interface ProseEditorProps {
  docId: string | null;
  className?: string;
  onBreakStatements?: () => Promise<void>;
}

export const ProseEditor: React.FC<ProseEditorProps> = ({ docId, className, onBreakStatements }) => {
  const {
    initialContent,
    editorContent,
    handleContentChange,
    isSaving: editorIsSaving,
    handleSave,
    isLoading,
    error,
  } = useEditor(docId);

  const {
    isOpen: showCitationPalette,
    range: citationRange,
    openWithRange,
    closePalette,
    handleOpenChange,
  } = useCitationPalette();
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Store handleContentChange in a ref to avoid re-creating editor on every render
  const handleContentChangeRef = useRef(handleContentChange);
  handleContentChangeRef.current = handleContentChange;

  useEffect(() => {
    if (!editorRef.current) return;
    
    // Create a default empty document if no content provided
    const defaultDoc = {
      type: "doc",
      content: [{ type: "paragraph", content: [] }]
    };
    
    const docContent = initialContent || defaultDoc;
    
    // Custom keymaps for formatting
    const customKeymap = {
      "Mod-b": (state: any, dispatch: any) => {
        const mark = mySchema.marks.strong;
        const { from, to } = state.selection;
        const hasMark = state.doc.rangeHasMark(from, to, mark);
        
        if (hasMark) {
          dispatch(state.tr.removeMark(from, to, mark));
        } else {
          dispatch(state.tr.addMark(from, to, mark.create()));
        }
        return true;
      },
      "Mod-i": (state: any, dispatch: any) => {
        const mark = mySchema.marks.em;
        const { from, to } = state.selection;
        const hasMark = state.doc.rangeHasMark(from, to, mark);
        
        if (hasMark) {
          dispatch(state.tr.removeMark(from, to, mark));
        } else {
          dispatch(state.tr.addMark(from, to, mark.create()));
        }
        return true;
      },
      "Mod-`": (state: any, dispatch: any) => {
        const mark = mySchema.marks.code;
        const { from, to } = state.selection;
        const hasMark = state.doc.rangeHasMark(from, to, mark);
        
        if (hasMark) {
          dispatch(state.tr.removeMark(from, to, mark));
        } else {
          dispatch(state.tr.addMark(from, to, mark.create()));
        }
        return true;
      },
    };
    
    let state = EditorState.create({
      doc: mySchema.nodeFromJSON(docContent),
      schema: mySchema,
      plugins: [
        history(),
        keymap({ "Mod-z": undo, "Mod-y": redo }),
        keymap(customKeymap),
        keymap(baseKeymap),
        createComprehensiveCitationPlugin({
          onTrigger: (range) => {
            openWithRange(range);
          },
          onDismiss: () => {
            closePalette();
          },
        })
      ],
    });
    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
        if (transaction.docChanged) {
          handleContentChangeRef.current(newState.doc.toJSON());
        }
      },
      attributes: {
        class: "pm-editor-content prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6",
      },
    });
    viewRef.current = view;
    return () => {
      view.destroy();
    };
  }, [initialContent, openWithRange, closePalette]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  return (
    <div className={`pm-editor-shell ${className ?? ""}`}>
      {/* Main Toolbar */}
      {viewRef.current && (
        <EditorToolbar
          view={viewRef.current}
          onUndo={() => {
            const view = viewRef.current;
            if (view) {
              undo(view.state, view.dispatch);
              view.focus();
            }
          }}
          onRedo={() => {
            const view = viewRef.current;
            if (view) {
              redo(view.state, view.dispatch);
              view.focus();
            }
          }}
          onSave={async () => {
            const result = await handleSave();
            if (result) {
              setFeedback({ type: "success", message: `Saved! Created: ${result.created}, Updated: ${result.updated}, Deleted: ${result.deleted}` });
            } else {
              setFeedback({ type: "error", message: "Failed to save or nothing to save" });
            }
          }}
          onBreakStatements={onBreakStatements}
          isSaving={editorIsSaving}
          canUndo={false}
          canRedo={false}
        />
      )}

      {/* Editor Content */}
      <div className="relative bg-white">
        <div ref={editorRef} className="pm-editor-surface" />

        {/* Floating Toolbar */}
        {/* {viewRef.current && (
          <FloatingToolbar view={viewRef.current} />
        )} */}
      </div>

      {feedback ? (
        <div
          className={`pm-editor-feedback pm-editor-feedback-${feedback.type}`}
          role="status"
        >
          {feedback.message}
        </div>
      ) : null}

      <CitationCommandPalette
        open={showCitationPalette}
        onOpenChange={(open) => {
          handleOpenChange(open);
          if (!open) {
            viewRef.current?.focus();
          }
        }}
        onComplete={(source, reference) => {
          insertCitation(viewRef.current, citationRange, source, reference, mySchema);
          closePalette();
        }}
        onFeedback={(payload) => setFeedback(payload)}
      />
    </div>
  );
};
