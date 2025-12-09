'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
    id: string;
    name: string;
    name_hebrew?: string;
    slug: string;
    category?: string;
    definition_short?: string;
}

interface ContextualSearchProps {
    placeholder?: string;
    searchType: 'topics' | 'documents';
}

/**
 * ContextualSearch - In-page search for Topics and Sources pages
 * Per Task 2.6: Add contextual search on content pages
 * Filters the current page content without opening global modal
 */
export default function ContextualSearch({ placeholder = "Search topics...", searchType = 'topics' }: ContextualSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    const search = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (searchType === 'topics') {
                setResults(data.topics || []);
            } else {
                setResults(data.documents || []);
            }
            setIsOpen(true);
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [searchType]);

    useEffect(() => {
        const timer = setTimeout(() => {
            search(query);
        }, 200);
        return () => clearTimeout(timer);
    }, [query, search]);

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="h-10 w-full rounded-lg border border-border bg-muted/30 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Results dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border border-border bg-background shadow-xl">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                            Searching...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            No {searchType} found for "{query}"
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {results.slice(0, 8).map((result) => (
                                <li key={result.id}>
                                    <Link
                                        href={searchType === 'topics' ? `/topics/${result.slug}` : `/documents/${result.id}`}
                                        onClick={() => setIsOpen(false)}
                                        className="flex flex-col gap-1 px-4 py-3 hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="font-medium text-foreground">{result.name}</span>
                                        {result.name_hebrew && (
                                            <span className="text-sm text-muted-foreground font-hebrew">{result.name_hebrew}</span>
                                        )}
                                        {result.category && (
                                            <span className="text-xs text-primary">{result.category}</span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
