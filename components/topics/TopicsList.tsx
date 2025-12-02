'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Hash, Brain, Hand, Sparkles, BookText } from 'lucide-react';
import { Topic } from '@/lib/directus';
import { ViewToggle } from '@/components/ViewToggle';
import Pagination from './Pagination';

interface TopicsListProps {
    topics: Topic[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
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

    // Load preference from localStorage on mount
    useEffect(() => {
        const savedView = localStorage.getItem('topicsView');
        if (savedView === 'grid' || savedView === 'list') {
            setView(savedView);
        }
    }, []);

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

    return (
        <div className="space-y-8">
            {/* Controls */}
            <div className="flex justify-end">
                <ViewToggle view={view} onViewChange={handleViewChange} />
            </div>

            {/* Content */}
            <div className="space-y-16">
                {Object.entries(grouped).map(([category, items]) => {
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
                                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                                    : "space-y-3"
                            }>
                                {items.map((topic) => (
                                    <Link
                                        key={topic.id}
                                        href={`/topics/${topic.slug}`}
                                        className={
                                            view === 'grid'
                                                ? `group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClass} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5`
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
                                                {topic.name_hebrew && (
                                                    <span className="text-sm text-muted-foreground font-hebrew">
                                                        {topic.name_hebrew}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </Link>
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
