"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, FileText, BookOpen, Zap, Sparkles, CheckCircle, AlertCircle, RefreshCw, Check } from 'lucide-react';
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
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [grammarStatus, setGrammarStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [paraphraseStatus, setParaphraseStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

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

      // For now, we'll save the content first, then break it
      // In production, this would:
      // 1. Save the current content as a document (if not already saved)
      // 2. Create a paragraph from the content
      // 3. Call /api/statements/break with the paragraph_id
      // 4. Update the editor with the AI-generated statements

      // First, save the document if it has content
      if (textContent.trim() && title.trim()) {
        // Simulate saving first
        console.log('Saving document before breaking statements...');

        // Then call the real API
        try {
          // This would normally save the document and get a paragraph_id
          // For demo purposes, we'll simulate the API call

          const response = await fetch('/api/statements/break', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Would include auth token in real implementation
            },
            body: JSON.stringify({
              paragraph_id: 'temp_' + Date.now(), // Would be real paragraph ID
              document_id: 'temp_doc_' + Date.now(), // Would be real document ID
              text_content: textContent // The API doesn't take text_content, but this shows the flow
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('AI Statement breaking result:', result);

            // Simulate inserting the AI-generated statements
            let insertContent = '\n\n--- AI-GENERATED STATEMENTS ---\n\n';
            if (result.statements && result.statements.length > 0) {
              result.statements.forEach((stmt: any, index: number) => {
                insertContent += `**Statement ${index + 1}:** ${stmt.text}\n\n`;
              });
            } else {
              // Fallback: simple period-based splitting
              const sentences = textContent.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
              sentences.forEach((sentence: string, index: number) => {
                insertContent += `**Statement ${index + 1}:** ${sentence.trim()}.\n\n`;
              });
            }

            editor.commands.insertContent(insertContent);

            setBreakStatus('success');
            setTimeout(() => {
              setBreakStatus('idle');
              setIsBreakingStatements(false);
            }, 2000);
          } else {
            throw new Error('API call failed');
          }

        } catch (apiError) {
          console.error('API Error, falling back to simple splitting:', apiError);

          // Fallback: simple sentence splitting
          const sentences = textContent.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
          let insertContent = '\n\n--- SIMPLE STATEMENT SPLITTING ---\n\n';
          sentences.forEach((sentence: string, index: number) => {
            insertContent += `**Statement ${index + 1}:** ${sentence.trim()}.\n\n`;
          });

          editor.commands.insertContent(insertContent);

          setBreakStatus('success');
          setTimeout(() => {
            setBreakStatus('idle');
            setIsBreakingStatements(false);
          }, 2000);
        }
      } else {
        // No content to break
        setBreakStatus('error');
        setTimeout(() => {
          setBreakStatus('idle');
          setIsBreakingStatements(false);
        }, 2000);
      }

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

  const handleGrammarCheck = async () => {
    if (!editorRef.current) {
      console.error('Editor not available');
      return;
    }

    try {
      setIsCheckingGrammar(true);
      setGrammarStatus('processing');

      const editor = editorRef.current;
      const textContent = editor.getText();

      if (!textContent.trim()) {
        setGrammarStatus('error');
        setTimeout(() => {
          setGrammarStatus('idle');
          setIsCheckingGrammar(false);
        }, 2000);
        return;
      }

      console.log('Checking grammar for text:', textContent.substring(0, 100) + '...');

      const response = await fetch('/api/editor/grammar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textContent
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Grammar check result:', result);

        // Insert grammar suggestions
        let insertContent = '\n\n--- GRAMMAR CHECK RESULTS ---\n\n';
        if (result.analysis && result.analysis.issues_found > 0) {
          insertContent += `Found ${result.analysis.issues_found} issues:\n\n`;
          result.analysis.corrections.forEach((correction: any, index: number) => {
            insertContent += `${index + 1}. **${correction.type.toUpperCase()}**: "${correction.original}" → "${correction.corrected}"\n`;
            insertContent += `   Reason: ${correction.explanation}\n\n`;
          });
        } else {
          insertContent += '✅ No grammar or spelling issues found!\n\n';
        }

        if (result.analysis.suggestions && result.analysis.suggestions.length > 0) {
          insertContent += '💡 Suggestions:\n';
          result.analysis.suggestions.forEach((suggestion: string, index: number) => {
            insertContent += `${index + 1}. ${suggestion}\n`;
          });
        }

        editor.commands.insertContent(insertContent);
        setGrammarStatus('success');
      } else {
        throw new Error('Grammar check failed');
      }

      setTimeout(() => {
        setGrammarStatus('idle');
        setIsCheckingGrammar(false);
      }, 2000);

    } catch (error) {
      console.error('Error checking grammar:', error);
      setGrammarStatus('error');
      setTimeout(() => {
        setGrammarStatus('idle');
        setIsCheckingGrammar(false);
      }, 3000);
    }
  };

  const handleParaphrase = async () => {
    if (!editorRef.current) {
      console.error('Editor not available');
      return;
    }

    try {
      setIsParaphrasing(true);
      setParaphraseStatus('processing');

      const editor = editorRef.current;
      const textContent = editor.getText();

      if (!textContent.trim()) {
        setParaphraseStatus('error');
        setTimeout(() => {
          setParaphraseStatus('idle');
          setIsParaphrasing(false);
        }, 2000);
        return;
      }

      console.log('Paraphrasing text:', textContent.substring(0, 100) + '...');

      const response = await fetch('/api/editor/paraphrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textContent,
          style: 'academic' // Could be configurable
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Paraphrase result:', result);

        // Insert improved text
        let insertContent = '\n\n--- IMPROVED VERSION ---\n\n';
        insertContent += result.result.improved_text;
        insertContent += '\n\n--- IMPROVEMENTS MADE ---\n\n';

        if (result.result.improvements && result.result.improvements.length > 0) {
          result.result.improvements.forEach((improvement: any, index: number) => {
            insertContent += `${index + 1}. **${improvement.type.toUpperCase()}**: ${improvement.reason}\n`;
            insertContent += `   "${improvement.original}" → "${improvement.improved}"\n\n`;
          });
        }

        editor.commands.insertContent(insertContent);
        setParaphraseStatus('success');
      } else {
        throw new Error('Paraphrase failed');
      }

      setTimeout(() => {
        setParaphraseStatus('idle');
        setIsParaphrasing(false);
      }, 2000);

    } catch (error) {
      console.error('Error paraphrasing:', error);
      setParaphraseStatus('error');
      setTimeout(() => {
        setParaphraseStatus('idle');
        setIsParaphrasing(false);
      }, 3000);
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
        <div className="grid lg:grid-cols-6 gap-8">
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
                onGrammarCheck={handleGrammarCheck}
                onParaphrase={handleParaphrase}
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
                    <strong className="text-foreground">AI Writing Tools</strong>
                    <p className="text-muted-foreground">Grammar check, paraphrase, and smart editing</p>
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
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Grammar Check</div>
                    <div className="text-xs text-muted-foreground">AI-powered spelling & grammar</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-accent rounded-md transition-colors text-xs">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                    <RefreshCw className="h-3 w-3" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Paraphrase</div>
                    <div className="text-xs text-muted-foreground">Improve clarity and flow</div>
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
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">⚙️</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">AI Processing Preview</h3>
                  <p className="text-sm text-muted-foreground">Real-time view of how AI processes your Hebrew text into structured data</p>
                </div>
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded ml-auto">Desktop Magic</span>
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                {/* Current Document Info */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Document Info
                  </div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Title:</span>
                      <span className="font-medium">{title || 'Untitled'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium text-blue-600">entry</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lang:</span>
                      <span className="font-medium text-green-600">he</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium text-yellow-600">draft</span>
                    </div>
                  </div>
                </div>

                {/* Content Statistics */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Content Stats
                  </div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Characters:</span>
                      <span className="font-medium text-blue-600">{editorRef.current ? editorRef.current.getText().length : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Words:</span>
                      <span className="font-medium text-green-600">{editorRef.current ? editorRef.current.getText().split(/\s+/).filter((word: string) => word.length > 0).length : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paragraphs:</span>
                      <span className="font-medium text-purple-600">{editorRef.current ? editorRef.current.getText().split('\n\n').filter((p: string) => p.trim().length > 0).length : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sentences:</span>
                      <span className="font-medium text-orange-600">{editorRef.current ? editorRef.current.getText().split(/[.!?]+/).filter((s: string) => s.trim().length > 0).length : 0}</span>
                    </div>
                  </div>
                </div>

                {/* AI Services Status */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    AI Services
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Statement Breaking:</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        breakStatus === 'idle' ? 'bg-gray-100 text-gray-600' :
                        breakStatus === 'processing' ? 'bg-blue-100 text-blue-600' :
                        breakStatus === 'success' ? 'bg-green-100 text-green-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          breakStatus === 'idle' ? 'bg-gray-400' :
                          breakStatus === 'processing' ? 'bg-blue-500' :
                          breakStatus === 'success' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}></div>
                        {breakStatus === 'idle' ? 'Ready' :
                         breakStatus === 'processing' ? 'Processing' :
                         breakStatus === 'success' ? 'Complete' :
                         'Error'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Grammar Check:</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        grammarStatus === 'idle' ? 'bg-gray-100 text-gray-600' :
                        grammarStatus === 'processing' ? 'bg-blue-100 text-blue-600' :
                        grammarStatus === 'success' ? 'bg-green-100 text-green-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          grammarStatus === 'idle' ? 'bg-gray-400' :
                          grammarStatus === 'processing' ? 'bg-blue-500' :
                          grammarStatus === 'success' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}></div>
                        {grammarStatus === 'idle' ? 'Ready' :
                         grammarStatus === 'processing' ? 'Processing' :
                         grammarStatus === 'success' ? 'Complete' :
                         'Error'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Paraphrase:</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        paraphraseStatus === 'idle' ? 'bg-gray-100 text-gray-600' :
                        paraphraseStatus === 'processing' ? 'bg-blue-100 text-blue-600' :
                        paraphraseStatus === 'success' ? 'bg-green-100 text-green-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          paraphraseStatus === 'idle' ? 'bg-gray-400' :
                          paraphraseStatus === 'processing' ? 'bg-blue-500' :
                          paraphraseStatus === 'success' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}></div>
                        {paraphraseStatus === 'idle' ? 'Ready' :
                         paraphraseStatus === 'processing' ? 'Processing' :
                         paraphraseStatus === 'success' ? 'Complete' :
                         'Error'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-Width Processing Preview */}
              <div className="bg-muted/30 rounded-lg p-6">
                <div className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  Real-Time AI Processing Preview
                  <span className="text-xs bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-purple-300 px-2 py-1 rounded ml-2">Desktop Magic</span>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    When you click "Break into Statements", this is how your Hebrew text gets processed by AI:
                  </div>

                  {/* Enhanced Processing Visualization */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                      {/* Input Text */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">📝 Your Input Text</span>
                          <span className="text-xs text-muted-foreground">(Hebrew/English content)</span>
                        </div>
                        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded border-l-4 border-blue-400">
                          {editorRef.current ? editorRef.current.getText().split('\n\n')[0]?.substring(0, 120) + '...' : 'Your Hebrew text content will appear here...'}
                        </div>
                      </div>

                      {/* AI Processing Arrow */}
                      <div className="flex flex-col items-center gap-2 pt-8">
                        <div className="text-2xl">🤖</div>
                        <div className="text-xs text-center text-purple-600 dark:text-purple-300 font-medium">
                          DeepSeek R1<br/>Processing
                        </div>
                        <div className="text-lg">↓</div>
                      </div>

                      {/* Output Structure */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">📄 Structured Output</span>
                          <span className="text-xs text-muted-foreground">(Database-ready format)</span>
                        </div>

                        <div className="space-y-3">
                          {/* Paragraph Structure */}
                          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded border-l-4 border-green-400">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">Paragraph 1</span>
                              <span className="text-xs text-muted-foreground font-mono">id: p_001</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {editorRef.current ? editorRef.current.getText().split('\n\n')[0]?.substring(0, 80) + '...' : 'Processed paragraph text...'}
                            </div>
                          </div>

                          {/* Statements */}
                          <div className="ml-4 space-y-2">
                            <div className="bg-purple-50 dark:bg-purple-950/20 p-2 rounded border-l-4 border-purple-400">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Statement 1.1</span>
                                <span className="text-xs text-muted-foreground font-mono">id: s_001</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {editorRef.current ? editorRef.current.getText().split('.')[0] + '.' : 'Individual statement...'}
                              </div>

                              {/* Citations */}
                              <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                                <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">📎 Citations Detected:</div>
                                <div className="bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded text-xs">
                                  <code className="text-orange-800 dark:text-orange-200">"Tanya 1:1" → appended_text</code>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded border border-blue-200 dark:border-purple-700">
                      <div className="text-sm text-blue-800 dark:text-purple-200">
                        <strong>💡 AI Magic:</strong> Hebrew text gets analyzed for linguistic patterns, citations are extracted and linked,
                        content is broken into logical statements while preserving meaning and context. This creates structured,
                        searchable, and citable content ready for the database.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Model Reference - Full Width */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Data Model Reference
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-700">
                    <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">documents</div>
                    <div className="text-xs text-muted-foreground">Main containers for content</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-700">
                    <div className="font-medium text-green-700 dark:text-green-300 mb-1">paragraphs</div>
                    <div className="text-xs text-muted-foreground">Logical text sections</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-200 dark:border-purple-700">
                    <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">statements</div>
                    <div className="text-xs text-muted-foreground">Individual claims</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-700">
                    <div className="font-medium text-orange-700 dark:text-orange-300 mb-1">appended_text</div>
                    <div className="text-xs text-muted-foreground">Citations & footnotes</div>
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
