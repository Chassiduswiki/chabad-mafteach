"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history, undo, redo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { Undo2, Redo2 } from "lucide-react";
import { mySchema } from "./schema";
import "prosemirror-view/style/prosemirror.css";
import { createCitationPlugin } from "./plugins/citations/createCitationPlugin";
import { CitationCommandPalette } from "./CitationCommandPalette";
import { IconButton } from "@/components/ui/IconButton";
import { useCitationPalette } from "./hooks/useCitationPalette";

interface ProseEditorProps {
  initialContent?: any; // JSON object or HTML string
  onChange?: (json: any) => void;
  className?: string;
}

export const ProseEditor: React.FC<ProseEditorProps> = ({
  initialContent,
  onChange,
  className,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  
  // Citation palette state
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

  // Initialize the editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Create the initial state
    let state;
    
    // ... (Initial content logic remains same, but we need to re-create it here or extract it)
    // For brevity, I'm duplicating the simple logic, assuming initialContent is handled by parent key-reset
    // In a real refactor, we'd move state creation out.
    
    const doc = initialContent && typeof initialContent === 'object' 
        ? mySchema.nodeFromJSON(initialContent) 
        : undefined;

    state = EditorState.create({
        doc,
        schema: mySchema,
        plugins: [
            history(),
            keymap({ "Mod-z": undo, "Mod-y": redo }),
            keymap(baseKeymap),
            createCitationPlugin({
              onTrigger: (range) => {
                openWithRange(range);
              },
              onDismiss: () => {
                closePalette();
              },
            })
        ],
    });

    // Create the view
    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
        if (transaction.docChanged && onChange) {
          onChange(newState.doc.toJSON());
        }
      },
      attributes: {
        class: "ProseMirror pm-editor-content",
      },
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []); 

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const insertCitation = (
    source: { id: number; title: string },
    reference: string
  ) => {
    const view = viewRef.current;
    if (!view || !citationRange) return;

    // Insert the citation node
    const citationNode = mySchema.nodes.citation.create({
        source_id: source.id,
        source_title: source.title,
        reference: reference
    });

    const tr = view.state.tr.replaceWith(
      citationRange.from,
      citationRange.to,
      citationNode
    );
    // Add a space after for easier continued typing
    tr.insertText(" ", citationRange.from + citationNode.nodeSize);

    view.dispatch(tr);
    view.focus();
    closePalette();
  };

  return (
    <div className={`pm-editor-shell ${className ?? ""}`}>
      <div className="pm-editor-toolbar">
        <div className="pm-editor-toolbar-left">
          <IconButton
            label="Undo"
            onClick={() => {
              const view = viewRef.current;
              if (view) {
                undo(view.state, view.dispatch);
                view.focus();
              }
            }}
          >
            <Undo2 className="h-5 w-5" />
          </IconButton>
          <IconButton
            label="Redo"
            onClick={() => {
              const view = viewRef.current;
              if (view) {
                redo(view.state, view.dispatch);
                view.focus();
              }
            }}
          >
            <Redo2 className="h-5 w-5" />
          </IconButton>
        </div>
        <span className="pm-editor-hint">Type “@” to cite</span>
      </div>

      <div ref={editorRef} className="pm-editor-surface" />

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
          insertCitation(source, reference);
        }}
        onFeedback={(payload) => setFeedback(payload)}
      />
    </div>
  );
}
;
