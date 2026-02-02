'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  BookOpen,
  X,
  Plus,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Folder,
  FileText,
  Sparkles,
  Loader2
} from 'lucide-react';

interface Source {
  id: number;
  title: string;
  parent_id: number | null;
  external_url?: string;
  external_system?: string;
  page_number?: number;
  page_count?: number;
  parsha?: string;
  child_count?: number;
  is_browsable?: boolean;
  is_leaf?: boolean;
  metadata?: Record<string, any>;
}

interface BreadcrumbItem {
  id: number | null;
  title: string;
}

interface ResolvedSource {
  id: number;
  title: string;
  page_number: number;
  page_count: number;
  page_range: string;
  parsha: string;
  external_url?: string;
  volume: { id: number; title: string };
  requested_page: number;
  page_in_range: boolean;
}

interface HierarchicalCitationModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (citation: {
    sourceId: number | null;
    sourceTitle: string;
    reference: string;
    quote?: string;
    note?: string;
    url?: string;
  }) => void;
}

export function HierarchicalCitationModal({ open, onClose, onInsert }: HierarchicalCitationModalProps) {
  // Mode state
  const [mode, setMode] = useState<'browse' | 'search' | 'resolve' | 'manual'>('browse');

  // Browse state
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, title: 'All Sources' }]);
  const [isLoadingBrowse, setIsLoadingBrowse] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Source[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Resolve state (smart lookup)
  const [resolveVolume, setResolveVolume] = useState('');
  const [resolvePage, setResolvePage] = useState('');
  const [resolveRootId, setResolveRootId] = useState<number | null>(null);
  const [resolvedSource, setResolvedSource] = useState<ResolvedSource | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Selection state
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [reference, setReference] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [quote, setQuote] = useState('');
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setMode('browse');
      setCurrentParentId(null);
      setSources([]);
      setBreadcrumbs([{ id: null, title: 'All Sources' }]);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedSource(null);
      setReference('');
      setManualTitle('');
      setQuote('');
      setNote('');
      setUrl('');
      setResolveVolume('');
      setResolvePage('');
      setResolvedSource(null);
      setResolveError(null);
    }
  }, [open]);

  // Fetch hierarchy on mount and when parent changes
  useEffect(() => {
    if (!open || mode !== 'browse') return;

    const fetchHierarchy = async () => {
      setIsLoadingBrowse(true);
      try {
        const params = currentParentId ? `?parent_id=${currentParentId}` : '';
        const response = await fetch(`/api/sources/hierarchy${params}`);
        if (response.ok) {
          const data = await response.json();
          setSources(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch hierarchy:', error);
      } finally {
        setIsLoadingBrowse(false);
      }
    };

    fetchHierarchy();
  }, [open, mode, currentParentId]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || mode !== 'search') {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/sources/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data || data || []);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  // Navigate into a source (drill down)
  const navigateInto = (source: Source) => {
    if (source.is_leaf || !source.is_browsable) {
      // It's a leaf - select it
      handleSelectSource(source);
    } else {
      // It has children - drill down
      setCurrentParentId(source.id);
      setBreadcrumbs(prev => [...prev, { id: source.id, title: source.title }]);
    }
  };

  // Navigate back in breadcrumbs
  const navigateBack = (index: number) => {
    const target = breadcrumbs[index];
    setCurrentParentId(target.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setSelectedSource(null);
  };

  // Select a source for citation
  const handleSelectSource = (source: Source) => {
    setSelectedSource(source);
    setUrl(source.external_url || '');

    // Auto-generate reference if we have page info
    if (source.page_number) {
      const pageRef = source.page_count && source.page_count > 1
        ? `pp. ${source.page_number}-${source.page_number + source.page_count - 1}`
        : `p. ${source.page_number}`;
      setReference(pageRef);
    }
  };

  // Resolve volume + page
  const handleResolve = async () => {
    if (!resolveRootId || !resolveVolume || !resolvePage) return;

    setIsResolving(true);
    setResolveError(null);
    setResolvedSource(null);

    try {
      const response = await fetch(
        `/api/sources/hierarchy?resolve=${resolveVolume},${resolvePage}&root_id=${resolveRootId}`
      );
      const data = await response.json();

      if (data.resolved) {
        setResolvedSource(data.source);
      } else {
        setResolveError(data.error || 'Could not resolve reference');
      }
    } catch (error) {
      setResolveError('Failed to resolve reference');
    } finally {
      setIsResolving(false);
    }
  };

  // Use resolved source
  const useResolvedSource = () => {
    if (!resolvedSource) return;

    setSelectedSource({
      id: resolvedSource.id,
      title: resolvedSource.title,
      parent_id: resolvedSource.volume.id,
      external_url: resolvedSource.external_url,
      page_number: resolvedSource.page_number,
      page_count: resolvedSource.page_count,
      parsha: resolvedSource.parsha,
      is_leaf: true,
    });
    setReference(`p. ${resolvedSource.requested_page}`);
    setUrl(resolvedSource.external_url || '');
    setMode('browse');
  };

  // Insert the citation
  const handleInsert = () => {
    if (mode === 'manual') {
      if (!manualTitle.trim()) return;
      onInsert({
        sourceId: null,
        sourceTitle: manualTitle.trim(),
        reference: reference.trim() || manualTitle.trim(),
        quote: quote.trim() || undefined,
        note: note.trim() || undefined,
        url: url.trim() || undefined,
      });
    } else {
      if (!selectedSource) return;
      onInsert({
        sourceId: selectedSource.id,
        sourceTitle: selectedSource.title,
        reference: reference.trim() || selectedSource.title,
        quote: quote.trim() || undefined,
        note: note.trim() || undefined,
        url: url.trim() || selectedSource.external_url || undefined,
      });
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-background shadow-2xl border border-border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
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

        {/* Mode Tabs */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          {[
            { key: 'browse', label: 'Browse', icon: Folder },
            { key: 'search', label: 'Search', icon: Search },
            { key: 'resolve', label: 'Smart Lookup', icon: Sparkles },
            { key: 'manual', label: 'Manual', icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                mode === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Browse Mode */}
          {mode === 'browse' && (
            <>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1 text-sm flex-wrap">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.id ?? 'root'}>
                    {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    <button
                      onClick={() => navigateBack(index)}
                      className={`px-2 py-0.5 rounded hover:bg-muted transition-colors ${
                        index === breadcrumbs.length - 1
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {crumb.title}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Source List */}
              {isLoadingBrowse ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sources.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No sources found
                </div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-auto">
                  {sources.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => navigateInto(source)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        selectedSource?.id === source.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted border border-transparent'
                      }`}
                    >
                      {source.is_browsable ? (
                        <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{source.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {source.parsha && <span>{source.parsha}</span>}
                          {source.page_number && (
                            <span>
                              p. {source.page_number}
                              {source.page_count && source.page_count > 1 && `-${source.page_number + source.page_count - 1}`}
                            </span>
                          )}
                          {source.child_count && source.child_count > 0 && (
                            <span className="bg-muted px-1.5 py-0.5 rounded">
                              {source.child_count} items
                            </span>
                          )}
                        </div>
                      </div>
                      {source.external_url && (
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      {source.is_browsable && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Search Mode */}
          {mode === 'search' && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sources by title, author, parsha..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-64 overflow-auto">
                  {searchResults.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => handleSelectSource(source)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        selectedSource?.id === source.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted border border-transparent'
                      }`}
                    >
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{source.title}</p>
                        {source.external_system && (
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {source.external_system}
                          </span>
                        )}
                      </div>
                      {source.external_url && (
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Smart Lookup Mode */}
          {mode === 'resolve' && (
            <>
              <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter a volume and page number to find the exact source.
                  <br />
                  Example: Volume 4, Page 345 → finds the sicha at that location.
                </p>

                {/* Root source selector */}
                <div>
                  <label className="block text-sm font-medium mb-1">Source Collection</label>
                  <select
                    value={resolveRootId || ''}
                    onChange={(e) => setResolveRootId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="">Select a collection...</option>
                    <option value="256">Likkutei Sichos</option>
                    {/* Add more as you import them */}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Volume #</label>
                    <input
                      type="number"
                      value={resolveVolume}
                      onChange={(e) => setResolveVolume(e.target.value)}
                      placeholder="e.g., 4"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Page #</label>
                    <input
                      type="number"
                      value={resolvePage}
                      onChange={(e) => setResolvePage(e.target.value)}
                      placeholder="e.g., 345"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    />
                  </div>
                </div>

                <button
                  onClick={handleResolve}
                  disabled={!resolveRootId || !resolveVolume || !resolvePage || isResolving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResolving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Find Source
                </button>
              </div>

              {resolveError && (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {resolveError}
                </div>
              )}

              {resolvedSource && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{resolvedSource.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {resolvedSource.volume.title} • {resolvedSource.parsha} • Pages {resolvedSource.page_range}
                      </p>
                      {resolvedSource.external_url && (
                        <a
                          href={resolvedSource.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          View on Chabad.org <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={useResolvedSource}
                      className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90"
                    >
                      Use This
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && (
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
          )}

          {/* Reference & Additional Fields (shown when source selected or manual) */}
          {(selectedSource || mode === 'manual') && (
            <>
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

              <details className="border border-border rounded-md">
                <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  Additional Info (optional)
                </summary>
                <div className="px-3 pb-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Quote</label>
                    <textarea
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      placeholder="Paste the exact quote..."
                      rows={2}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Note</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Your note about this citation..."
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">URL</label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                    />
                  </div>
                </div>
              </details>

              {/* Preview */}
              <div className="bg-muted/30 border border-border rounded-md p-3">
                <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">
                    {mode === 'manual' ? manualTitle : selectedSource?.title}
                  </span>
                  {reference && <span className="text-muted-foreground"> — {reference}</span>}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={mode === 'manual' ? !manualTitle.trim() : !selectedSource}
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
