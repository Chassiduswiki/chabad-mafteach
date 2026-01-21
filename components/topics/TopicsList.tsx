'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Hash, Brain, Hand, Sparkles, BookText, FileText, Layers, TrendingUp, SortAsc, Check, ChevronDown } from 'lucide-react';
import type { Topic } from '@/lib/types';
import { ViewToggle } from '@/components/layout/ViewToggle';
import Pagination from './Pagination';
import { TopicCard } from './TopicCard';

interface TopicsListProps {
    topics: Topic[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

interface TopicContentCount {
    id: number;
    statementCount: number;
    documentCount: number;
    status: 'comprehensive' | 'partial' | 'minimal';
    statusLabel?: string;
    badgeColor?: string;
}

const categoryIcons = {
    concepts: Brain,
    practices: Hand,
    attributes: Sparkles,
    terminology: BookText,
    other: Hash
};

const categoryColors = {
    concepts: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    practices: 'from-emerald-500/10 to-green-500/10 border-emerald-500/20',
    attributes: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
    terminology: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
    other: 'from-gray-500/10 to-slate-500/10 border-gray-500/20'
};

export function TopicsList({ topics, currentPage, totalPages, totalCount }: TopicsListProps) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [isMobile, setIsMobile] = useState(false);
    const [contentCounts, setContentCounts] = useState<Record<number, TopicContentCount>>({});
    const [topicPreviews, setTopicPreviews] = useState<Record<number, any>>({});
    const [sortBy, setSortBy] = useState<'name' | 'category' | 'popularity'>('name');
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const [topicAnalytics, setTopicAnalytics] = useState<Record<number, any>>({});

    const fetchTopicAnalytics = async () => {
        try {
            const response = await fetch('/api/analytics');
            const data = await response.json();
            const analyticsMap: Record<number, any> = {};
            if (data.topics) {
                data.topics.forEach((topic: any) => { analyticsMap[topic.id] = topic; });
            }
            setTopicAnalytics(analyticsMap);
        } catch (error) {
            console.error('Failed to fetch topic analytics:', error);
        }
    };

    const fetchTopicStats = async (topicIds: number[]) => {
        if (topicIds.length === 0) return;
        try {
            const response = await fetch(`/api/topics/stats?ids=${topicIds.join(',')}`);
            const data = await response.json();
            if (data.stats) {
                setContentCounts(prev => ({ ...prev, ...data.stats }));
            }
        } catch (error) {
            console.error('Failed to fetch topic stats:', error);
        }
    };

    const fetchTopicPreview = async (topicId: number) => {
        if (topicPreviews[topicId]) return;
        try {
            const response = await fetch(`/api/topic-preview/${topicId}`);
            const data = await response.json();
            setTopicPreviews(prev => ({ ...prev, [topicId]: data }));
        } catch (error) {
            console.error('Failed to fetch topic preview:', error);
        }
    };

    useEffect(() => {
        if (topics.length > 0) {
            const topicIds = topics.map(t => t.id);
            fetchTopicStats(topicIds);
            if (sortBy === 'popularity') fetchTopicAnalytics();
        }
    }, [topics, sortBy]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const savedView = localStorage.getItem('topicsView');
        const savedSort = localStorage.getItem('topicsSort');
        if (savedView === 'grid' || savedView === 'list') {
            setView(savedView);
        } else if (isMobile) {
            setView('list');
        }
        if (savedSort === 'name' || savedSort === 'category' || savedSort === 'popularity') {
            setSortBy(savedSort);
        }
    }, [isMobile]);

    const handleViewChange = (newView: 'grid' | 'list') => {
        setView(newView);
        localStorage.setItem('topicsView', newView);
    };

    const handleSortChange = (newSort: 'name' | 'category' | 'popularity') => {
        setSortBy(newSort);
        localStorage.setItem('topicsSort', newSort);
        setSortDropdownOpen(false);
    };

    const grouped = topics.reduce((acc: Record<string, Topic[]>, topic: Topic) => {
        const cat = topic.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(topic);
        return acc;
    }, {});

    const sortedGrouped = Object.entries(grouped).reduce((acc, [category, items]) => {
        acc[category] = [...items].sort((a, b) => {
            if (sortBy === 'name') return (a.canonical_title || a.name || '').localeCompare(b.canonical_title || b.name || '');
            if (sortBy === 'category') return (a.topic_type || '').localeCompare(b.topic_type || '');
            if (sortBy === 'popularity') {
                const aViews = topicAnalytics[a.id]?.views || 0;
                const bViews = topicAnalytics[b.id]?.views || 0;
                return bViews - aViews;
            }
            return 0;
        });
        return acc;
    }, {} as Record<string, Topic[]>);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex items-center gap-2 text-sm">
                    <SortAsc className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground hidden sm:inline">Sort by:</span>
                    <button
                        onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSortDropdownOpen(!sortDropdownOpen);
                            }
                        }}
                        aria-label="Sort topics"
                        aria-expanded={sortDropdownOpen}
                        aria-haspopup="listbox"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border/50 hover:border-primary/30 hover:bg-background/80 transition-all font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <span className="capitalize">{sortBy}</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {sortDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setSortDropdownOpen(false)} />
                            <div role="listbox" aria-label="Sort options" className="absolute top-full left-0 mt-2 w-40 rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm shadow-lg z-20 overflow-hidden">
                                {(['name', 'category', 'popularity'] as const).map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleSortChange(option)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleSortChange(option);
                                            }
                                        }}
                                        role="option"
                                        aria-selected={sortBy === option}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors focus:outline-none focus:bg-muted/50"
                                    >
                                        <span className="capitalize">{option}</span>
                                        {sortBy === option && <Check className="h-4 w-4 text-primary" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <ViewToggle view={view} onViewChange={handleViewChange} />
            </div>

            <div className="space-y-12">
                {Object.entries(sortedGrouped).map(([category, items]) => {
                    const Icon = categoryIcons[category as keyof typeof categoryIcons] || Hash;
                    const colorClass = categoryColors[category as keyof typeof categoryColors] || categoryColors.other;

                    return (
                        <div key={category}>
                            <div className="mb-6 flex items-center gap-3">
                                <h2 className="sr-only">Category: {category}</h2>
                                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${colorClass}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <h2 className="text-xl font-semibold capitalize tracking-tight">{category}</h2>
                                <span className="text-sm text-muted-foreground font-mono">({items.length})</span>
                            </div>

                            <div className={view === 'grid' ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "border-t border-border"}>
                                {items.map((topic) => (
                                    <TopicCard
                                        key={topic.id}
                                        topic={topic}
                                        view={view}
                                        contentCount={contentCounts[topic.id]}
                                        colorClass={colorClass}
                                        preview={topicPreviews[topic.id]}
                                        onPreviewRequest={fetchTopicPreview}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {topics.length > 0 && (
                <div className="mt-16">
                    <Pagination currentPage={currentPage} totalPages={totalPages} />
                </div>
            )}

            {topics.length === 0 && (
                <div className="py-24 text-center" role="status" aria-live="polite">
                    <div className="mx-auto w-fit p-6 rounded-2xl bg-muted/30 mb-6">
                        <Hash className="mx-auto h-16 w-16 text-muted-foreground/40" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No topics found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">Try adjusting your filters or search terms to discover more content.</p>
                </div>
            )}
        </div>
    );
}
