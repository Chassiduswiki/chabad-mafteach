'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, User, BookOpen, Edit } from 'lucide-react';
import Link from 'next/link';

interface Author {
  id: number;
  canonical_name: string;
  birth_year?: number;
  death_year?: number;
  era?: string;
  bio_summary?: string;
}

export default function AuthorsManagementPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/authors?limit=100');
      if (response.ok) {
        const data = await response.json();
        setAuthors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAuthors = authors.filter(author =>
    author.canonical_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <User className="w-8 h-8" />
              Authors Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage authors and their biographical information
            </p>
          </div>
          <Link
            href="/admin/authors/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Author
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Authors</p>
            <p className="text-2xl font-bold text-foreground">{authors.length}</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Rishonim</p>
            <p className="text-2xl font-bold text-foreground">
              {authors.filter(a => a.era === 'rishonim').length}
            </p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Contemporary</p>
            <p className="text-2xl font-bold text-foreground">
              {authors.filter(a => a.era === 'contemporary').length}
            </p>
          </div>
        </div>

        {/* Authors List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading authors...</p>
          </div>
        ) : filteredAuthors.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
            <User className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-foreground mb-2">No authors found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Get started by adding your first author'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAuthors.map((author) => (
              <div
                key={author.id}
                className="p-5 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{author.canonical_name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {author.birth_year && author.death_year && (
                        <span>{author.birth_year} - {author.death_year}</span>
                      )}
                      {author.era && (
                        <span className="px-2 py-0.5 bg-muted rounded text-xs capitalize">
                          {author.era}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/authors/${author.id}`}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
                {author.bio_summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {author.bio_summary}
                  </p>
                )}
                <Link
                  href={`/admin/authors/${author.id}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <BookOpen className="w-3 h-3" />
                  View books & edit details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
