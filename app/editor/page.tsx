"use client";

import React, { useState } from "react";
import { ProseEditor } from "@/components/editor/ProseEditor";
import { StructureSidebar } from "@/components/editor/sidebar/StructureSidebar";

export default function EditorPage() {
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

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
        </header>

        <div className="flex-1 overflow-auto">
          <ProseEditor 
            key={activeDocId || 'empty'}
            docId={activeDocId}
            className="min-h-full"
          />
        </div>
      </div>
    </div>
  );
}
