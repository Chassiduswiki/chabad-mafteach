'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Plus, User, Loader2, Trash2, ExternalLink, FileText, Quote } from 'lucide-react';
import Link from 'next/link';

interface Author {
  id: number;
  canonical_name: string;
  birth_year?: number;
  death_year?: number;
  era?: string;
}

interface Topic {
  id: number;
  canonical_title: string;
  slug: string;
}

interface Citation {
  id: number;
  section_reference?: string;
  page_number?: string;
  statement_id?: {
    id: number;
    text: string;
  };
}

interface Book {
  id: number;
  title: string;
  author_id?: Author;
  publication_year?: number;
  publisher?: string;
  isbn?: string;
  external_system?: string;
  external_url?: string;
  original_lang?: string;
  citation_text?: string;
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [book, setBook] = useState<Book | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [showNewAuthorForm, setShowNewAuthorForm] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | ''>('');
  const [publicationYear, setPublicationYear] = useState('');
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');
  const [externalSystem, setExternalSystem] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [originalLang, setOriginalLang] = useState<'he' | 'en'>('he');
  const [citationText, setCitationText] = useState('');

  // New author fields
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorBirthYear, setNewAuthorBirthYear] = useState('');
  const [newAuthorDeathYear, setNewAuthorDeathYear] = useState('');
  const [newAuthorEra, setNewAuthorEra] = useState('');

  useEffect(() => {
    fetchBook();
    fetchAuthors();
  }, [id]);

  const fetchBook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sources?id=${id}`);
      if (!response.ok) {
        throw new Error('Book not found');
      }
      const data = await response.json();
      
      setBook(data.book);
      setTopics(data.topics || []);
      setCitations(data.citations || []);

      // Populate form fields
      setTitle(data.book.title || '');
      setSelectedAuthorId(data.book.author_id?.id || '');
      setPublicationYear(data.book.publication_year?.toString() || '');
      setPublisher(data.book.publisher || '');
      setIsbn(data.book.isbn || '');
      setExternalSystem(data.book.external_system || '');
      setExternalUrl(data.book.external_url || '');
      setOriginalLang(data.book.original_lang || 'he');
      setCitationText(data.book.citation_text || '');
    } catch (error) {
      console.error('Failed to fetch book:', error);
      setError('Failed to load book details');
    } finally {
      setIsLoading(false);
    }
  };

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
    setSuccess(null);

    try {
      let authorId = selectedAuthorId || null;

      // Create new author if needed
      if (showNewAuthorForm && newAuthorName.trim()) {
        const authorResponse = await fetch('/api/authors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canonical_name: newAuthorName.trim(),
            birth_year: newAuthorBirthYear ? parseInt(newAuthorBirthYear) : null,
            death_year: newAuthorDeathYear ? parseInt(newAuthorDeathYear) : null,
            era: newAuthorEra || null,
          }),
        });

        if (authorResponse.ok) {
          const authorData = await authorResponse.json();
          authorId = authorData.author.id;
          await fetchAuthors(); // Refresh authors list
        }
      }

      const payload = {
        title: title.trim(),
        author_id: authorId,
        publication_year: publicationYear,
        publisher: publisher,
        isbn: isbn,
        external_system: externalSystem,
        external_url: externalUrl,
        original_lang: originalLang,
        citation_text: citationText,
      };

      const response = await fetch(`/api/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update book');
      }

      setSuccess('Book updated successfully');
      setShowNewAuthorForm(false);
      setNewAuthorName('');
      setNewAuthorBirthYear('');
      setNewAuthorDeathYear('');
      setNewAuthorEra('');
      
      // Refresh book data
      await fetchBook();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update book');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sources/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete book');
      }

      router.push('/admin/books');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete book');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Book Not Found</h1>
          <p className="text-muted-foreground mb-6">The book you're looking for doesn't exist.</p>
          <Link href="/admin/books" className="text-primary hover:underline">
            ← Back to Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/books"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Books
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BookOpen className="w-8 h-8" />
                Edit Book
              </h1>
              <p className="text-muted-foreground mt-2">
                Update book metadata and manage relationships
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Delete book"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Form - 2 columns */}
          <div className="col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 dark:text-green-400">
                  {success}
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
                        <input
                          type="text"
                          value={newAuthorName}
                          onChange={(e) => setNewAuthorName(e.target.value)}
                          placeholder="Author name..."
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={newAuthorBirthYear}
                          onChange={(e) => setNewAuthorBirthYear(e.target.value)}
                          placeholder="Birth year"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={newAuthorDeathYear}
                          onChange={(e) => setNewAuthorDeathYear(e.target.value)}
                          placeholder="Death year"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                      <div className="col-span-2">
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
                      onClick={() => setShowNewAuthorForm(false)}
                      className="text-sm text-primary hover:underline"
                    >
                      ← Select existing author
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={selectedAuthorId}
                      onChange={(e) => setSelectedAuthorId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">No author</option>
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
                  rows={3}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
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
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* External Link */}
            {externalUrl && (
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  External Link
                </h3>
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  View on {externalSystem || 'external site'}
                </a>
              </div>
            )}

            {/* Topics Using This Book */}
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Used in Topics ({topics.length})
              </h3>
              {topics.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No topics reference this book yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {topics.map((topic) => (
                    <li key={topic.id}>
                      <Link
                        href={`/topics/${topic.slug}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {topic.canonical_title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Inline Citations */}
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Quote className="w-4 h-4" />
                Inline Citations ({citations.length})
              </h3>
              {citations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No statements cite this book yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {citations.slice(0, 10).map((citation) => (
                    <li key={citation.id} className="text-sm">
                      <p className="text-muted-foreground line-clamp-2">
                        "{citation.statement_id?.text}"
                      </p>
                      {(citation.page_number || citation.section_reference) && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {citation.page_number && `p. ${citation.page_number}`}
                          {citation.section_reference && ` - ${citation.section_reference}`}
                        </p>
                      )}
                    </li>
                  ))}
                  {citations.length > 10 && (
                    <li className="text-xs text-muted-foreground">
                      +{citations.length - 10} more citations
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Author Info */}
            {book.author_id && (
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Author
                </h3>
                <Link
                  href={`/admin/authors/${book.author_id.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {book.author_id.canonical_name}
                </Link>
                {book.author_id.birth_year && book.author_id.death_year && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {book.author_id.birth_year} - {book.author_id.death_year}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Book?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete "{book.title}"? This action cannot be undone and will remove all source links.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
