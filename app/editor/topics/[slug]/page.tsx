'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, AlertCircle, CheckCircle, FileText, BookOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { Topic } from '@/lib/types';

export default function TopicEditorPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
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

  const toggleDocumentExpansion = (docId: string) => {
    setExpandedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
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

          {/* Associated Content */}
          {topic?.paragraphs && topic.paragraphs.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Associated Content</h2>

              <div className="space-y-4">
                {topic.paragraphs.map((paragraph: any) => (
                  <div key={paragraph.id} className="border border-border rounded-lg p-4">
                    {/* Document Header */}
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 -m-4 p-4 rounded-lg"
                      onClick={() => toggleDocumentExpansion(paragraph.document_title || paragraph.id)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{paragraph.document_title || 'Untitled Document'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {paragraph.statements?.length || 0} statements • Paragraph {paragraph.order_key}
                        </p>
                      </div>
                      {expandedDocs.has(paragraph.document_title || paragraph.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Expanded Content */}
                    {expandedDocs.has(paragraph.document_title || paragraph.id) && (
                      <div className="mt-4 ml-11 space-y-3">
                        {/* Paragraph Text */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Paragraph</span>
                          </div>
                          <div
                            className="text-sm text-foreground prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: paragraph.text?.length > 300
                                ? paragraph.text.substring(0, 300) + '...'
                                : paragraph.text
                            }}
                          />
                        </div>

                        {/* Statements */}
                        {paragraph.statements && paragraph.statements.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                              <span className="w-1 h-1 bg-primary rounded-full"></span>
                              Statements ({paragraph.statements.length})
                            </h4>
                            {paragraph.statements.map((statement: any) => (
                              <div key={statement.id} className="bg-muted/20 rounded-lg p-3 ml-4 border-l-2 border-primary/30">
                                <p className="text-sm text-foreground">{statement.text}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    ID: {statement.id} • Order: {statement.order_key}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {topic.paragraphs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No documents or paragraphs associated with this topic yet.</p>
                  <p className="text-xs">Content will appear here when documents are linked to this topic.</p>
                </div>
              )}
            </div>
          )}

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
