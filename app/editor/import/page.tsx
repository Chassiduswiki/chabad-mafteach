"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, BookOpen, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { IngestionModal } from "@/components/editor/IngestionModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ImportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentImports, setRecentImports] = useState<any[]>([]);

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

    // Load recent imports (mock data for now)
    setRecentImports([
      {
        id: '1',
        title: 'Tanya - Likkutei Amarim',
        source: 'Sefaria',
        status: 'completed',
        paragraphs: 245,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: '2',
        title: 'Mishneh Torah - Foundations of Torah',
        source: 'Sefaria',
        status: 'completed',
        paragraphs: 89,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: '3',
        title: 'PDF Document - Chabad Library',
        source: 'PDF Upload',
        status: 'processing',
        progress: 75,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    ]);
  }, [router]);

  const handleDocumentCreated = (documentId: string) => {
    // Refresh recent imports or navigate to the document
    console.log('Document created:', documentId);
    // Could refresh the list or navigate to the document
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
                <h1 className="text-xl font-semibold text-foreground">Import Content</h1>
                <p className="text-sm text-muted-foreground">Add new texts to the system</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Import Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sefaria Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  Import from Sefaria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Import texts directly from Sefaria's extensive Jewish library. Search for books and import them with proper Hebrew text and structure.
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Supports: Tanya, Mishneh Torah, Talmud, and more
                  </div>
                  <IngestionModal
                    onDocumentCreated={handleDocumentCreated}
                    trigger={
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <BookOpen className="h-4 w-4" />
                        Import from Sefaria
                      </button>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Text File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  Upload Text Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Upload plain text files (.txt) to add new content to the system. Files will be automatically processed and structured.
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Format: Plain text, UTF-8 encoding
                  </div>
                  <IngestionModal
                    onDocumentCreated={handleDocumentCreated}
                    trigger={
                      <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                        <FileText className="h-4 w-4" />
                        Upload Text File
                      </button>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* PDF Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                    <Upload className="h-5 w-5" />
                  </div>
                  Upload PDF Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Upload PDF documents for processing. Text-based PDFs will extract content directly. Scanned PDFs require OCR processing.
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Max size: 50MB • Async processing
                  </div>
                  <IngestionModal
                    onDocumentCreated={handleDocumentCreated}
                    trigger={
                      <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                        <Upload className="h-4 w-4" />
                        Upload PDF
                      </button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Imports Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Imports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentImports.map((import_) => (
                    <div key={import_.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        import_.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                        import_.status === 'processing' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {import_.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : import_.status === 'processing' ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {import_.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {import_.source}
                          </Badge>
                          {import_.paragraphs && (
                            <span className="text-xs text-muted-foreground">
                              {import_.paragraphs} paragraphs
                            </span>
                          )}
                        </div>

                        {import_.status === 'processing' && import_.progress && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${import_.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              {import_.progress}% complete
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-1">
                          {import_.createdAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {recentImports.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent imports</p>
                      <p className="text-xs">Your imported documents will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Import Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <strong className="text-foreground">Sefaria Import:</strong>
                  <p className="text-muted-foreground">Best for well-structured Jewish texts. Search for exact book titles.</p>
                </div>

                <div className="text-sm">
                  <strong className="text-foreground">Text Files:</strong>
                  <p className="text-muted-foreground">Use for custom content. Ensure UTF-8 encoding for Hebrew text.</p>
                </div>

                <div className="text-sm">
                  <strong className="text-foreground">PDF Files:</strong>
                  <p className="text-muted-foreground">Async processing. Text-based PDFs are faster than scanned documents.</p>
                </div>

                <div className="text-sm">
                  <strong className="text-foreground">Processing Time:</strong>
                  <p className="text-muted-foreground">Sefaria: Instant • Text: Seconds • PDF: Minutes (depending on size)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
