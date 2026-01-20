'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';

interface SearchResultItem {
    id: string;
    name: string;
    slug: string;
    category?: string;
    definition_short?: string;
}

interface SearchResult {
    topics: SearchResultItem[];
    documents: SearchResultItem[];
    seforim: SearchResultItem[];
    // Add other types as needed
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
    const [results, setResults] = useState<SearchResult>({ topics: [], documents: [], seforim: [] });
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
            setResults({ topics: [], documents: [], seforim: [] });
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            setResults(data);
            setIsOpen(true);
        } catch (error) {
            console.error('Search failed:', error);
            setResults({ topics: [], documents: [], seforim: [] });
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
        setResults({ topics: [], documents: [], seforim: [] });
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
                    ) : (results.topics.length === 0 && results.seforim.length === 0) ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div>
                            {results.topics.length > 0 && (
                                <div className="border-b border-border">
                                    <h4 className="px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Topics</h4>
                                    <ul>
                                        {results.topics.slice(0, 5).map((result) => (
                                            <li key={`topic-${result.id}`}>
                                                <Link href={`/topics/${result.slug}`} onClick={() => setIsOpen(false)} className="block p-3 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-foreground">{result.name}</span>
                                                        {result.category && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{result.category}</span>}
                                                    </div>
                                                    {result.definition_short && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{result.definition_short.replace(/<[^>]*>/g, '')}</p>}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {results.seforim.length > 0 && (
                                <div>
                                    <h4 className="px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Seforim</h4>
                                    <ul>
                                        {results.seforim.slice(0, 3).map((result) => (
                                            <li key={`sefer-${result.id}`}>
                                                <Link href={`/seforim/${result.slug}`} onClick={() => setIsOpen(false)} className="block p-3 hover:bg-muted/50 transition-colors">
                                                    <span className="font-semibold text-foreground">{result.name}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
