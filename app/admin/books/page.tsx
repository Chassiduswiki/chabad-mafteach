'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, ExternalLink, Edit, Trash2, BookOpen, User } from 'lucide-react';
import Link from 'next/link';

interface Author {
  id: number;
  canonical_name: string;
  birth_year?: number;
  death_year?: number;
}

interface Book {
  id: number;
  title: string;
  author_id?: Author;
  publication_year?: number;
  publisher?: string;
  external_system?: string;
  external_url?: string;
  original_lang?: string;
}

export default function BooksManagementPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sources?fields=id,title,publication_year,publisher,external_system,external_url,original_lang,author_id.*&limit=100');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author_id?.canonical_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              Books Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your library of sources and seforim
            </p>
          </div>
          <Link
            href="/admin/books/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Book
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search books by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Books</p>
            <p className="text-2xl font-bold text-foreground">{books.length}</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">With Sefaria Links</p>
            <p className="text-2xl font-bold text-foreground">
              {books.filter(b => b.external_system === 'sefaria').length}
            </p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Hebrew Books</p>
            <p className="text-2xl font-bold text-foreground">
              {books.filter(b => b.original_lang === 'he').length}
            </p>
          </div>
        </div>

        {/* Books List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading books...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-foreground mb-2">No books found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Get started by adding your first book'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">{book.title}</h3>
                      {book.external_url && (
                        <a
                          href={book.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {book.external_system}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {book.author_id && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {book.author_id.canonical_name}
                        </span>
                      )}
                      {book.publication_year && (
                        <span>{book.publication_year}</span>
                      )}
                      {book.publisher && (
                        <span>{book.publisher}</span>
                      )}
                      {book.original_lang && (
                        <span className="px-2 py-0.5 bg-muted rounded text-xs">
                          {book.original_lang === 'he' ? 'Hebrew' : 'English'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/books/${book.id}`}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
