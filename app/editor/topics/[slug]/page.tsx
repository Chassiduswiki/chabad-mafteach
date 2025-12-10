'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, AlertCircle, CheckCircle, FileText, BookOpen } from 'lucide-react';
import { Topic } from '@/lib/types';

export default function TopicEditorPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    canonical_title: '',
    description: '',
    topic_type: '',
    definition_positive: '',
    definition_negative: ''
  });

  // Load topic data
  useEffect(() => {
    if (slug) {
      loadTopic();
    }
  }, [slug]);

  const loadTopic = async () => {
    try {
      setIsLoading(true);
      // Load full topic data including documents and paragraphs
      const response = await fetch(`/api/topics/${slug}`);
      if (response.ok) {
        const data = await response.json();
        // The API returns { topic: {...}, citations: [...], relatedTopics: [...] }
        const topicData = data.topic || data;
        setTopic(topicData);
        setFormData({
          canonical_title: topicData.canonical_title || '',
          description: topicData.description || '',
          topic_type: topicData.topic_type || '',
          definition_positive: topicData.definition_positive || '',
          definition_negative: topicData.definition_negative || ''
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to load topic:', response.status, errorData);
        // Show more specific error message
        console.error(`HTTP ${response.status}: ${errorData.error || 'Failed to load topic'}`);
      }
    } catch (error) {
      console.error('Network error loading topic:', error);
      console.error('Error details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!topic) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch(`/api/topics/${topic.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => {
          router.push(`/topics/${slug}`);
        }, 1500);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving topic:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    router.push(`/topics/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Topic Not Found</h1>
          <p className="text-muted-foreground mb-6">The topic you're trying to edit doesn't exist.</p>
          <button
            onClick={() => router.push('/editor')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
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
                <h1 className="text-xl font-semibold text-foreground">Edit Topic</h1>
                <p className="text-sm text-muted-foreground">ID: {topic.id} • Slug: {slug}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
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
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Save Status */}
      {saveStatus !== 'idle' && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
            saveStatus === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {saveStatus === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span>
              {saveStatus === 'success'
                ? 'Topic saved successfully! Redirecting to topic page...'
                : 'Failed to save topic. Please try again.'
              }
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Basic Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Basic Information</h2>

            <div className="space-y-6">
              {/* Canonical Title */}
              <div>
                <label htmlFor="canonical_title" className="block text-sm font-medium text-foreground mb-2">
                  Canonical Title *
                </label>
                <input
                  id="canonical_title"
                  type="text"
                  value={formData.canonical_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, canonical_title: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Ahavas Yisroel"
                  required
                />
              </div>

              {/* Topic Type */}
              <div>
                <label htmlFor="topic_type" className="block text-sm font-medium text-foreground mb-2">
                  Topic Type *
                </label>
                <select
                  id="topic_type"
                  value={formData.topic_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select a type...</option>
                  <option value="concept">Concept</option>
                  <option value="person">Person</option>
                  <option value="place">Place</option>
                  <option value="event">Event</option>
                  <option value="mitzvah">Mitzvah</option>
                  <option value="sefirah">Sefirah</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Short Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
                  placeholder="Brief description of the topic..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Boundaries */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Boundaries</h2>

            <div className="space-y-6">
              {/* What it IS */}
              <div>
                <label htmlFor="definition_positive" className="block text-sm font-medium text-foreground mb-2">
                  What it IS (Definition)
                </label>
                <textarea
                  id="definition_positive"
                  value={formData.definition_positive}
                  onChange={(e) => setFormData(prev => ({ ...prev, definition_positive: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical font-serif"
                  placeholder="Describe what this concept truly means, with examples and context..."
                />
              </div>

              {/* What it's NOT */}
              <div>
                <label htmlFor="definition_negative" className="block text-sm font-medium text-foreground mb-2">
                  What it's NOT (Boundaries)
                </label>
                <textarea
                  id="definition_negative"
                  value={formData.definition_negative}
                  onChange={(e) => setFormData(prev => ({ ...prev, definition_negative: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical font-serif"
                  placeholder="Clarify common misconceptions and set clear boundaries..."
                />
              </div>
            </div>
          </div>

          {/* Content Processing Pipeline - Always Show */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Content Processing Pipeline</h2>
            <p className="text-sm text-muted-foreground mb-6">
              See how raw document content gets processed into paragraphs, statements, and enriched with appended text (footnotes, sources, etc.)
            </p>

            {/* Processing Types Explanation */}
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <h4 className="font-medium mb-3 text-foreground">Two Types of Content Processing:</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Sefer Documents</span>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 text-xs">
                    Imported books (Tanya, Mishneh Torah, etc.) that get automatically processed into paragraphs and statements with AI.
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900 dark:text-green-100">Entry Documents</span>
                  </div>
                  <p className="text-green-800 dark:text-green-200 text-xs">
                    User-written content where citations and footnotes become the "appended text" attached to statements.
                  </p>
                </div>
              </div>
            </div>

            {topic?.paragraphs && topic.paragraphs.length > 0 ? (
              <div className="space-y-6">
                {topic.paragraphs.map((paragraph: any) => (
                  <div key={paragraph.id} className="border border-border rounded-lg overflow-hidden">
                    {/* Document Header - Shows processing source */}
                    <div className="bg-muted/50 px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{paragraph.document_title || 'Document'}</h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>📄 {paragraph.statements?.length || 0} statements</span>
                            <span>📝 Paragraph {paragraph.order_key}</span>
                            <span>🔤 {paragraph.original_lang?.toUpperCase()}</span>
                            {paragraph.metadata?.folio_notation && (
                              <span>📖 Folio {paragraph.metadata.folio_notation}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Processing Pipeline */}
                    <div className="p-4 space-y-4">
                      {/* Step 1: Raw Paragraph Text */}
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                            1
                          </div>
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Raw Paragraph Content</span>
                          <span className="text-xs text-blue-700 dark:text-blue-300">(from document processing)</span>
                        </div>
                        <div
                          className="text-sm text-blue-800 dark:text-blue-200 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: paragraph.text?.length > 500
                              ? paragraph.text.substring(0, 500) + '...'
                              : paragraph.text || 'No paragraph text available'
                          }}
                        />
                        {paragraph.metadata?.section_title && (
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                            Section: {paragraph.metadata.section_title}
                          </div>
                        )}
                      </div>

                      {/* Step 2: Statement Breakdown */}
                      {paragraph.statements && paragraph.statements.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold">
                              2
                            </div>
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">Statement Breakdown</span>
                            <span className="text-xs text-green-700 dark:text-green-300">
                              ({paragraph.statements.length} statements extracted via AI processing)
                            </span>
                          </div>

                          <div className="space-y-3">
                            {paragraph.statements.map((statement: any, index: number) => (
                              <div key={statement.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-300 dark:border-green-700">
                                {/* Statement Header */}
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                                    Statement {index + 1}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ID: {statement.id} • Order: {statement.order_key}
                                  </span>
                                  {statement.metadata?.auto_generated && (
                                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                                      🤖 AI Generated
                                    </span>
                                  )}
                                </div>

                                {/* Statement Text */}
                                <div className="text-sm text-foreground mb-3 leading-relaxed">
                                  {statement.text}
                                </div>

                                {/* Appended Text (Footnotes, Sources, etc.) */}
                                {statement.appended_text && (
                                  <div className="border-t border-green-300 dark:border-green-700 pt-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                                        📎 Appended Content
                                      </span>
                                      <span className="text-xs text-orange-600 dark:text-orange-400">
                                        Footnotes, sources, and additional references
                                      </span>
                                    </div>
                                    <div
                                      className="text-sm text-orange-800 dark:text-orange-200 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{
                                        __html: statement.appended_text.length > 300
                                          ? statement.appended_text.substring(0, 300) + '...'
                                          : statement.appended_text
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Statement Metadata */}
                                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {statement.metadata?.source && (
                                      <span>Source: {statement.metadata.source}</span>
                                    )}
                                    {statement.metadata?.page_number && (
                                      <span>Page: {statement.metadata.page_number}</span>
                                    )}
                                    {statement.metadata?.confidence && (
                                      <span>Confidence: {(statement.metadata.confidence * 100).toFixed(0)}%</span>
                                    )}
                                    {statement.metadata?.auto_generated && (
                                      <span>Processing: AI Statement Breaking</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Processing Summary */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Processing Summary</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {paragraph.text?.length || 0}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">Characters</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {paragraph.statements?.length || 0}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">Statements</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {paragraph.statements?.filter((s: any) => s.appended_text)?.length || 0}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">With Footnotes</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {paragraph.metadata?.source || 'N/A'}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">Source</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Processed Content Yet</h3>
                <p className="text-sm max-w-md mx-auto mb-4">
                  This topic doesn't have any associated documents that have been processed into paragraphs and statements.
                  The content processing pipeline will appear here once you add and process documents.
                </p>

                <div className="bg-muted/30 rounded-lg p-6 max-w-2xl mx-auto">
                  <h4 className="font-medium mb-3 text-foreground">How the Processing Pipeline Works:</h4>
                  <div className="space-y-4 text-sm text-left">
                    {/* Sefer Document Processing */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">Sefer Documents (Imported)</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold mt-0.5">1</div>
                          <div>
                            <strong className="text-blue-900 dark:text-blue-100">Import Raw Content:</strong>
                            <p className="text-blue-800 dark:text-blue-200">Upload PDFs, text files, or import from Sefaria (Tanya, Mishneh Torah, Talmud, etc.)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold mt-0.5">2</div>
                          <div>
                            <strong className="text-blue-900 dark:text-blue-100">AI Processing:</strong>
                            <p className="text-blue-800 dark:text-blue-200">Content automatically broken into paragraphs and statements</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold mt-0.5">3</div>
                          <div>
                            <strong className="text-blue-900 dark:text-blue-100">Enrichment:</strong>
                            <p className="text-blue-800 dark:text-blue-200">Footnotes, sources, and references attached as appended text</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Entry Document Processing */}
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900 dark:text-green-100">Entry Documents (User-Written)</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold mt-0.5">1</div>
                          <div>
                            <strong className="text-green-900 dark:text-green-100">Write Content:</strong>
                            <p className="text-green-800 dark:text-green-200">Authors write articles, essays, or explanations directly on the platform</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold mt-0.5">2</div>
                          <div>
                            <strong className="text-green-900 dark:text-green-100">Add Citations:</strong>
                            <p className="text-green-800 dark:text-green-200">Inline citations and footnotes become "appended text" attached to statements</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold mt-0.5">3</div>
                          <div>
                            <strong className="text-green-900 dark:text-green-100">Processing:</strong>
                            <p className="text-green-800 dark:text-green-200">Content gets broken into statements with attached citations as appended text</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          <strong>⚠️ The "Scary" Part:</strong> When you add citations like [Tanya 1:1] or footnotes in your writing,
                          these become the "appended text" that gets processed and attached to individual statements for reference tracking.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>To see this pipeline in action:</strong> Go to <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/editor/import</code> and add some content to process.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              * Required fields
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/topics/${slug}`)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.canonical_title.trim() || !formData.topic_type}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border border-primary-foreground border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Topic
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
