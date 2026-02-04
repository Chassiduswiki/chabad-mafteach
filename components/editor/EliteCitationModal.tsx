'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  BookOpen,
  X,
  Plus,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Sparkles,
  Loader2,
  Zap,
  ArrowRight,
  Check,
  Command,
  CornerDownLeft,
  Type,
} from 'lucide-react';
import { parseCitation, looksLikeCitation, type ParsedCitation } from '@/lib/citations/citationParser';
import { formatCitation, formatCitationString, type FormattedCitation } from '@/lib/citations/citationFormatter';

// ============================================================================
// TYPES
// ============================================================================

interface Source {
  id: number;
  title: string;
  formatted_title?: string;
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
  formatted_title?: string;
  page_number: number;
  page_count: number;
  page_range: string;
  parsha: string;
  external_url?: string;
  volume: { id: number; title: string };
  requested_page: number;
  page_in_range: boolean;
}

interface EliteCitationModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (citation: {
    sourceId: number | null;
    sourceTitle: string;
    reference: string;
    citationType?: string;
    quote?: string;
    note?: string;
    url?: string;
  }) => void;
  /** Optional: context text for AI suggestions */
  contextText?: string;
  /** Optional: pre-populate from an existing citation (edit mode) */
  initialCitation?: {
    sourceId: number | null;
    sourceTitle: string;
    reference: string;
    quote?: string;
    note?: string;
    url?: string;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EliteCitationModal({
  open,
  onClose,
  onInsert,
  contextText,
  initialCitation,
}: EliteCitationModalProps) {
  const isEditMode = Boolean(initialCitation);
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Smart input state (unified search/parse)
  const [smartInput, setSmartInput] = useState('');
  const [parsedCitation, setParsedCitation] = useState<ParsedCitation | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedSource, setResolvedSource] = useState<ResolvedSource | null>(null);

  // Browse state
  const [showBrowser, setShowBrowser] = useState(false);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, title: 'Sources' },
  ]);
  const [isLoadingBrowse, setIsLoadingBrowse] = useState(false);

  // Search results
  const [searchResults, setSearchResults] = useState<Source[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selection state
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [formattedCitation, setFormattedCitation] = useState<FormattedCitation | null>(null);
  const [reference, setReference] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quote, setQuote] = useState('');
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<Source[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Free-text citation / Add source
  const [freeTextMode, setFreeTextMode] = useState(false);
  const [freeTextCitation, setFreeTextCitation] = useState('');
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceAuthor, setNewSourceAuthor] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [isCreatingSource, setIsCreatingSource] = useState(false);
  const [createSourceError, setCreateSourceError] = useState<string | null>(null);
  const [resolutionFailed, setResolutionFailed] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSmartInput('');
      setParsedCitation(null);
      setResolvedSource(null);
      setShowBrowser(false);
      setCurrentParentId(null);
      setSources([]);
      setBreadcrumbs([{ id: null, title: 'Sources' }]);
      setSearchResults([]);
      setSelectedSource(null);
      setFormattedCitation(null);
      setReference('');
      setShowAdvanced(false);
      setQuote('');
      setNote('');
      setUrl('');
      setAiSuggestions([]);
      setFocusedIndex(-1);
      setFreeTextMode(false);
      setFreeTextCitation('');
      setShowAddSource(false);
      setNewSourceTitle('');
      setNewSourceAuthor('');
      setNewSourceUrl('');
      setIsCreatingSource(false);
      setCreateSourceError(null);
      setResolutionFailed(false);
    }
  }, [open]);

  // Pre-populate from initialCitation (edit mode)
  useEffect(() => {
    if (!open || !initialCitation) return;

    const source: Source = {
      id: initialCitation.sourceId ?? 0,
      title: initialCitation.sourceTitle,
      parent_id: null,
      external_url: initialCitation.url,
      is_leaf: true,
    };

    if (initialCitation.sourceId) {
      setSelectedSource(source);
      setFormattedCitation({ full: initialCitation.sourceTitle, sourceName: initialCitation.sourceTitle });
    } else {
      setFreeTextMode(true);
      setFreeTextCitation(initialCitation.sourceTitle);
    }

    setReference(initialCitation.reference || '');
    setQuote(initialCitation.quote || '');
    setNote(initialCitation.note || '');
    setUrl(initialCitation.url || '');
    if (initialCitation.quote || initialCitation.note || initialCitation.url) {
      setShowAdvanced(true);
    }
  }, [open, initialCitation]);

  // Reset focused index when lists change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [showBrowser, sources, searchResults, selectedSource, resolvedSource, freeTextMode, showAddSource]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Parse input as user types
  useEffect(() => {
    if (!smartInput.trim()) {
      setParsedCitation(null);
      setResolvedSource(null);
      return;
    }

    // Check if it looks like a citation
    if (looksLikeCitation(smartInput)) {
      const parsed = parseCitation(smartInput);
      setParsedCitation(parsed);

      // Auto-resolve if we can
      if (parsed.resolvable && parsed.volume && parsed.page && parsed.rootSourceId) {
        resolveReference(parsed);
      } else {
        setResolvedSource(null);
      }
    } else {
      setParsedCitation(null);
      setResolvedSource(null);
    }
  }, [smartInput]);

  // Debounced search
  useEffect(() => {
    if (!smartInput.trim() || parsedCitation?.resolvable) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/sources/search?q=${encodeURIComponent(smartInput)}&limit=8`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data || data || []);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Search failed:', error);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [smartInput, parsedCitation]);

  // Fetch hierarchy when browser is shown
  useEffect(() => {
    if (!showBrowser) return;

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
  }, [showBrowser, currentParentId]);

  // Load AI suggestions based on context
  useEffect(() => {
    if (!open || !contextText?.trim()) return;

    const controller = new AbortController();
    const loadAiSuggestions = async () => {
      setIsLoadingAi(true);
      try {
        // For now, use search API with context keywords
        // In future, this could be a dedicated AI endpoint
        const keywords = contextText
          .split(/\s+/)
          .filter((w) => w.length > 3)
          .slice(0, 3)
          .join(' ');

        if (keywords) {
          const response = await fetch(
            `/api/sources/search?q=${encodeURIComponent(keywords)}&limit=3`,
            { signal: controller.signal }
          );
          if (response.ok) {
            const data = await response.json();
            setAiSuggestions(data.data || data || []);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('AI suggestions failed:', error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingAi(false);
        }
      }
    };

    const timer = setTimeout(loadAiSuggestions, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, contextText]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const resolveReference = async (parsed: ParsedCitation) => {
    if (!parsed.volume || !parsed.page || !parsed.rootSourceId) return;

    setIsResolving(true);
    setResolutionFailed(false);
    try {
      const response = await fetch(
        `/api/sources/hierarchy?resolve=${parsed.volume},${parsed.page}&root_id=${parsed.rootSourceId}`
      );
      const data = await response.json();

      if (data.resolved) {
        setResolvedSource(data.source);
      } else {
        setResolvedSource(null);
        setResolutionFailed(true);
      }
    } catch (error) {
      console.error('Resolution failed:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const selectSource = (source: Source, volumeTitle?: string) => {
    setSelectedSource(source);
    setUrl(source.external_url || '');
    setSmartInput('');
    setSearchResults([]);
    setShowBrowser(false);

    // Use API-provided formatted_title if available, otherwise format client-side
    let formatted: FormattedCitation;
    if (source.formatted_title && source.formatted_title !== source.title) {
      // API already provided a nicely formatted title
      formatted = {
        full: source.formatted_title,
        sourceName: 'Likkutei Sichos', // Could parse from formatted_title if needed
        pages: source.page_number
          ? source.page_count && source.page_count > 1
            ? `pp. ${source.page_number}-${source.page_number + source.page_count - 1}`
            : `p. ${source.page_number}`
          : undefined,
      };
    } else {
      // Format client-side
      formatted = formatCitation({
        ...source,
        rootSourceId: 256, // Likkutei Sichos - TODO: detect dynamically
        volumeTitle,
      });
    }
    setFormattedCitation(formatted);

    // Set reference (just the page part, since full citation has everything)
    if (formatted.pages) {
      setReference(formatted.pages);
    } else if (source.page_number) {
      const pageRef =
        source.page_count && source.page_count > 1
          ? `pp. ${source.page_number}-${source.page_number + source.page_count - 1}`
          : `p. ${source.page_number}`;
      setReference(pageRef);
    }
  };

  const selectResolvedSource = () => {
    if (!resolvedSource) return;

    const source: Source = {
      id: resolvedSource.id,
      title: resolvedSource.title,
      formatted_title: resolvedSource.formatted_title,
      parent_id: resolvedSource.volume.id,
      external_url: resolvedSource.external_url,
      page_number: resolvedSource.page_number,
      page_count: resolvedSource.page_count,
      parsha: resolvedSource.parsha,
      is_leaf: true,
    };

    // Use API-provided formatted_title if available
    let formatted: FormattedCitation;
    if (resolvedSource.formatted_title) {
      formatted = {
        full: resolvedSource.formatted_title,
        sourceName: 'Likkutei Sichos',
        pages: `pp. ${resolvedSource.page_number}-${resolvedSource.page_number + resolvedSource.page_count - 1}`,
      };
    } else {
      formatted = formatCitation({
        ...source,
        rootSourceId: 256,
        volumeTitle: resolvedSource.volume.title,
      });
    }

    setSelectedSource(source);
    setFormattedCitation(formatted);
    setReference(formatted.pages || `p. ${resolvedSource.requested_page}`);
    setUrl(resolvedSource.external_url || '');
    setSmartInput('');
    setParsedCitation(null);
    setResolvedSource(null);
  };

  const navigateInto = (source: Source) => {
    if (source.is_leaf || !source.is_browsable) {
      selectSource(source);
    } else {
      setCurrentParentId(source.id);
      setBreadcrumbs((prev) => [...prev, { id: source.id, title: source.title }]);
    }
  };

  const navigateBack = (index: number) => {
    const target = breadcrumbs[index];
    setCurrentParentId(target.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const enterFreeTextMode = () => {
    setFreeTextCitation(smartInput);
    setFreeTextMode(true);
    setSmartInput('');
    setSearchResults([]);
    setResolutionFailed(false);
  };

  const handleCreateSource = async () => {
    if (!newSourceTitle.trim()) return;
    setIsCreatingSource(true);
    setCreateSourceError(null);
    try {
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSourceTitle.trim(),
          author_name: newSourceAuthor.trim() || undefined,
          external_url: newSourceUrl.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        setCreateSourceError(err.error || 'Failed to create source');
        return;
      }
      const data = await response.json();
      const created = data.data;
      selectSource({
        id: created.id,
        title: created.title,
        parent_id: null,
        external_url: created.external_url,
        external_system: created.external_system,
        is_leaf: true,
      });
      setShowAddSource(false);
      setNewSourceTitle('');
      setNewSourceAuthor('');
      setNewSourceUrl('');
    } catch {
      setCreateSourceError('Network error. Try again.');
    } finally {
      setIsCreatingSource(false);
    }
  };

  const handleInsert = () => {
    if (freeTextMode) {
      onInsert({
        sourceId: null,
        sourceTitle: freeTextCitation,
        reference: '',
        quote: quote.trim() || undefined,
        note: note.trim() || undefined,
        url: url.trim() || undefined,
      });
      onClose();
      return;
    }

    if (!selectedSource) return;

    // Use the formatted citation for a clean English reference
    const citationTitle = formattedCitation?.full || selectedSource.title;

    // Infer citation type from what the source actually has
    const citationType = selectedSource.page_number ? 'page' : 'reference';

    onInsert({
      sourceId: selectedSource.id,
      sourceTitle: citationTitle,
      reference: '', // Leave empty since sourceTitle already contains full formatted citation
      citationType,
      quote: quote.trim() || undefined,
      note: note.trim() || undefined,
      url: url.trim() || selectedSource.external_url || undefined,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isFormField = target
      ? ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      : false;
    const isSmartInput = target === inputRef.current;
    const activeList = showBrowser ? sources : searchResults;
    const canNavigateList =
      !selectedSource &&
      !freeTextMode &&
      !showAddSource &&
      !resolvedSource &&
      activeList.length > 0 &&
      (showBrowser || searchResults.length > 0);

    if (e.key === 'Escape') {
      if (showBrowser) {
        setShowBrowser(false);
      } else if (showAddSource) {
        setShowAddSource(false);
      } else if (selectedSource || freeTextMode) {
        setSelectedSource(null);
        setFormattedCitation(null);
        setFreeTextMode(false);
        setFreeTextCitation('');
      } else {
        onClose();
      }
    } else if (e.key === 'Enter') {
      if (isFormField && !isSmartInput) return;
      if (resolvedSource && !selectedSource && !freeTextMode) {
        e.preventDefault();
        selectResolvedSource();
      } else if (selectedSource || freeTextMode) {
        e.preventDefault();
        handleInsert();
      } else if (showBrowser && focusedIndex >= 0 && sources[focusedIndex]) {
        e.preventDefault();
        navigateInto(sources[focusedIndex]);
      } else if (!showBrowser && focusedIndex >= 0 && searchResults[focusedIndex]) {
        e.preventDefault();
        selectSource(searchResults[focusedIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      if (isFormField && !isSmartInput) return;
      if (!canNavigateList) return;
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, activeList.length - 1));
    } else if (e.key === 'ArrowUp') {
      if (isFormField && !isSmartInput) return;
      if (!canNavigateList) return;
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderSmartInput = () => (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={smartInput}
          onChange={(e) => {
            setSmartInput(e.target.value);
            setFocusedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a citation or search... (e.g., ל״ש ח״ד ע׳ 345)"
          className="w-full pl-4 pr-12 py-3 text-base border-2 border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          dir="auto"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(isSearching || isResolving) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {parsedCitation && parsedCitation.confidence > 0.5 && (
            <Zap className="h-4 w-4 text-amber-500" />
          )}
        </div>
      </div>

      {/* Smart Parse Preview */}
      {parsedCitation && parsedCitation.confidence > 0.3 && !resolvedSource && (
        <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-amber-800 dark:text-amber-200">
              {parsedCitation.interpretation}
            </span>
            {!parsedCitation.resolvable && (
              <span className="text-amber-600 dark:text-amber-400 text-xs">
                (add page number to auto-resolve)
              </span>
            )}
            {resolutionFailed && (
              <span className="text-amber-600 dark:text-amber-400 text-xs">
                (not found — try a different page)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Resolved Source Card */}
      {resolvedSource && (
        <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-foreground">
                  {resolvedSource.formatted_title || resolvedSource.title}
                </span>
              </div>
              {resolvedSource.formatted_title && (
                <p className="text-xs text-muted-foreground mt-1 pl-6" dir="rtl">
                  {resolvedSource.title}
                </p>
              )}
            </div>
            <button
              onClick={selectResolvedSource}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex-shrink-0"
            >
              Use <CornerDownLeft className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && !resolvedSource && !selectedSource && (
        <div className="w-full mt-2 bg-background border border-border rounded-xl shadow-sm overflow-hidden max-h-64 overflow-y-auto">
          {searchResults.map((source, index) => (
            <button
              key={source.id}
              onClick={() => selectSource(source)}
              onMouseEnter={() => setFocusedIndex(index)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/50 last:border-b-0 ${index === focusedIndex
                ? 'bg-primary/10'
                : 'hover:bg-muted'
                }`}
            >
              <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {source.formatted_title || source.title}
                </p>
                {source.formatted_title && source.formatted_title !== source.title && (
                  <p className="text-xs text-muted-foreground truncate" dir="rtl">
                    {source.title}
                  </p>
                )}
                {!source.formatted_title && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {source.parsha && <span>{source.parsha}</span>}
                    {source.page_number && <span>p. {source.page_number}</span>}
                    {source.external_system && (
                      <span className="bg-muted px-1.5 py-0.5 rounded">
                        {source.external_system}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {source.external_url && (
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </button>
          ))}
          <button
            onClick={enterFreeTextMode}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs text-muted-foreground hover:bg-muted/50 transition-colors border-t border-border"
          >
            <Type className="h-3.5 w-3.5" />
            {`Use "${smartInput}" as citation`}
          </button>
        </div>
      )}
    </div>
  );

  const renderSelectedSource = () => (
    <div className="space-y-4">
      {/* Selected Source Card */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {freeTextMode ? (
              <>
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground">Free-text citation</span>
                </div>
                <p className="font-semibold text-foreground mt-1 pl-6">{freeTextCitation}</p>
                <p className="text-xs text-muted-foreground mt-1 pl-6">
                  Not linked to a source in the library
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-muted-foreground text-sm" dir="rtl">
                    {selectedSource!.title}
                  </span>
                </div>
                {formattedCitation && (
                  <p className="font-semibold text-foreground mt-1 pl-6">
                    {formattedCitation.full}
                  </p>
                )}
                {selectedSource!.external_url && (
                  <a
                    href={selectedSource!.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2 pl-6"
                  >
                    View on {selectedSource!.external_system || 'source'} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </>
            )}
          </div>
          <button
            onClick={() => {
              setSelectedSource(null);
              setFormattedCitation(null);
              setFreeTextMode(false);
              setFreeTextCitation('');
            }}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
        />
        {showAdvanced ? 'Hide' : 'Show'} additional options
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-3 pl-4 border-l-2 border-border">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Quote from source
            </label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Paste exact quote..."
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Your note..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      )}

      {/* Citation Preview */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1.5">
          Citation will appear as:
        </p>
        <p className="text-base font-semibold text-foreground">
          {freeTextMode ? freeTextCitation : (formattedCitation?.full || selectedSource!.title)}
        </p>
      </div>
    </div>
  );

  const renderBrowser = () => (
    <div className="space-y-3">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id ?? 'root'}>
            {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <button
              onClick={() => navigateBack(index)}
              className={`px-2 py-0.5 rounded-md hover:bg-muted transition-colors ${index === breadcrumbs.length - 1
                ? 'font-medium text-foreground bg-muted'
                : 'text-muted-foreground'
                }`}
            >
              {crumb.title}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Sources List */}
      <div className="max-h-64 overflow-auto rounded-lg border border-border">
        {isLoadingBrowse ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No sources found</div>
        ) : (
          <div className="divide-y divide-border">
            {sources.map((source, index) => (
              <button
                key={source.id}
                onClick={() => navigateInto(source)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${index === focusedIndex ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
              >
                {source.is_browsable ? (
                  <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {source.formatted_title || source.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {source.formatted_title && source.formatted_title !== source.title && (
                      <span dir="rtl" className="truncate max-w-[150px]">{source.title}</span>
                    )}
                    {!source.formatted_title && source.parsha && <span>{source.parsha}</span>}
                    {!source.formatted_title && source.page_number && <span>p. {source.page_number}</span>}
                    {source.child_count && source.child_count > 0 && (
                      <span className="bg-muted px-1.5 py-0.5 rounded">
                        {source.child_count}
                      </span>
                    )}
                  </div>
                </div>
                {source.is_browsable && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowBrowser(false)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to search
      </button>
    </div>
  );

  const renderAiSuggestions = () => {
    if (!contextText || aiSuggestions.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          Suggested based on your text
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {aiSuggestions.map((source) => (
            <button
              key={source.id}
              onClick={() => selectSource(source)}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg hover:border-violet-400 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {(() => {
                  const displayTitle = source.formatted_title || source.title;
                  return displayTitle.length > 35
                    ? displayTitle.substring(0, 35) + '...'
                    : displayTitle;
                })()}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderNotFoundOptions = () => {
    const showOptions =
      smartInput.trim() &&
      !isSearching &&
      searchResults.length === 0 &&
      !resolvedSource &&
      (!parsedCitation?.resolvable || resolutionFailed);
    if (!showOptions) return null;

    return (
      <div className="mt-3 px-3 py-3 border border-border rounded-lg bg-muted/40">
        <p className="text-sm text-muted-foreground">
          No sources match <span className="font-medium text-foreground">&quot;{smartInput}&quot;</span>
        </p>
        <div className="flex flex-wrap gap-2 mt-2.5">
          <button
            onClick={enterFreeTextMode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Type className="h-3.5 w-3.5" />
            Insert as citation
          </button>
          <button
            onClick={() => { setShowAddSource(true); setNewSourceTitle(smartInput); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-sm font-medium text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add this source
          </button>
        </div>
      </div>
    );
  };

  const renderAddSourceForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setShowAddSource(false); setCreateSourceError(null); }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
        <h3 className="text-sm font-semibold text-foreground">Add New Source</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
          <input
            type="text"
            value={newSourceTitle}
            onChange={(e) => setNewSourceTitle(e.target.value)}
            placeholder="e.g. Derech Mitzvosecha"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Author (optional)</label>
          <input
            type="text"
            value={newSourceAuthor}
            onChange={(e) => setNewSourceAuthor(e.target.value)}
            placeholder="e.g. Maharam Chayim"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">URL (optional)</label>
          <input
            type="url"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            placeholder="https://hebrewbooks.org/..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {createSourceError && (
        <p className="text-sm text-red-600">{createSourceError}</p>
      )}
      <button
        onClick={handleCreateSource}
        disabled={isCreatingSource || !newSourceTitle.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreatingSource ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
        ) : (
          <><Plus className="h-4 w-4" /> Create & Select</>
        )}
      </button>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 pt-[10vh] sm:pt-[15vh]"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 max-h-[90vh] flex flex-col sm:max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{isEditMode ? 'Edit Citation' : 'Add Citation'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {!showBrowser && !selectedSource && !freeTextMode && !showAddSource && (
              <button
                onClick={() => setShowBrowser(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <Folder className="h-3.5 w-3.5" />
                Browse
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {(selectedSource || freeTextMode) ? (
            renderSelectedSource()
          ) : showBrowser ? (
            renderBrowser()
          ) : showAddSource ? (
            renderAddSourceForm()
          ) : (
            <>
              {renderAiSuggestions()}
              {renderSmartInput()}
              {renderNotFoundOptions()}

              {/* Keyboard Hints */}
              {!smartInput && !searchResults.length && (
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      ↑↓
                    </kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      Enter
                    </kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      Esc
                    </kbd>
                    Close
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {(selectedSource || freeTextMode) && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-muted/30">
            <button
              onClick={() => {
                setSelectedSource(null);
                setFormattedCitation(null);
                setFreeTextMode(false);
                setFreeTextCitation('');
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleInsert}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {isEditMode ? (
                <><Check className="h-4 w-4" /> Update Citation</>
              ) : (
                <><Plus className="h-4 w-4" /> Insert Citation</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
