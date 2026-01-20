'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Hash, Brain, Hand, Sparkles, BookText, FileText, Layers, TrendingUp, SortAsc } from 'lucide-react';
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
        if (savedView === 'grid' || savedView === 'list') {
            setView(savedView);
        } else if (isMobile) {
            setView('list');
        }
    }, [isMobile]);

    const handleViewChange = (newView: 'grid' | 'list') => {
        setView(newView);
        localStorage.setItem('topicsView', newView);
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
        <div className="space-y-12">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <SortAsc className="h-4 w-4 text-muted-foreground" />
                    <label htmlFor="sort-by" className="text-muted-foreground">Sort by:</label>
                    <select
                        id="sort-by"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'category' | 'popularity')}
                        className="bg-background border-none rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    >
                        <option value="name">Name</option>
                        <option value="category">Category</option>
                        <option value="popularity">Popularity</option>
                    </select>
                </div>
                <ViewToggle view={view} onViewChange={handleViewChange} />
            </div>

            <div className="space-y-16">
                {Object.entries(sortedGrouped).map(([category, items]) => {
                    const Icon = categoryIcons[category as keyof typeof categoryIcons] || Hash;
                    const colorClass = categoryColors[category as keyof typeof categoryColors] || categoryColors.other;

                    return (
                        <div key={category}>
                            <div className="mb-6 flex items-center gap-3">
                                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${colorClass}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <h2 className="text-xl font-semibold capitalize tracking-tight">{category}</h2>
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
                    <p className="text-center text-sm text-muted-foreground mb-4">
                        Showing {((currentPage - 1) * 50) + 1}–{Math.min(currentPage * 50, totalCount)} of {totalCount} topics
                    </p>
                    <Pagination currentPage={currentPage} totalPages={totalPages} />
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
