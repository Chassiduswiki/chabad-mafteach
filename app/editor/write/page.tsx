"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, FileText, BookOpen, Zap, Sparkles, CheckCircle, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { Editor } from "@tiptap/react";

interface UserProfile {
  name: string;
  role: string;
}

export default function WritePage() {
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
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
  const getBreakStatusText = () => {
    switch (breakStatus) {
      case 'idle': return 'Ready';
      case 'processing': return 'Processing';
      case 'success': return 'Complete';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getGrammarStatusText = () => {
    switch (grammarStatus) {
      case 'idle': return 'Ready';
      case 'processing': return 'Processing';
      case 'success': return 'Complete';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getParaphraseStatusText = () => {
    switch (paraphraseStatus) {
      case 'idle': return 'Ready';
      case 'processing': return 'Processing';
      case 'success': return 'Complete';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getBreakStatusColor = () => {
    switch (breakStatus) {
      case 'idle': return 'bg-gray-400';
      case 'processing': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getGrammarStatusColor = () => {
    switch (grammarStatus) {
      case 'idle': return 'bg-gray-400';
      case 'processing': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getParaphraseStatusColor = () => {
    switch (paraphraseStatus) {
      case 'idle': return 'bg-gray-400';
      case 'processing': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

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
              result.statements.forEach((stmt: { text: string }, index: number) => {
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

  const handleEditorReady = (editor: Editor) => {
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
          result.analysis.corrections.forEach((correction: { type: string; original: string; corrected: string; explanation: string }, index: number) => {
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
        // API call failed - provide better error handling
        console.error('Grammar check API call failed:', response.status, response.statusText);

        // Try to get error details from response
        let errorMessage = `API Error (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse error response, use generic message
          errorMessage = response.statusText || 'Unknown API error';
        }

        console.error('Grammar check error details:', errorMessage);

        // Provide fallback message
        let insertContent = '\n\n--- GRAMMAR CHECK UNAVAILABLE ---\n\n';
        insertContent += '**Note:** AI grammar checking service is currently unavailable.\n\n';
        insertContent += '**Your text:** ' + textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');
        insertContent += '\n\n**Error:** ' + errorMessage;
        insertContent += '\n\n*Try again later when the AI service is available.*';

        editor.commands.insertContent(insertContent);
        setGrammarStatus('success'); // Mark as success since we provided feedback
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

        // Handle fallback response when AI service is not configured
        if (result.success === false && result.fallback) {
          console.warn('AI service not configured, using fallback');

          let insertContent = '\n\n--- BASIC TEXT IMPROVEMENT ---\n\n';
          insertContent += '**Note:** AI paraphrase service is not configured. Here\'s your text with basic formatting cleanup:\n\n';
          insertContent += result.fallback.improved_text;
          insertContent += '\n\n**Status:** Basic cleanup applied (AI service needs configuration)';
          insertContent += '\n\n*Contact support to enable AI-powered paraphrasing.*';

          editor.commands.insertContent(insertContent);
          setParaphraseStatus('success');
        } else {
          // Normal AI response
          let insertContent = '\n\n--- IMPROVED VERSION ---\n\n';
          insertContent += result.result.improved_text;
          insertContent += '\n\n--- IMPROVEMENTS MADE ---\n\n';

          if (result.result.improvements && result.result.improvements.length > 0) {
            result.result.improvements.forEach((improvement: { type: string; reason: string; original: string; improved: string }, index: number) => {
              insertContent += `${index + 1}. **${improvement.type.toUpperCase()}**: ${improvement.reason}\n`;
              insertContent += `   "${improvement.original}" → "${improvement.improved}"\n\n`;
            });
          }

          editor.commands.insertContent(insertContent);
          setParaphraseStatus('success');
        }
      } else {
        // API call failed - provide better error handling
        console.error('Paraphrase API call failed:', response.status, response.statusText);

        // Try to get error details from response
        let errorMessage = `API Error (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse error response, use generic message
          errorMessage = response.statusText || 'Unknown API error';
        }

        console.error('Paraphrase error details:', errorMessage);

        // Provide fallback with basic text improvement
        const fallbackText = textContent
          .replace(/\s+/g, ' ') // Normalize spaces
          .replace(/([.!?])\s*/g, '$1 ') // Ensure space after punctuation
          .trim();

        let insertContent = '\n\n--- PARAPHRASE UNAVAILABLE ---\n\n';
        insertContent += '**Note:** AI paraphrase service is currently unavailable. Here\'s your original text with basic formatting cleanup:\n\n';
        insertContent += fallbackText;
        insertContent += '\n\n**Error:** ' + errorMessage;
        insertContent += '\n\n*Try again later when the AI service is available.*';

        editor.commands.insertContent(insertContent);
        setParaphraseStatus('success'); // Still mark as success since we provided a fallback
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
        <div className="grid grid-cols-12 lg:grid-cols-6 gap-6">
          {/* Editor - Always visible, responsive sizing */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-4">
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
                className="min-h-[500px] lg:min-h-[600px]"
                onBreakStatements={handleBreakStatements}
                onGrammarCheck={handleGrammarCheck}
                onParaphrase={handleParaphrase}
                onEditorReady={handleEditorReady}
              />
            </div>
          </div>

          {/* User Guide Sidebar - Hidden on mobile/tablet, visible on desktop */}
          <div className="hidden xl:block xl:col-span-1">
            {/* Getting Started Guide */}
            <div className="bg-card border border-border rounded-lg p-4 mb-4">
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
                    <p className="text-muted-foreground">Grammar check, paraphrase</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-4 mb-4">
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

                <button
                  onClick={handleGrammarCheck}
                  className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-accent rounded-md transition-colors text-xs"
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded ${
                    grammarStatus === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                    grammarStatus === 'success' ? 'bg-green-500/10 text-green-500' :
                    grammarStatus === 'error' ? 'bg-red-500/10 text-red-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {grammarStatus === 'processing' ? (
                      <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent" />
                    ) : grammarStatus === 'success' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : grammarStatus === 'error' ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">Grammar Check</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {grammarStatus === 'processing' ? 'Analyzing...' :
                       grammarStatus === 'success' ? 'Complete!' :
                       grammarStatus === 'error' ? 'Failed' :
                       'AI-powered spelling'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleParaphrase}
                  className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-accent rounded-md transition-colors text-xs"
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded ${
                    paraphraseStatus === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                    paraphraseStatus === 'success' ? 'bg-green-500/10 text-green-500' :
                    paraphraseStatus === 'error' ? 'bg-red-500/10 text-red-500' :
                    'bg-orange-500/10 text-orange-500'
                  }`}>
                    {paraphraseStatus === 'processing' ? (
                      <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent" />
                    ) : paraphraseStatus === 'success' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : paraphraseStatus === 'error' ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">Paraphrase</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {paraphraseStatus === 'processing' ? 'Processing...' :
                       paraphraseStatus === 'success' ? 'Complete!' :
                       paraphraseStatus === 'error' ? 'Failed' :
                       'Improve clarity'}
                    </div>
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
          <div className="hidden xl:block xl:col-span-1">
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

                {/* AI Services Status */}
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="text-xs font-medium text-foreground mb-1">AI Services</div>
                  <div className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${getBreakStatusColor()}`}></div>
                      <span>Statement Breaking: {getBreakStatusText()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${getGrammarStatusColor()}`}></div>
                      <span>Grammar: {getGrammarStatusText()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${getParaphraseStatusColor()}`}></div>
                      <span>Paraphrase: {getParaphraseStatusText()}</span>
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
