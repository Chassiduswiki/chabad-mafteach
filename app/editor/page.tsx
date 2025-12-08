"use client";

import React, { useState, useEffect } from "react";
import { ProseEditor } from "@/components/editor/ProseEditor";
import { useEditorDocument } from "@/lib/hooks/useEditorDocument";
import { Paragraph } from "@/lib/types";
import { StructureSidebar } from "@/components/editor/sidebar/StructureSidebar";
import {
  useEditorSync,
  transformToProseMirror,
} from "@/components/editor/hooks/useEditorSync";
import { Loader2, Save } from "lucide-react";

export default function EditorPage() {
  const [docId, setDocId] = useState<string>("");
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<any>(null);
  const { isSaving, save } = useEditorSync();
  
  // Fetch data from Directus
  const { data: document, isLoading, error } = useEditorDocument(activeDocId);

  // Load content into editor when document matches
  const [initialContent, setInitialContent] = useState<any>(null);

  useEffect(() => {
    if (document && document.paragraphs) {
      const pmJson = transformToProseMirror(document.paragraphs);
      setInitialContent(pmJson);
      // Also set the current editor content state for the JSON view
      setEditorContent(pmJson);
    }
  }, [document]);

  const handleSave = async () => {
    if (!document) return;

    // Use current editorContent, or fall back to initialContent if user hasn't edited yet
    const contentToSave = editorContent ?? initialContent;
    if (!contentToSave) return;

    const results = await save({
      docId: activeDocId,
      document: document ?? undefined,
      editorContent: contentToSave,
    });

    if (results) {
      console.log("Save completed", results);
      alert(
        `Saved! Created: ${results.created}, Updated: ${results.updated}, Deleted: ${results.deleted}`
      );
    } else {
      alert("Failed to save changes");
    }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* Sidebar */}
      <StructureSidebar 
        currentDocId={activeDocId} 
        onSelectDoc={(id: string) => setActiveDocId(id)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <header className="flex justify-between items-center p-4 border-b bg-white">
            <div className="flex flex-col">
                <h1 className="text-xl font-bold">Article Editor</h1>
                <span className="text-xs text-gray-500">
                    {activeDocId ? `Doc ID: ${activeDocId}` : "Select a document"}
                </span>
            </div>
            
            <div className="flex gap-2">
                <button
                    onClick={handleSave}
                    disabled={isSaving || !activeDocId}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </header>

        {error ? (
            <div className="bg-red-50 text-red-600 p-4 m-4 rounded">
                Error loading document: {(error as Error).message}
            </div>
        ) : null}
        
        <div className="flex-1 flex overflow-hidden">
            {/* Editor Column */}
            <div className="flex-1 flex flex-col min-w-0 border-r">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">
                        {document?.title || "Untitled Document"}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-600">
                        {document?.status || "No Status"}
                    </span>
                </div>
                
                <div className="flex-1 overflow-auto p-8 bg-white">
                    {/* Key forces re-render when new document loads */}
                    <ProseEditor 
                        key={activeDocId || 'empty'}
                        initialContent={initialContent}
                        onChange={(json) => setEditorContent(json)}
                        className="min-h-full border-none shadow-none focus:ring-0"
                    />
                </div>
            </div>

            {/* Inspector/JSON Column */}
            <div className="w-80 bg-gray-50 flex flex-col border-l">
                 <div className="p-4 border-b">
                    <h2 className="font-semibold text-sm uppercase text-gray-500">Live Structure</h2>
                 </div>
                <div className="flex-1 overflow-auto p-4">
                    <pre className="text-xs font-mono bg-white p-2 border rounded overflow-x-auto">
                        {editorContent ? JSON.stringify(editorContent, null, 2) : "Start typing..."}
                    </pre>
                </div>
                <div className="p-4 border-t bg-blue-50">
                    <h3 className="font-semibold text-blue-900 text-xs mb-2">DEBUG INFO</h3>
                    <ul className="text-xs text-blue-800 space-y-1">
                        <li><strong>Paragraphs:</strong> {document?.paragraphs?.length || 0}</li>
                        <li><strong>Status:</strong> {document?.status}</li>
                    </ul>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
