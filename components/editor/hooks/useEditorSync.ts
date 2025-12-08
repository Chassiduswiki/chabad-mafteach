"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Paragraph } from "@/lib/types";
import { syncEditorContent } from "@/lib/editor-sync";

export const transformToProseMirror = (paragraphs: Paragraph[] = []) => {
  if (!paragraphs.length) return null;

  return {
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      attrs: {
        id: p.id,
        status: p.status || "draft",
      },
      content: p.text
        ? [
            {
              type: "text",
              text: p.text,
            },
          ]
        : [],
    })),
  };
};

interface SaveArgs {
  docId: string | number | null;
  document?: { paragraphs?: Paragraph[] };
  editorContent?: any;
}

export const useEditorSync = () => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(
    async ({ docId, document, editorContent }: SaveArgs) => {
      if (!docId || !document || !editorContent) return null;

      setIsSaving(true);
      try {
        const results = await syncEditorContent(
          docId,
          document.paragraphs || [],
          editorContent
        );

        await queryClient.invalidateQueries({
          queryKey: ["editor-document", docId],
        });

        return results;
      } catch (error) {
        console.error("Failed to sync editor content", error);
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [queryClient]
  );

  return { isSaving, save };
};
