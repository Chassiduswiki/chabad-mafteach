"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProseEditor } from "@/components/editor/ProseEditor";
import { StructureSidebar } from "@/components/editor/sidebar/StructureSidebar";
import { IngestionModal } from "@/components/editor/IngestionModal";
import { breakDocumentIntoStatements } from "@/lib/statement-breaking";

export default function EditorPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    // Verify token (simple check - in production you'd verify with the server)
    try {
      // For demo purposes, we'll just check if token exists
      // In production, you'd decode and verify the JWT
      setUser({ role: 'editor', name: 'Editor User' }); // Mock user data
    } catch (error) {
      localStorage.removeItem('auth_token');
      router.push('/auth/signin');
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <StructureSidebar
        currentDocId={activeDocId}
        onSelectDoc={(id: string) => setActiveDocId(id)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <header className="flex justify-between items-center p-4 border-b bg-background">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground">Article Editor</h1>
            <span className="text-xs text-muted-foreground">
              {activeDocId ? `Doc ID: ${activeDocId}` : "Select a document"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Out
            </button>

            <IngestionModal
              onDocumentCreated={(documentId: string) => setActiveDocId(documentId)}
            />
          </div>
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
