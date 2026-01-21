'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Plus, User, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Author {
  id: number;
  canonical_name: string;
  birth_year?: number;
  death_year?: number;
}

export default function NewBookPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [showNewAuthorForm, setShowNewAuthorForm] = useState(false);

  // Book form fields
  const [title, setTitle] = useState('');
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | ''>('');
  const [publicationYear, setPublicationYear] = useState('');
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');
  const [externalSystem, setExternalSystem] = useState<string>('');
  const [externalUrl, setExternalUrl] = useState('');
  const [originalLang, setOriginalLang] = useState<'he' | 'en'>('he');
  const [citationText, setCitationText] = useState('');

  // New author fields (when creating inline)
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorBirthYear, setNewAuthorBirthYear] = useState('');
  const [newAuthorDeathYear, setNewAuthorDeathYear] = useState('');
  const [newAuthorEra, setNewAuthorEra] = useState<string>('');

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const response = await fetch('/api/authors?limit=500');
      if (response.ok) {
        const data = await response.json();
        setAuthors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        publication_year: publicationYear || undefined,
        publisher: publisher || undefined,
        isbn: isbn || undefined,
        external_system: externalSystem || undefined,
        external_url: externalUrl || undefined,
        original_lang: originalLang,
        citation_text: citationText || undefined,
      };

      // Either use existing author or create new one
      if (showNewAuthorForm && newAuthorName.trim()) {
        payload.author_name = newAuthorName.trim();
        payload.author_birth_year = newAuthorBirthYear || undefined;
        payload.author_death_year = newAuthorDeathYear || undefined;
        payload.author_era = newAuthorEra || undefined;
      } else if (selectedAuthorId) {
        payload.author_id = selectedAuthorId;
      }

      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create book');
      }

      const data = await response.json();
      router.push(`/admin/books/${data.data?.id || ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/books"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Books
          </Link>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            Add New Book
          </h1>
          <p className="text-muted-foreground mt-2">
            Add a new sefer or source to your library
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title..."
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Author Selection */}
          <div className="p-4 bg-muted/30 border border-border rounded-lg">
            <label className="block text-sm font-medium text-foreground mb-3">
              Author
            </label>
            
            {showNewAuthorForm ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">Author Name</label>
                    <input
                      type="text"
                      value={newAuthorName}
                      onChange={(e) => setNewAuthorName(e.target.value)}
                      placeholder="e.g., Rashi, Rambam..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Birth Year</label>
                    <input
                      type="number"
                      value={newAuthorBirthYear}
                      onChange={(e) => setNewAuthorBirthYear(e.target.value)}
                      placeholder="e.g., 1040"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Death Year</label>
                    <input
                      type="number"
                      value={newAuthorDeathYear}
                      onChange={(e) => setNewAuthorDeathYear(e.target.value)}
                      placeholder="e.g., 1105"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">Era</label>
                    <select
                      value={newAuthorEra}
                      onChange={(e) => setNewAuthorEra(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="">Select era...</option>
                      <option value="rishonim">Rishonim</option>
                      <option value="acharonim">Acharonim</option>
                      <option value="contemporary">Contemporary</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAuthorForm(false);
                    setNewAuthorName('');
                    setNewAuthorBirthYear('');
                    setNewAuthorDeathYear('');
                    setNewAuthorEra('');
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  ← Select existing author instead
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedAuthorId}
                  onChange={(e) => setSelectedAuthorId(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select author...</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.canonical_name}
                      {author.birth_year && author.death_year && ` (${author.birth_year}-${author.death_year})`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewAuthorForm(true)}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  Create new author
                </button>
              </div>
            )}
          </div>

          {/* Publication Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Publication Year
              </label>
              <input
                type="number"
                value={publicationYear}
                onChange={(e) => setPublicationYear(e.target.value)}
                placeholder="e.g., 1880"
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Publisher
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Enter publisher..."
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* ISBN and Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ISBN
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="Enter ISBN..."
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Original Language
              </label>
              <select
                value={originalLang}
                onChange={(e) => setOriginalLang(e.target.value as 'he' | 'en')}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="he">Hebrew</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* External System */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                External System
              </label>
              <select
                value={externalSystem}
                onChange={(e) => setExternalSystem(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">None</option>
                <option value="sefaria">Sefaria</option>
                <option value="hebrewbooks">HebrewBooks</option>
                <option value="wikisource">Wikisource</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                External URL
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Citation Text */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Citation Text
            </label>
            <textarea
              value={citationText}
              onChange={(e) => setCitationText(e.target.value)}
              placeholder="Standard citation format for this book..."
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How this source should appear in citations and bibliographies
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  Create Book
                </>
              )}
            </button>
            <Link
              href="/admin/books"
              className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
