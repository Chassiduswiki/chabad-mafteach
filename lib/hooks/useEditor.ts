import { useState, useEffect } from 'react';
import { useEditorDocument } from '@/lib/hooks/useEditorDocument';
import { useEditorSync } from '@/components/editor/hooks/useEditorSync';
import { transformToProseMirror } from '@/components/editor/hooks/useEditorSync';

export function useEditor(docId: string | null) {
  const { data: document, isLoading, error } = useEditorDocument(docId);
  const { isSaving, save } = useEditorSync();
  const [editorContent, setEditorContent] = useState<any>(null);
  const [initialContent, setInitialContent] = useState<any>(null);

  useEffect(() => {
    if (document && document.paragraphs) {
      const pmJson = transformToProseMirror(document.paragraphs);
      setInitialContent(pmJson);
      setEditorContent(pmJson);
    }
  }, [document]);

  const handleContentChange = (json: any) => {
    setEditorContent(json);
  };

  const handleSave = async () => {
    if (!docId || !document || !editorContent) return null;
    return save({ docId, document, editorContent });
  };

  return {
    initialContent,
    editorContent,
    handleContentChange,
    isSaving,
    handleSave,
    isLoading,
    error,
  };
}
