'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Loader2, Trash2, BookOpen, Plus, ExternalLink, Edit, X } from 'lucide-react';
import Link from 'next/link';

interface Book {
  id: number;
  title: string;
  publication_year?: number;
  external_system?: string;
  external_url?: string;
}

interface Author {
  id: number;
  canonical_name: string;
  birth_year?: number;
  death_year?: number;
  era?: string;
  bio_summary?: string;
}

export default function AuthorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [author, setAuthor] = useState<Author | null>(null);
  const [books, setBooks] = useState<Book[]>([]);

  // Form fields
  const [canonicalName, setCanonicalName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [deathYear, setDeathYear] = useState('');
  const [era, setEra] = useState('');
  const [bioSummary, setBioSummary] = useState('');

  // New book form fields
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookYear, setNewBookYear] = useState('');
  const [newBookPublisher, setNewBookPublisher] = useState('');
  const [newBookExternalSystem, setNewBookExternalSystem] = useState('');
  const [newBookExternalUrl, setNewBookExternalUrl] = useState('');
  const [isAddingBook, setIsAddingBook] = useState(false);

  useEffect(() => {
    fetchAuthor();
  }, [id]);

  const fetchAuthor = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/authors/${id}`);
      if (!response.ok) {
        throw new Error('Author not found');
      }
      const data = await response.json();
      
      setAuthor(data.author);
      setBooks(data.books || []);

      // Populate form fields
      setCanonicalName(data.author.canonical_name || '');
      setBirthYear(data.author.birth_year?.toString() || '');
      setDeathYear(data.author.death_year?.toString() || '');
      setEra(data.author.era || '');
      setBioSummary(data.author.bio_summary || '');
    } catch (error) {
      console.error('Failed to fetch author:', error);
      setError('Failed to load author details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canonicalName.trim()) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        canonical_name: canonicalName.trim(),
        birth_year: birthYear ? parseInt(birthYear) : null,
        death_year: deathYear ? parseInt(deathYear) : null,
        era: era || null,
        bio_summary: bioSummary.trim() || null,
      };

      const response = await fetch(`/api/authors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update author');
      }

      setSuccess('Author updated successfully');
      await fetchAuthor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update author');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (books.length > 0) {
      setError('Cannot delete author with linked books. Remove or reassign books first.');
      setShowDeleteConfirm(false);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/authors/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete author');
      }

      router.push('/admin/authors');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete author');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) {
      setError('Book title is required');
      return;
    }

    setIsAddingBook(true);
    setError(null);

    try {
      const payload = {
        title: newBookTitle.trim(),
        author_id: parseInt(id),
        publication_year: newBookYear || undefined,
        publisher: newBookPublisher || undefined,
        external_system: newBookExternalSystem || undefined,
        external_url: newBookExternalUrl || undefined,
      };

      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create book');
      }

      // Reset form and close modal
      setNewBookTitle('');
      setNewBookYear('');
      setNewBookPublisher('');
      setNewBookExternalSystem('');
      setNewBookExternalUrl('');
      setShowAddBookModal(false);
      
      // Refresh author data to show new book
      await fetchAuthor();
      setSuccess('Book added successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create book');
    } finally {
      setIsAddingBook(false);
    }
  };

  const handleUnlinkBook = async (bookId: number) => {
    if (!confirm('Remove this book from this author? The book will remain in the system.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sources/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_id: null }),
      });

      if (!response.ok) {
        throw new Error('Failed to unlink book');
      }

      await fetchAuthor();
      setSuccess('Book unlinked from author');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink book');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading author...</p>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto text-center">
          <User className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Author Not Found</h1>
          <p className="text-muted-foreground mb-6">The author you're looking for doesn't exist.</p>
          <Link href="/admin/authors" className="text-primary hover:underline">
            ← Back to Authors
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
            href="/admin/authors"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Authors
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <User className="w-8 h-8" />
                Edit Author
              </h1>
              <p className="text-muted-foreground mt-2">
                Update author details and manage their books
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Delete author"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Main Form - 2 columns */}
          <div className="col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Canonical Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={canonicalName}
                  onChange={(e) => setCanonicalName(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Years */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Birth Year
                  </label>
                  <input
                    type="number"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Death Year
                  </label>
                  <input
                    type="number"
                    value={deathYear}
                    onChange={(e) => setDeathYear(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Era */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Era
                </label>
                <select
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select era...</option>
                  <option value="rishonim">Rishonim</option>
                  <option value="acharonim">Acharonim</option>
                  <option value="contemporary">Contemporary</option>
                </select>
              </div>

              {/* Bio Summary */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Biography Summary
                </label>
                <textarea
                  value={bioSummary}
                  onChange={(e) => setBioSummary(e.target.value)}
                  rows={4}
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

          {/* Sidebar - Books List */}
          <div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Books ({books.length})
                </h3>
                <button
                  onClick={() => setShowAddBookModal(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
              
              {books.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No books by this author yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {books.map((book) => (
                    <li key={book.id} className="group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/admin/books/${book.id}`}
                            className="text-sm text-foreground hover:text-primary font-medium block truncate"
                          >
                            {book.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            {book.publication_year && (
                              <span className="text-xs text-muted-foreground">
                                {book.publication_year}
                              </span>
                            )}
                            {book.external_url && (
                              <a
                                href={book.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {book.external_system}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/books/${book.id}`}
                            className="p-1 text-muted-foreground hover:text-foreground rounded"
                            title="Edit book"
                          >
                            <Edit className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => handleUnlinkBook(book.id)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded"
                            title="Unlink from author"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Author?</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete "{author.canonical_name}"?
            </p>
            {books.length > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                ⚠️ This author has {books.length} book(s). You must unlink or delete them first.
              </p>
            )}
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
                disabled={isDeleting || books.length > 0}
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

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Add New Book</h3>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="Book title..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Publication Year
                  </label>
                  <input
                    type="number"
                    value={newBookYear}
                    onChange={(e) => setNewBookYear(e.target.value)}
                    placeholder="Year..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Publisher
                  </label>
                  <input
                    type="text"
                    value={newBookPublisher}
                    onChange={(e) => setNewBookPublisher(e.target.value)}
                    placeholder="Publisher..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    External System
                  </label>
                  <select
                    value={newBookExternalSystem}
                    onChange={(e) => setNewBookExternalSystem(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">None</option>
                    <option value="sefaria">Sefaria</option>
                    <option value="hebrewbooks">HebrewBooks</option>
                    <option value="wikisource">Wikisource</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    External URL
                  </label>
                  <input
                    type="url"
                    value={newBookExternalUrl}
                    onChange={(e) => setNewBookExternalUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                This book will be automatically linked to {author.canonical_name}
              </p>
              
              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingBook}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isAddingBook ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Book
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
