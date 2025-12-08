'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { Search, BookOpen, Hash, ArrowRight, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { useSearch } from '@/lib/search-context';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type SearchResult = {
    id: string;
    title: string;
    type: 'sefer' | 'location' | 'topic';
    subtitle?: string;
    category?: string;
    slug?: string;
    url: string;
};

export function CommandMenu() {
    const { open, setOpen } = useSearch();
    const [search, setSearch] = React.useState('');
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();

    // Debounced Search
    React.useEffect(() => {
        if (!search) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                console.log('Searching for:', search);
                // Call our Next.js API route instead of Directus directly
                const response = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
                const data = await response.json();

                console.log('Search results:', data);

                const topicResults: SearchResult[] = (data.topics || []).map((t: any) => ({
                    id: `topic-${t.id}`,
                    title: t.title || t.name || 'Untitled',
                    type: 'topic' as const,
                    subtitle: t.definition?.substring(0, 80) + (t.definition?.length > 80 ? '...' : ''),
                    category: t.category || t.topic_type,
                    slug: t.slug,
                    url: `/topics/${t.slug}`
                }));

                const seforimResults: SearchResult[] = (data.seforim || []).map((s: any) => ({
                    id: `sefer-${s.id}`,
                    title: s.title,
                    type: 'sefer' as const,
                    subtitle: s.author ?? undefined,
                    url: `/seforim/${s.id}`
                }));

                const locationResults: SearchResult[] = (data.locations || []).map((l: any) => ({
                    id: `loc-${l.id}`,
                    title: l.display_name,
                    type: 'location' as const,
                    url: `/seforim/${l.sefer}`
                }));

                const allResults = [...topicResults, ...seforimResults, ...locationResults];

                // Apply fuzzy search for better matching
                const fuse = new Fuse(allResults, {
                    keys: ['title', 'subtitle', 'slug', 'category'],
                    threshold: 0.4, // 0 = perfect match, 1 = match anything
                    includeScore: true
                });

                const fuzzyResults = search.length > 2
                    ? fuse.search(search).map(result => result.item)
                    : allResults; // Don't use fuzzy for very short queries

                setResults(fuzzyResults);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const handleSelect = (url: string) => {
        setOpen(false);
        router.push(url);
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-2 sm:pt-[15vh] sm:px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl shadow-primary/20 backdrop-blur-xl ring-1 ring-white/10 max-h-[90vh] flex flex-col"
                    >
                        <Command className="w-full" shouldFilter={false}>
                            <div className="flex items-center border-b border-border px-4">
                                <Search className="mr-3 h-5 w-5 text-muted-foreground" />
                                <Command.Input
                                    value={search}
                                    onValueChange={setSearch}
                                    placeholder="Search for anything..."
                                    className="flex h-16 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                    autoFocus
                                />
                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="rounded bg-muted px-1.5 py-0.5">ESC</span>
                                        <span>to close</span>
                                    </div>
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        aria-label="Close search"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <Command.List className="max-h-[60vh] sm:max-h-[65vh] overflow-y-auto p-2 scrollbar-hide">
                                {!search && results.length === 0 && (
                                    <div className="py-12 text-center text-sm text-muted-foreground">
                                        Start typing to search...
                                    </div>
                                )}

                                {search && loading && (
                                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Searching...
                                    </div>
                                )}

                                {search && !loading && results.length === 0 && (
                                    <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
                                        <div className="mb-2 flex justify-center">
                                            <Search className="h-8 w-8 opacity-20" />
                                        </div>
                                        No results found for "{search}".
                                    </Command.Empty>
                                )}

                                {results.length > 0 && (
                                    <>
                                        {/* Topics/Concepts Group */}
                                        {results.filter(r => r.type === 'topic').length > 0 && (
                                            <Command.Group heading={`Concepts (${results.filter(r => r.type === 'topic').length})`} className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                                                {results.filter(r => r.type === 'topic').map((item) => (
                                                    <Command.Item
                                                        key={item.id}
                                                        value={item.title}
                                                        onSelect={() => handleSelect(item.url)}
                                                        className="group relative flex cursor-pointer select-none items-center rounded-xl px-3 py-3 text-sm outline-none transition-colors aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                                    >
                                                        <div
                                                            className="flex w-full items-center"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelect(item.url);
                                                            }}
                                                        >
                                                            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background shadow-sm transition-colors group-aria-selected:border-primary/20 group-aria-selected:bg-primary/10">
                                                                <Brain className="h-5 w-5 text-purple-500" />
                                                            </div>
                                                            <div className="flex flex-1 flex-col gap-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-semibold text-foreground">{item.title}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        {item.category && (
                                                                            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                                                                                {item.category}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-xs text-muted-foreground capitalize group-aria-selected:text-primary">topic</span>
                                                                    </div>
                                                                </div>
                                                                {item.subtitle && (
                                                                    <span className="text-xs text-muted-foreground line-clamp-1 group-aria-selected:text-muted-foreground/80">{item.subtitle}</span>
                                                                )}
                                                            </div>
                                                            <ArrowRight className="ml-4 h-4 w-4 opacity-0 transition-all -translate-x-2 group-aria-selected:opacity-100 group-aria-selected:translate-x-0 text-primary" />
                                                        </div>
                                                    </Command.Item>
                                                ))}
                                            </Command.Group>
                                        )}

                                        {/* Seforim/Sources Group */}
                                        {results.filter(r => r.type === 'sefer').length > 0 && (
                                            <Command.Group heading={`Sources (${results.filter(r => r.type === 'sefer').length})`} className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                                                {results.filter(r => r.type === 'sefer').map((item) => (
                                                    <Command.Item
                                                        key={item.id}
                                                        value={item.title}
                                                        onSelect={() => handleSelect(item.url)}
                                                        className="group relative flex cursor-pointer select-none items-center rounded-xl px-3 py-3 text-sm outline-none transition-colors aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                                    >
                                                        <div
                                                            className="flex w-full items-center"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelect(item.url);
                                                            }}
                                                        >
                                                            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background shadow-sm transition-colors group-aria-selected:border-primary/20 group-aria-selected:bg-primary/10">
                                                                <BookOpen className="h-5 w-5 text-blue-500" />
                                                            </div>
                                                            <div className="flex flex-1 flex-col gap-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-semibold text-foreground">{item.title}</span>
                                                                    <span className="text-xs text-muted-foreground capitalize group-aria-selected:text-primary">{item.type}</span>
                                                                </div>
                                                                {item.subtitle && (
                                                                    <span className="text-xs text-muted-foreground line-clamp-1 group-aria-selected:text-muted-foreground/80">{item.subtitle}</span>
                                                                )}
                                                            </div>
                                                            <ArrowRight className="ml-4 h-4 w-4 opacity-0 transition-all -translate-x-2 group-aria-selected:opacity-100 group-aria-selected:translate-x-0 text-primary" />
                                                        </div>
                                                    </Command.Item>
                                                ))}
                                            </Command.Group>
                                        )}

                                        {/* Locations Group */}
                                        {results.filter(r => r.type === 'location').length > 0 && (
                                            <Command.Group heading={`Locations (${results.filter(r => r.type === 'location').length})`} className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                                                {results.filter(r => r.type === 'location').map((item) => (
                                                    <Command.Item
                                                        key={item.id}
                                                        value={item.title}
                                                        onSelect={() => handleSelect(item.url)}
                                                        className="group relative flex cursor-pointer select-none items-center rounded-xl px-3 py-3 text-sm outline-none transition-colors aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                                    >
                                                        <div
                                                            className="flex w-full items-center"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelect(item.url);
                                                            }}
                                                        >
                                                            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background shadow-sm transition-colors group-aria-selected:border-primary/20 group-aria-selected:bg-primary/10">
                                                                <Hash className="h-5 w-5 text-amber-500" />
                                                            </div>
                                                            <div className="flex flex-1 flex-col gap-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-semibold text-foreground">{item.title}</span>
                                                                    <span className="text-xs text-muted-foreground capitalize group-aria-selected:text-primary">{item.type}</span>
                                                                </div>
                                                                {item.subtitle && (
                                                                    <span className="text-xs text-muted-foreground line-clamp-1 group-aria-selected:text-muted-foreground/80">{item.subtitle}</span>
                                                                )}
                                                            </div>
                                                            <ArrowRight className="ml-4 h-4 w-4 opacity-0 transition-all -translate-x-2 group-aria-selected:opacity-100 group-aria-selected:translate-x-0 text-primary" />
                                                        </div>
                                                    </Command.Item>
                                                ))}
                                            </Command.Group>
                                        )}
                                    </>
                                )}
                            </Command.List>
                            <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground">
                                <div className="flex gap-4">
                                    <span><strong>↑↓</strong> to navigate</span>
                                    <span><strong>↵</strong> to select</span>
                                </div>
                                <div>
                                    Chabad Maftaiach v2.0
                                </div>
                            </div>
                        </Command>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
