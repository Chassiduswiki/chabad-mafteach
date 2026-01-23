'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { Search, BookOpen, Hash, ArrowRight, Brain, X, History, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useDragControls, useMotionValue } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/search-context';
import { useAnalytics } from '@/lib/analytics-tracker';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { rankSearchResults, getSearchQueryVariants } from '@/lib/utils/search-processor';

type SearchResult = {
    id: string;
    title: string;
    type: 'document' | 'location' | 'topic' | 'statement';
    subtitle?: string;
    category?: string;
    slug?: string;
    url: string;
};

// Category color mapping for badges - matches TopicsList colors
const categoryColors: Record<string, string> = {
    concepts: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    practices: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    attributes: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',
    terminology: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
    concept: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    practice: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    attribute: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',
    term: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
};

// Type configuration for search result icons and colors
const typeConfig: Record<string, { icon: typeof Brain; gradient: string }> = {
    topic: { icon: Brain, gradient: 'from-purple-500 to-indigo-600' },
    document: { icon: BookOpen, gradient: 'from-amber-500 to-orange-600' },
    location: { icon: Hash, gradient: 'from-emerald-500 to-teal-600' },
    statement: { icon: BookOpen, gradient: 'from-blue-500 to-cyan-600' },
};

const RECENT_SEARCHES_KEY = 'chabad-mafteach:recent-searches';
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function addRecentSearch(query: string) {
    if (typeof window === 'undefined' || !query.trim()) return;
    try {
        const recent = getRecentSearches().filter(s => s !== query);
        recent.unshift(query);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES)));
    } catch {
        // Ignore localStorage errors
    }
}

function clearRecentSearches() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
        // Ignore
    }
}

export function CommandMenu() {
    const { open, setOpen } = useSearch();
    const { search: trackSearch } = useAnalytics();
    const [search, setSearch] = React.useState('');
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
    const router = useRouter();

    // Load recent searches on mount
    React.useEffect(() => {
        setRecentSearches(getRecentSearches());
    }, [open]);

    // Bottom sheet drag control
    const y = useMotionValue(0);

    // Debounced Search & Processing
    React.useEffect(() => {
        if (!search) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                // Generate variants for better discovery (Hebrew <-> English)
                const variants = getSearchQueryVariants(search);
                const query = variants[0]; // Primary variant

                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();

                // Helper to strip HTML tags
                const stripHtml = (html: string | undefined) => {
                    if (!html) return undefined;
                    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
                };

                // Map raw results to our SearchResult type with ID validation
                const topicResults: SearchResult[] = (data.topics || []).filter((t: any) => t.slug).map((t: any) => ({
                    id: `topic-${t.id || t.slug}`,
                    title: t.name || t.canonical_title || 'Untitled',
                    type: 'topic' as const,
                    subtitle: stripHtml(t.description || t.definition_short),
                    category: t.category || t.topic_type,
                    slug: t.slug,
                    url: `/topics/${t.slug}`
                }));

                const documentsResults: SearchResult[] = ((data.documents || []).concat(data.seforim || [])).filter((s: any) => s.id).map((s: any) => ({
                    id: `document-${s.id}`,
                    title: s.title,
                    type: 'document' as const,
                    subtitle: [s.author, s.doc_type, s.category].filter(Boolean).join(' • '),
                    url: `/seforim/${s.id}`
                }));

                const locationResults: SearchResult[] = (data.locations || []).map((l: any) => ({
                    id: `loc-${l.id}`,
                    title: l.display_name || l.title,
                    type: 'location' as const,
                    subtitle: stripHtml(l.content_preview),
                    url: l.url || `/seforim/${l.sefer || l.document_id}`
                }));

                const statementResults: SearchResult[] = (data.statements || []).map((s: any) => ({
                    id: `stmt-${s.id}`,
                    title: s.title,
                    type: 'statement' as const,
                    subtitle: stripHtml(s.content_preview),
                    url: s.url || `/seforim/${s.document_id || s.block_id || s.paragraph_id}`
                }));

                const allResults = [...topicResults, ...documentsResults, ...locationResults, ...statementResults];

                // Use our new ranking utility to sort results intelligently
                const rankedResults = rankSearchResults(allResults as any, search);
                setResults(rankedResults.slice(0, 20) as SearchResult[]);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const handleSelect = (url: string) => {
        // Save search to recent if there was a query
        if (search.trim()) {
            addRecentSearch(search.trim());
        }
        setOpen(false);
        setSearch('');
        router.push(url);
    };

    const handleRecentSearchClick = (query: string) => {
        setSearch(query);
    };

    const handleClearRecent = () => {
        clearRecentSearches();
        setRecentSearches([]);
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setOpen(false);
                            setSearch('');
                        }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Mobile Bottom Sheet */}
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) {
                                setOpen(false);
                            }
                        }}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] max-h-[92vh] flex flex-col bg-background border-t border-border rounded-t-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center p-3 sm:p-4 cursor-grab active:cursor-grabbing">
                            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                        </div>

                        <Command className="flex flex-col flex-1 min-h-0 bg-transparent" shouldFilter={false}>
                            {/* Search Input Area */}
                            <div className="px-6 pb-4">
                                <div className="relative">
                                    <div className="relative flex items-center bg-muted/30 border border-border rounded-xl px-4 focus-within:border-primary focus-within:bg-background transition-all">
                                        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                        <Command.Input
                                            value={search}
                                            onValueChange={setSearch}
                                            placeholder="Search topics, sources..."
                                            className="flex h-14 w-full bg-transparent px-3 py-3 text-base outline-none placeholder:text-muted-foreground disabled:opacity-50"
                                            autoFocus
                                        />
                                        {search && (
                                            <button
                                                onClick={() => setSearch('')}
                                                className="p-1 hover:bg-muted rounded-full ml-1 animate-in fade-in zoom-in-90"
                                            >
                                                <X className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        )}
                                        <div className="h-6 w-px bg-border/50 mx-2" />
                                        <button
                                            onClick={() => setOpen(false)}
                                            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-2"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Results Area */}
                            <Command.List className="flex-1 overflow-y-auto px-4 pb-12 scrollbar-none scroll-smooth">
                                {loading && (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
                                        <LoadingSpinner size="sm" className="text-primary" />
                                        <span className="text-sm font-medium">Searching the libraries...</span>
                                    </div>
                                )}

                                {!loading && !search && (
                                    <div className="py-6">
                                        {recentSearches.length > 0 ? (
                                            <div>
                                                <div className="flex items-center justify-between mb-3 px-2">
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        <History className="w-3.5 h-3.5" />
                                                        Recent Searches
                                                    </div>
                                                    <button
                                                        onClick={handleClearRecent}
                                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                                <div className="space-y-1">
                                                    {recentSearches.map((query, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleRecentSearchClick(query)}
                                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                                        >
                                                            <History className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-sm text-foreground">{query}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center">
                                                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                                <h3 className="text-base font-semibold text-foreground">Search the Library</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Topics, sources, and concepts
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!loading && search && results.length === 0 && (
                                    <div className="py-20 text-center animate-in zoom-in-95 duration-300">
                                        <div className="mb-4 inline-flex p-4 bg-muted/50 rounded-full">
                                            <Search className="w-10 h-10 text-muted-foreground opacity-20" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground">No matches found</h3>
                                        <p className="text-sm text-muted-foreground">Try a different spelling or keyword</p>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    {results.map((item, index) => {
                                        const config = typeConfig[item.type] || typeConfig.topic;
                                        const Icon = config.icon;

                                        return (
                                            <Command.Item
                                                key={item.id}
                                                value={item.id}
                                                onSelect={() => handleSelect(item.url)}
                                                className="group relative rounded-lg border border-transparent bg-muted/20 p-3 transition-all active:scale-[0.98] aria-selected:bg-primary/10 aria-selected:border-primary/30"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Icon className="w-4.5 h-4.5 text-primary" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-semibold text-foreground truncate">
                                                                {item.title}
                                                            </h4>
                                                            {item.category && (
                                                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                                    {item.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.subtitle && (
                                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                                {item.subtitle}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-aria-selected:text-primary" />
                                                </div>
                                            </Command.Item>
                                        );
                                    })}
                                </div>
                            </Command.List>
                        </Command>
                    </motion.div>

                    {/* Desktop Integrated Modal (Enhanced) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="hidden sm:flex w-full max-w-2xl mt-[10vh] overflow-hidden rounded-3xl border border-border/50 bg-card/80 backdrop-blur-2xl shadow-2xl flex-col"
                    >
                        <Command className="w-full flex flex-col min-h-0" shouldFilter={false}>
                            <div className="flex items-center px-6 border-b border-border/50">
                                <Search className="w-5 h-5 text-muted-foreground mr-4" />
                                <Command.Input
                                    value={search}
                                    onValueChange={setSearch}
                                    placeholder="Search command menu..."
                                    className="flex h-16 w-full bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground"
                                    autoFocus
                                />
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                        <span>ESC</span>
                                        <span>TO CLOSE</span>
                                    </div>
                                    <button onClick={() => setOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            <Command.List className="max-h-[60vh] overflow-y-auto p-4 scrollbar-thin">
                                {loading && (
                                    <div className="flex items-center justify-center py-12 text-muted-foreground gap-3">
                                        <LoadingSpinner size="sm" />
                                        <span>Mining data...</span>
                                    </div>
                                )}

                                {!loading && !search && (
                                    <div className="py-6">
                                        {recentSearches.length > 0 ? (
                                            <div>
                                                <div className="flex items-center justify-between mb-3 px-1">
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        <History className="w-3.5 h-3.5" />
                                                        Recent Searches
                                                    </div>
                                                    <button
                                                        onClick={handleClearRecent}
                                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        Clear all
                                                    </button>
                                                </div>
                                                <div className="space-y-1">
                                                    {recentSearches.map((query, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleRecentSearchClick(query)}
                                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                                                        >
                                                            <History className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-sm text-foreground group-hover:text-primary transition-colors">{query}</span>
                                                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-10 text-center">
                                                <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                                                <h3 className="text-lg font-semibold text-foreground">Search the Library</h3>
                                                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                                                    Find topics, sources, and concepts
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-1.5">
                                    {results.map((item) => {
                                        const config = typeConfig[item.type] || typeConfig.topic;
                                        const Icon = config.icon;

                                        return (
                                            <Command.Item
                                                key={item.id}
                                                value={item.id}
                                                onSelect={() => handleSelect(item.url)}
                                                className="group relative flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-all aria-selected:bg-primary/10 hover:bg-muted/50"
                                            >
                                                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Icon className="w-4.5 h-4.5 text-primary" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-foreground truncate">{item.title}</span>
                                                        {item.category && (
                                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.category}</span>
                                                        )}
                                                    </div>
                                                    {item.subtitle && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.subtitle}</p>
                                                    )}
                                                </div>

                                                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-aria-selected:text-primary transition-colors" />
                                            </Command.Item>
                                        );
                                    })}
                                </div>
                            </Command.List>

                            <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60">
                                    <div className="flex items-center gap-1.5">
                                        <kbd className="px-1.5 py-0.5 bg-background border border-border/50 rounded shadow-sm">↑↓</kbd>
                                        <span>NAVIGATE</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <kbd className="px-1.5 py-0.5 bg-background border border-border/50 rounded shadow-sm">↵</kbd>
                                        <span>SELECT</span>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-muted-foreground/40 tracking-widest">
                                    CHABAD RESEARCH v2.0
                                </div>
                            </div>
                        </Command>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
