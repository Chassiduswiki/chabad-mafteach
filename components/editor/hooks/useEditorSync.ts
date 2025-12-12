"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ContentBlock } from "@/lib/types";
import { syncEditorContent } from "@/lib/editor-sync";

export const transformToProseMirror = (contentBlocks: ContentBlock[] = []) => { // **[CHANGED]** from paragraphs: Paragraph[]
  if (!contentBlocks.length) return null; // **[CHANGED]** from paragraphs

  return {
    type: "doc",
    content: contentBlocks.map((block) => ({ // **[CHANGED]** from paragraphs.map((p)
      type: "paragraph",
      attrs: {
        id: block.id, // **[CHANGED]** from p.id
        status: block.status || "draft", // **[CHANGED]** from p.status
      },
      content: block.content // **[CHANGED]** from p.text
        ? [
            {
              type: "text",
              text: block.content, // **[CHANGED]** from p.text
            },
          ]
        : [],
    })),
  };
};

interface SaveArgs {
  docId: string | number | null;
  document?: { contentBlocks?: ContentBlock[] }; // **[CHANGED]** from paragraphs?: Paragraph[]
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
          document.contentBlocks || [], // **[CHANGED]** from paragraphs
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
