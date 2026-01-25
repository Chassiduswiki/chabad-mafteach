'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAIFieldAutoComplete } from '@/hooks/useAIFieldAutoComplete';

interface NewTopicForm {
  canonical_title: string;
  canonical_title_en: string;
  canonical_title_transliteration: string;
  slug: string;
  topic_type: string;
  description: string;
}

export default function NewTopicPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewTopicForm>({
    canonical_title: '',
    canonical_title_en: '',
    canonical_title_transliteration: '',
    slug: '',
    topic_type: 'concept',
    description: '',
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.canonical_title_en) {
      const slug = formData.canonical_title_en
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    } else if (formData.canonical_title_transliteration) {
      const slug = formData.canonical_title_transliteration
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.canonical_title_en, formData.canonical_title_transliteration]);

  const updateField = (field: keyof NewTopicForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // AI Field Auto-Complete - invisible AI assistance
  const { 
    suggestions: aiSuggestions, 
    isLoading: isAICompleting,
    applySuggestion,
    dismissSuggestion,
  } = useAIFieldAutoComplete(
    {
      canonical_title: formData.canonical_title,
      canonical_title_en: formData.canonical_title_en,
      canonical_title_transliteration: formData.canonical_title_transliteration,
      topic_type: formData.topic_type,
      description: formData.description,
    },
    (field, value) => updateField(field as keyof NewTopicForm, value),
    {
      enabled: true,
      autoApply: true,
      confidenceThreshold: 0.75,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.canonical_title.trim()) {
      setError('Hebrew title is required');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!formData.topic_type) {
      setError('Topic type is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/topics/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create topic');
      }

      const data = await response.json();
      const newTopic = data.data || data;
      
      // Redirect to edit the new topic
      router.push(`/editor/topics/${newTopic.slug || formData.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/editor/topics')}
                className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Create New Topic</h1>
                <p className="text-sm text-muted-foreground">Add a new topic to the system</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Basic Info Card */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
              {isAICompleting && (
                <span className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <span className="h-2 w-2 bg-primary rounded-full animate-ping" />
                  AI completing fields...
                </span>
              )}
            </div>

            {/* AI Suggestions Banner */}
            {aiSuggestions.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-primary mb-2">
                  <span className="font-medium">AI Suggestions Available</span>
                </div>
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion) => (
                    <div key={suggestion.field} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        <span className="font-medium">{suggestion.field.replace(/_/g, ' ')}:</span>{' '}
                        <span className="text-foreground">{suggestion.value}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({Math.round(suggestion.confidence * 100)}% confident)
                        </span>
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => applySuggestion(suggestion.field as any)}
                          className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => dismissSuggestion(suggestion.field as any)}
                          className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Title (Hebrew) *
                </label>
                <input
                  type="text"
                  value={formData.canonical_title}
                  onChange={(e) => updateField('canonical_title', e.target.value)}
                  placeholder="e.g., השכלה"
                  dir="rtl"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Title (English)
                </label>
                <input
                  type="text"
                  value={formData.canonical_title_en}
                  onChange={(e) => updateField('canonical_title_en', e.target.value)}
                  placeholder="e.g., Intellectual Comprehension"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Transliteration
                </label>
                <input
                  type="text"
                  value={formData.canonical_title_transliteration}
                  onChange={(e) => updateField('canonical_title_transliteration', e.target.value)}
                  placeholder="e.g., Haskalah"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="e.g., haskalah"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from English title or transliteration
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Topic Type *
                </label>
                <select
                  value={formData.topic_type}
                  onChange={(e) => updateField('topic_type', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="concept">Concept</option>
                  <option value="person">Person</option>
                  <option value="place">Place</option>
                  <option value="event">Event</option>
                  <option value="mitzvah">Mitzvah</option>
                  <option value="sefirah">Sefirah</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Short Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief overview of this topic..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/editor/topics')}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Topic
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
