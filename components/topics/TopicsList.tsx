'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Hash, Brain, Hand, Sparkles, BookText, FileText, Layers, TrendingUp, SortAsc } from 'lucide-react';
import type { Topic } from '@/lib/types';
import { ViewToggle } from '@/components/layout/ViewToggle';
import Pagination from './Pagination';

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
    const [hoveredTopic, setHoveredTopic] = useState<number | null>(null);
    const [topicPreviews, setTopicPreviews] = useState<Record<number, any>>({});
    const [sortBy, setSortBy] = useState<'name' | 'category' | 'popularity'>('name');
    const [topicAnalytics, setTopicAnalytics] = useState<Record<number, any>>({});

    // Fetch topic analytics data for popularity sorting
    const fetchTopicAnalytics = async () => {
        try {
            const response = await fetch('/api/analytics');
            const data = await response.json();
            const analyticsMap: Record<number, any> = {};
            if (data.topics) {
                data.topics.forEach((topic: any) => {
                    analyticsMap[topic.id] = topic;
                });
            }
            setTopicAnalytics(analyticsMap);
        } catch (error) {
            console.error('Failed to fetch topic analytics:', error);
        }
    };

    // Fetch topic stats (counts and status)
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

    // Fetch topic preview data
    const fetchTopicPreview = async (topicId: number) => {
        if (topicPreviews[topicId]) return; // Already fetched

        try {
            const response = await fetch(`/api/topic-preview/${topicId}`);
            const data = await response.json();
            setTopicPreviews(prev => ({ ...prev, [topicId]: data }));
        } catch (error) {
            console.error('Failed to fetch topic preview:', error);
        }
    };

    // Fetch analytics data and counts when topics list changes
    useEffect(() => {
        if (topics.length > 0) {
            const topicIds = topics.map(t => t.id);
            fetchTopicStats(topicIds);
            if (sortBy === 'popularity') {
                fetchTopicAnalytics();
            }
        }
    }, [topics, sortBy]);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load preference from localStorage on mount, default to list on mobile
    useEffect(() => {
        const savedView = localStorage.getItem('topicsView');
        if (savedView === 'grid' || savedView === 'list') {
            setView(savedView);
        } else if (isMobile) {
            // Default to list view on mobile if no saved preference
            setView('list');
        }
    }, [isMobile]);

    const handleViewChange = (newView: 'grid' | 'list') => {
        setView(newView);
        localStorage.setItem('topicsView', newView);
    };

    // Group by category
    const grouped = topics.reduce((acc: Record<string, Topic[]>, topic: Topic) => {
        const cat = topic.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(topic);
        return acc;
    }, {});

    // Sort topics within each category
    const sortedGrouped = Object.entries(grouped).reduce((acc, [category, items]) => {
        acc[category] = [...items].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.canonical_title || a.name || '').localeCompare(b.canonical_title || b.name || '');
                case 'category':
                    return (a.topic_type || '').localeCompare(b.topic_type || '');
                case 'popularity':
                    const aViews = topicAnalytics[a.id]?.views || 0;
                    const bViews = topicAnalytics[b.id]?.views || 0;
                    return bViews - aViews; // Descending: most viewed first
                default:
                    return 0;
            }
        });
        return acc;
    }, {} as Record<string, Topic[]>);

    return (
        <div className="space-y-8">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'category' | 'popularity')}
                        className="text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="name">Name</option>
                        <option value="category">Category</option>
                        <option value="popularity">Popularity</option>
                    </select>
                </div>
                <ViewToggle view={view} onViewChange={handleViewChange} />
            </div>

            {/* Content */}
            <div className="space-y-16">
                {Object.entries(sortedGrouped).map(([category, items]) => {
                    const Icon = categoryIcons[category as keyof typeof categoryIcons] || Hash;
                    const colorClass = categoryColors[category as keyof typeof categoryColors] || categoryColors.other;

                    return (
                        <div key={category}>
                            <div className="mb-6 flex items-center gap-3">
                                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colorClass}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h2 className="text-2xl font-semibold capitalize">{category}</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent"></div>
                            </div>

                            <div className={
                                view === 'grid'
                                    ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                                    : "space-y-3"
                            }>
                                {items.map((topic) => (
                                    <div
                                        key={topic.id}
                                        className="relative"
                                        onMouseEnter={() => {
                                            if (!isMobile) {
                                                setHoveredTopic(topic.id);
                                                fetchTopicPreview(topic.id);
                                            }
                                        }}
                                        onMouseLeave={() => !isMobile && setHoveredTopic(null)}
                                        onClick={() => {
                                            if (isMobile) {
                                                const newHovered = hoveredTopic === topic.id ? null : topic.id;
                                                setHoveredTopic(newHovered);
                                                if (newHovered) {
                                                    fetchTopicPreview(topic.id);
                                                }
                                            }
                                        }}
                                    >
                                        <Link
                                            href={`/topics/${topic.slug}`}
                                            className={
                                                view === 'grid'
                                                    ? `group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClass} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5`
                                                    : `group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/50`
                                            }
                                        >
                                            {view === 'grid' ? (
                                                <>
                                                    {/* Subtle gold gradient overlay on hover */}
                                                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#D4AF37]/0 via-[#D4AF37]/5 to-[#D4AF37]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                                                    <div className="flex flex-col gap-3">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                                                {topic.name}
                                                            </h3>
                                                            {topic.name_hebrew && (
                                                                <p className="mt-1 text-sm text-muted-foreground font-hebrew dir-rtl">
                                                                    {topic.name_hebrew}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {topic.definition_short && (
                                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                                {topic.definition_short}
                                                            </p>
                                                        )}

                                                        {/* Inline Source Snippets (NEW) */}
                                                        {topicPreviews[topic.id]?.excerpts?.length > 0 && (
                                                            <div className="mt-2 space-y-2">
                                                                <div className="h-px bg-border/50 w-full" />
                                                                {topicPreviews[topic.id].excerpts.slice(0, 1).map((excerpt: any) => (
                                                                    <p key={excerpt.id} className="text-[11px] text-muted-foreground/80 italic line-clamp-2 pl-2 border-l border-primary/20">
                                                                        "{excerpt.text}"
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Status Badges & Counts */}
                                                        <div className="mt-auto pt-2 flex items-center gap-3">
                                                            {contentCounts[topic.id] && (
                                                                <>
                                                                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${contentCounts[topic.id].status === 'comprehensive'
                                                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                                        : contentCounts[topic.id].status === 'partial'
                                                                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                                                        }`}>
                                                                        {contentCounts[topic.id].status}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                        <FileText className="h-3 w-3" />
                                                                        <span>{contentCounts[topic.id].statementCount} sources</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-background/50 opacity-0 ring-1 ring-border transition-all group-hover:opacity-100 group-hover:translate-x-1">
                                                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* List Item Content */}
                                                    <div className="flex items-center gap-4">
                                                        <div className={`h-2 w-2 rounded-full bg-gradient-to-br ${colorClass.split(' ')[0].replace('from-', 'bg-')}`} />
                                                        <div>
                                                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                                {topic.name}
                                                            </span>
                                                            {topic.definition_short && (
                                                                <span className="ml-3 text-sm text-muted-foreground line-clamp-1 hidden sm:inline">
                                                                    — {topic.definition_short}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {contentCounts[topic.id] && (
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                                                                    <FileText className="h-3.5 w-3.5" />
                                                                    <span>{contentCounts[topic.id].statementCount} sources</span>
                                                                </div>
                                                                <div className={`h-2 w-2 rounded-full cursor-help ${contentCounts[topic.id].status === 'comprehensive'
                                                                    ? 'bg-emerald-500'
                                                                    : contentCounts[topic.id].status === 'partial'
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-slate-300'
                                                                    }`} title={contentCounts[topic.id].status} />
                                                            </div>
                                                        )}
                                                        {topic.name_hebrew && (
                                                            <span className="text-sm text-muted-foreground font-hebrew">
                                                                {topic.name_hebrew}
                                                            </span>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </Link>
                                        {/* Source Preview */}
                                        {hoveredTopic === topic.id && (
                                            <div className="absolute top-full left-0 right-0 z-50 mt-2 p-4 bg-popover border border-border rounded-lg shadow-lg max-w-sm">
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-semibold text-popover-foreground">Source Preview</h4>
                                                    <div className="space-y-2">
                                                        {(() => {
                                                            const preview = topicPreviews[topic.id];
                                                            if (!preview) {
                                                                return (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        <p>Loading source preview...</p>
                                                                    </div>
                                                                );
                                                            }

                                                            if (preview.excerpts && preview.excerpts.length > 0) {
                                                                return preview.excerpts.map((excerpt: any, index: number) => (
                                                                    <div key={excerpt.id} className="text-xs text-muted-foreground">
                                                                        <p className="line-clamp-3 italic">
                                                                            "{excerpt.text}"
                                                                        </p>
                                                                        {index < preview.excerpts.length - 1 && (
                                                                            <hr className="my-2 border-border/50" />
                                                                        )}
                                                                    </div>
                                                                ));
                                                            }

                                                            return (
                                                                <div className="text-xs text-muted-foreground">
                                                                    <p>No source excerpts available</p>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="pt-2 border-t border-border">
                                                        <p className="text-xs text-muted-foreground">
                                                            Click to view full topic details
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination info and controls */}
            {topics.length > 0 && (
                <div className="mt-12">
                    <p className="text-center text-sm text-muted-foreground mb-4">
                        Showing {((currentPage - 1) * 50) + 1}–{Math.min(currentPage * 50, totalCount)} of {totalCount} topics
                    </p>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                    />
                </div>
            )}

            {topics.length === 0 && (
                <div className="py-24 text-center">
                    <Hash className="mx-auto h-16 w-16 text-muted-foreground/20" />
                    <p className="mt-4 text-muted-foreground">No topics available yet.</p>
                </div>
            )}
        </div>
    );
}
