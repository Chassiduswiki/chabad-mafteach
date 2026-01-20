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
