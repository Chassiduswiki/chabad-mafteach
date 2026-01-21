'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, X, Plus, ExternalLink } from 'lucide-react';

interface Source {
  id: number;
  title: string;
  author?: string;
  publication_year?: number;
  external_system?: string;
  external_url?: string;
}

interface CitationInsertModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (citation: {
    sourceId: number | null;
    sourceTitle: string;
    reference: string;
  }) => void;
}

export function CitationInsertModal({ open, onClose, onInsert }: CitationInsertModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Source[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [reference, setReference] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualTitle, setManualTitle] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedSource(null);
      setReference('');
      setIsManualEntry(false);
      setManualTitle('');
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || isManualEntry) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/sources/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data || data || []);
        }
      } catch (error) {
        console.error('Source search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isManualEntry]);

  const handleSelectSource = (source: Source) => {
    setSelectedSource(source);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleInsert = () => {
    if (isManualEntry) {
      if (!manualTitle.trim()) return;
      onInsert({
        sourceId: null,
        sourceTitle: manualTitle.trim(),
        reference: reference.trim() || manualTitle.trim(),
      });
    } else {
      if (!selectedSource) return;
      onInsert({
        sourceId: selectedSource.id,
        sourceTitle: selectedSource.title,
        reference: reference.trim() || selectedSource.title,
      });
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (selectedSource || (isManualEntry && manualTitle.trim()))) {
      handleInsert();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-background shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Insert Citation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Toggle between search and manual */}
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setIsManualEntry(false)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                !isManualEntry 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Search Sources
            </button>
            <button
              onClick={() => setIsManualEntry(true)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                isManualEntry 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Manual Entry
            </button>
          </div>

          {isManualEntry ? (
            /* Manual Entry Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Source Title *
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g., Tanya, Likutei Amarim"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            /* Search Mode */
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Search Source
              </label>
              {selectedSource ? (
                <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-md">
                  <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{selectedSource.title}</p>
                    {selectedSource.author && (
                      <p className="text-xs text-muted-foreground truncate">{selectedSource.author}</p>
                    )}
                  </div>
                  {selectedSource.external_system && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex-shrink-0">
                      {selectedSource.external_system}
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedSource(null)}
                    className="p-1 hover:bg-muted rounded flex-shrink-0"
                    aria-label="Clear selection"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title or author..."
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                      {searchResults.map((source) => (
                        <button
                          key={source.id}
                          onClick={() => handleSelectSource(source)}
                          className="w-full px-4 py-2.5 text-left hover:bg-muted flex items-center gap-3 border-b border-border last:border-b-0"
                        >
                          <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{source.title}</p>
                            {source.author && (
                              <p className="text-xs text-muted-foreground truncate">
                                {source.author}
                                {source.publication_year && ` (${source.publication_year})`}
                              </p>
                            )}
                          </div>
                          {source.external_system && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded flex-shrink-0">
                              {source.external_system}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No results message */}
                  {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">No sources found</p>
                      <button
                        onClick={() => {
                          setIsManualEntry(true);
                          setManualTitle(searchQuery);
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        Enter citation manually
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reference field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Reference (page, chapter, verse)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., Chapter 1, p.45, or 1:1"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Preview */}
          {(selectedSource || (isManualEntry && manualTitle)) && (
            <div className="bg-muted/30 border border-border rounded-md p-3">
              <p className="text-xs text-muted-foreground mb-1">Preview:</p>
              <p className="text-sm text-foreground">
                <span className="font-medium">
                  {isManualEntry ? manualTitle : selectedSource?.title}
                </span>
                {reference && <span className="text-muted-foreground"> — {reference}</span>}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={isManualEntry ? !manualTitle.trim() : !selectedSource}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" />
            Insert Citation
          </button>
        </div>
      </div>
    </div>
  );
}
