'use client';

import React, { useState, useEffect } from 'react';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Save, FileText, Database, Link, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentData {
  id: string;
  title: string;
  paragraphs: ParagraphData[];
}

interface ParagraphData {
  id: string;
  order_key: string;
  text: string;
  original_lang: string;
  status: 'draft' | 'reviewed' | 'published';
  statements: StatementData[];
}

interface StatementData {
  id: string;
  order_key: string;
  text: string;
  original_lang: string;
  status: 'draft' | 'reviewed' | 'published';
  topics: TopicData[];
  sources: SourceData[];
}

interface TopicData {
  id: string;
  canonical_title: string;
  relevance_score: number;
}

interface SourceData {
  id: string;
  title: string;
  relationship_type: string;
}

interface SmartEditorProps {
  documentId: string;
  onSave?: (data: DocumentData) => Promise<void>;
  onAutoBreak?: (paragraphId: string) => Promise<void>;
}

export const SmartEditor: React.FC<SmartEditorProps> = ({
  documentId,
  onSave,
  onAutoBreak
}) => {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [selectedParagraph, setSelectedParagraph] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'structure' | 'preview'>('edit');

  // Load document data
  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/documents/${documentId}?fields=*,paragraphs.statements.*`);
      const data = await response.json();
      setDocument(data);
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (paragraphId: string, newContent: string) => {
    if (!document) return;

    setDocument(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        paragraphs: prev.paragraphs.map(p =>
          p.id === paragraphId ? { ...p, text: newContent } : p
        )
      };
    });
    setHasChanges(true);
  };

  const handleSaveDocument = async () => {
    if (!document || !onSave) return;

    try {
      await onSave(document);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  const handleBreakIntoStatements = async (paragraphId: string) => {
    if (!onAutoBreak) return;

    try {
      await onAutoBreak(paragraphId);
      // Reload document to get updated statements
      await loadDocument();
    } catch (error) {
      console.error('Failed to break into statements:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Document not found or failed to load.</AlertDescription>
      </Alert>
    );
  }

  const selectedPara = selectedParagraph ? document.paragraphs.find(p => p.id === selectedParagraph) : null;

  return (
    <div className="editor-layout editor-layout-with-sidebar">
      {/* Sidebar - Document Structure */}
      <div className="editor-sidebar">
        <h3 className="font-semibold text-foreground mb-4">Document Structure</h3>
        <div className="space-y-2">
          {document.paragraphs.map((paragraph) => (
            <button
              key={paragraph.id}
              onClick={() => setSelectedParagraph(paragraph.id)}
              className={`w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors text-sm ${
                selectedParagraph === paragraph.id ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Badge variant={paragraph.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                  {paragraph.status}
                </Badge>
                <Badge variant="outline" className="text-xs">{paragraph.original_lang.toUpperCase()}</Badge>
              </div>
              <p className="font-medium">Paragraph {paragraph.order_key}</p>
              <p className="text-xs text-muted-foreground">
                {paragraph.statements.length} statements
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="editor-main">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{document.title}</h1>
            <p className="text-muted-foreground">
              {document.paragraphs.length} paragraphs •
              {document.paragraphs.reduce((sum, p) => sum + p.statements.length, 0)} statements
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Unsaved Changes
              </Badge>
            )}
            <Button
              onClick={handleSaveDocument}
              disabled={!hasChanges}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Document
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Edit Content
            </TabsTrigger>
            <TabsTrigger value="structure" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Structure
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6">
            {/* Editor */}
            {selectedPara && (
              <Card className="dashboard-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Editing Paragraph {selectedPara.order_key}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBreakIntoStatements(selectedPara.id)}
                        className="flex items-center gap-2"
                      >
                        <Link className="h-4 w-4" />
                        Break into Statements
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <TipTapEditor
                    docId={documentId}
                    className="min-h-[600px]"
                    onBreakStatements={() => handleBreakIntoStatements(selectedPara.id)}
                  />
                </CardContent>
              </Card>
            )}
            
            {!selectedPara && (
              <Card className="dashboard-card">
                <CardContent className="p-6 text-center text-muted-foreground">
                  Select a paragraph from the sidebar to start editing
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="structure" className="space-y-6">
            {/* Document Structure Tree */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Document Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {document.paragraphs.map((paragraph) => (
                    <div key={paragraph.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Paragraph {paragraph.order_key}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{paragraph.original_lang}</Badge>
                          <Badge variant={paragraph.status === 'published' ? 'default' : 'secondary'}>
                            {paragraph.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="ml-4 space-y-2">
                        {paragraph.statements.map((statement) => (
                          <div key={statement.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex-1">
                              <p className="text-sm">Statement {statement.order_key}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {statement.text.substring(0, 80)}...
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {statement.topics.slice(0, 2).map((topic) => (
                                <Badge key={topic.id} variant="outline" className="text-xs">
                                  {topic.canonical_title}
                                </Badge>
                              ))}
                              {statement.topics.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{statement.topics.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {/* Full Document Preview */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Document Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {document.paragraphs.map((paragraph) => (
                    <div key={paragraph.id} className="border-l-4 border-primary/20 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Paragraph {paragraph.order_key}</Badge>
                        <Badge variant="outline">{paragraph.original_lang}</Badge>
                      </div>

                      <div
                        className="prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: paragraph.text }}
                      />

                      {paragraph.statements.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {paragraph.statements.map((statement) => (
                            <div key={statement.id} className="ml-4 p-3 bg-muted/30 rounded border-l-2 border-primary/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  Statement {statement.order_key}
                                </Badge>
                                {statement.topics.map((topic) => (
                                  <Badge key={topic.id} variant="outline" className="text-xs">
                                    {topic.canonical_title}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-sm">{statement.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
