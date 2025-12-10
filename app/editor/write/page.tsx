"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, FileText, BookOpen, Zap, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { TipTapEditor } from "@/components/editor/TipTapEditor";

export default function WritePage() {
  const router = useRouter();
  const editorRef = useRef<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isBreakingStatements, setIsBreakingStatements] = useState(false);
  const [breakStatus, setBreakStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

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
    // Get current editor content
    if (!editorRef.current) {
      console.error('Editor not available');
      return;
    }

    try {
      setIsBreakingStatements(true);
      setBreakStatus('processing');

      // Get the current content from the TipTap editor
      const editor = editorRef.current;
      const htmlContent = editor.getHTML();
      const textContent = editor.getText();

      console.log('Breaking statements for content:', textContent.substring(0, 100) + '...');

      // For now, we'll simulate the API call since we need to create a document first
      // In production, this would:
      // 1. Save the current content as a document
      // 2. Call /api/statements/break with document_id
      // 3. Update the editor with the broken statements

      // Simulate processing
      setTimeout(() => {
        setBreakStatus('success');
        // Simulate inserting broken statements
        editor.commands.insertContent('<p><strong>Statement 1:</strong> ' + textContent.split('.')[0] + '.</p>');
        setTimeout(() => {
          setBreakStatus('idle');
          setIsBreakingStatements(false);
        }, 2000);
      }, 1500);

    } catch (error) {
      console.error('Error breaking statements:', error);
      setBreakStatus('error');
      setTimeout(() => {
        setBreakStatus('idle');
        setIsBreakingStatements(false);
      }, 3000);
    }
  };

  const handleEditorReady = (editor: any) => {
    editorRef.current = editor;
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
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Editor - Takes more space now */}
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
                onEditorReady={handleEditorReady}
              />
            </div>
          </div>

          {/* User Guide Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Getting Started Guide */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">How to Write</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold mt-0.5">1</div>
                  <div>
                    <strong className="text-foreground">Write</strong>
                    <p className="text-muted-foreground">Your article or insights</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold mt-0.5">2</div>
                  <div>
                    <strong className="text-foreground">Add Citations</strong>
                    <p className="text-muted-foreground">Click book icon for references</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-white text-xs font-bold mt-0.5">3</div>
                  <div>
                    <strong className="text-foreground">Process</strong>
                    <p className="text-muted-foreground">Break into statements</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Tools</h3>
              <div className="space-y-2">
                <button
                  onClick={handleBreakStatements}
                  disabled={isBreakingStatements}
                  className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-accent rounded-md transition-colors disabled:opacity-50 text-xs"
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded ${
                    breakStatus === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                    breakStatus === 'success' ? 'bg-green-500/10 text-green-500' :
                    breakStatus === 'error' ? 'bg-red-500/10 text-red-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {breakStatus === 'processing' ? (
                      <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent" />
                    ) : breakStatus === 'success' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : breakStatus === 'error' ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">Break Statements</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {breakStatus === 'processing' ? 'Processing...' :
                       breakStatus === 'success' ? 'Done!' :
                       breakStatus === 'error' ? 'Failed' :
                       'AI splitting'}
                    </div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-accent rounded-md transition-colors text-xs">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                    <BookOpen className="h-3 w-3" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Add Citation</div>
                    <div className="text-xs text-muted-foreground">Reference sources</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Save Actions */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Save</h3>
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="w-full flex items-center gap-2 px-2 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  <Save className="h-3 w-3" />
                  <div>
                    <div className="font-medium">Save Draft</div>
                    <div className="text-xs opacity-90">Save for later</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Technical Data Preview - Developer Debug Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500 text-white text-xs">⚙️</div>
                <h3 className="text-sm font-semibold text-foreground">Data Preview</h3>
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">Debug</span>
              </div>

              <div className="space-y-3">
                {/* Current Document Info */}
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="text-xs font-medium text-foreground mb-1">Document</div>
                  <div className="text-xs space-y-0.5 font-mono">
                    <div><span className="text-muted-foreground">Title:</span> {title || 'Untitled'}</div>
                    <div><span className="text-muted-foreground">Type:</span> entry</div>
                    <div><span className="text-muted-foreground">Lang:</span> he</div>
                  </div>
                </div>

                {/* Content Statistics */}
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="text-xs font-medium text-foreground mb-1">Content Stats</div>
                  <div className="text-xs space-y-0.5 font-mono">
                    <div><span className="text-muted-foreground">Chars:</span> {editorRef.current ? editorRef.current.getText().length : 0}</div>
                    <div><span className="text-muted-foreground">Words:</span> {editorRef.current ? editorRef.current.getText().split(/\s+/).filter((word: string) => word.length > 0).length : 0}</div>
                    <div><span className="text-muted-foreground">Paras:</span> {editorRef.current ? editorRef.current.getText().split('\n\n').filter((p: string) => p.trim().length > 0).length : 0}</div>
                  </div>
                </div>

                {/* Processing Preview */}
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="text-xs font-medium text-foreground mb-2">Processing Preview</div>
                  <div className="text-xs space-y-1.5">
                    <div className="text-muted-foreground mb-1">When "Break Statements" runs:</div>

                    {/* Simulated Paragraph Structure */}
                    <div className="bg-white dark:bg-gray-800 rounded p-1.5 border text-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-medium text-blue-600 dark:text-blue-400">📄 P1</span>
                        <span className="text-muted-foreground font-mono">id: p_001</span>
                      </div>
                      <div className="text-muted-foreground mb-1 pl-3 border-l-2 border-blue-200 dark:border-blue-700 truncate">
                        {editorRef.current ? editorRef.current.getText().split('\n\n')[0]?.substring(0, 30) + '...' : 'Your content...'}
                      </div>

                      {/* Simulated Statements */}
                      <div className="pl-3 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-green-600 dark:text-green-400">📝 S1.1</span>
                          <span className="text-muted-foreground font-mono">id: s_001</span>
                        </div>
                        <div className="text-muted-foreground pl-3 border-l-2 border-green-200 dark:border-green-700 text-xs truncate">
                          {editorRef.current ? editorRef.current.getText().split('.')[0] + '.' : 'Statement...'}
                        </div>

                        {/* Citations Preview */}
                        <div className="pl-3 mt-1">
                          <div className="text-orange-600 dark:text-orange-400 text-xs mb-0.5">📎 Citations:</div>
                          <div className="bg-orange-50 dark:bg-orange-950/20 rounded p-1 text-xs">
                            Tanya 1:1 → appended_text
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-muted-foreground text-xs mt-2">
                      💡 Citations become appended_text attached to statements
                    </div>
                  </div>
                </div>

                {/* Data Model Reference */}
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="text-xs font-medium text-foreground mb-1">Data Model</div>
                  <div className="text-xs space-y-0.5 font-mono">
                    <div><span className="text-blue-600">documents</span> → containers</div>
                    <div><span className="text-green-600">paragraphs</span> → sections</div>
                    <div><span className="text-purple-600">statements</span> → claims</div>
                    <div><span className="text-orange-600">appended_text</span> → citations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
