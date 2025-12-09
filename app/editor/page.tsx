"use client";

import React, { useState } from "react";
import { ProseEditor } from "@/components/editor/ProseEditor";
import { StructureSidebar } from "@/components/editor/sidebar/StructureSidebar";
import { IngestionModal } from "@/components/editor/IngestionModal";
import { breakDocumentIntoStatements } from "@/lib/statement-breaking";

export default function EditorPage() {
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleBreakStatements = async () => {
    if (!activeDocId) {
      setFeedback({ type: 'error', message: 'No document selected' });
      return;
    }

    try {
      setFeedback({ type: 'success', message: 'Breaking statements...' });
      
      const result = await breakDocumentIntoStatements(parseInt(activeDocId));
      
      if (result.errors.length > 0) {
        setFeedback({ 
          type: 'error', 
          message: `Completed with errors: ${result.created} statements created. Errors: ${result.errors.join(', ')}` 
        });
      } else {
        setFeedback({ 
          type: 'success', 
          message: `Success! Created ${result.created} statements from ${result.updated} existing ones` 
        });
      }
      
      // Clear feedback after 5 seconds
      setTimeout(() => setFeedback(null), 5000);
      
    } catch (error) {
      console.error('Statement breaking error:', error);
      setFeedback({ type: 'error', message: 'Failed to break statements' });
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
          
          <IngestionModal 
            onDocumentCreated={(documentId: string) => setActiveDocId(documentId)}
          />
        </header>

        <div className="flex-1 overflow-auto">
          {feedback && (
            <div className={`mb-4 p-3 rounded-md ${
              feedback.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {feedback.message}
            </div>
          )}
          <ProseEditor 
            key={activeDocId || 'empty'}
            docId={activeDocId}
            className="min-h-full"
            onBreakStatements={handleBreakStatements}
          />
        </div>
      </div>
    </div>
  );
}
