"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, FileText, BookOpen, Zap, Sparkles } from 'lucide-react';
import { TipTapEditor } from "@/components/editor/TipTapEditor";

export default function WritePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
      setUser({ role: 'editor', name: 'Editor User' });
    } catch (error) {
      localStorage.removeItem('auth_token');
      router.push('/auth/signin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSave = async () => {
    if (!title.trim()) {
      setSaveStatus('error');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // For now, just show success - in production this would save to database
      setTimeout(() => {
        setSaveStatus('success');
        setTimeout(() => {
          router.push('/editor');
        }, 1500);
      }, 1000);
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBreakStatements = async () => {
    // This would trigger the statement breaking API
    console.log('Breaking content into statements...');
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/editor')}
                className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Editor
              </button>
              <div>
                <input
                  type="text"
                  placeholder="Enter document title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground focus:ring-0"
                />
                <p className="text-sm text-muted-foreground">Write • Hebrew OCR • Advanced Citations</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border border-primary-foreground border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Draft
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Save Status */}
      {saveStatus !== 'idle' && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border max-w-md ${
            saveStatus === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {saveStatus === 'success' ? (
              <Save className="h-5 w-5 text-green-600" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
            )}
            <span>
              {saveStatus === 'success'
                ? 'Content saved successfully! Redirecting...'
                : 'Failed to save content. Please try again.'
              }
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Editor */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Features Banner */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-border p-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-purple-700 dark:text-purple-300">Hebrew OCR</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-700 dark:text-blue-300">AI Citations</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-700 dark:text-green-300">Rich Text</span>
                  </div>
                </div>
              </div>

              <TipTapEditor
                docId={null}
                className="min-h-[600px]"
                onBreakStatements={handleBreakStatements}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent rounded-md transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Break into Statements</div>
                    <div className="text-xs text-muted-foreground">Use AI to split content</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent rounded-md transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Add Citations</div>
                    <div className="text-xs text-muted-foreground">Insert source references</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent rounded-md transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Hebrew OCR</div>
                    <div className="text-xs text-muted-foreground">Paste Hebrew text images</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Writing Tips */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Writing Tips</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <strong className="text-foreground">Hebrew OCR:</strong> Paste images of Hebrew text to instantly convert them to editable text.
                </div>
                <div>
                  <strong className="text-foreground">Citations:</strong> Use [Tanya 1:1] format or click the citation button for advanced references.
                </div>
                <div>
                  <strong className="text-foreground">AI Assistance:</strong> The editor can help break content into statements and detect citations automatically.
                </div>
                <div>
                  <strong className="text-foreground">Rich Formatting:</strong> Use headings, lists, and formatting to structure your content.
                </div>
              </div>
            </div>

            {/* Save Options */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Save Options</h3>
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Save as Draft
                </button>

                <button className="w-full flex items-center gap-3 px-3 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                  <Eye className="h-4 w-4" />
                  Preview Public View
                </button>

                <button className="w-full flex items-center gap-3 px-3 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
