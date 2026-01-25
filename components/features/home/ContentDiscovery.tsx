'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { TopicCardSkeleton } from '@/components/skeletons/TopicCardSkeleton';

import { Topic, TopicCitation, Location, Sefer } from '@/lib/types';

interface RecentSource extends Omit<Partial<TopicCitation>, 'location' | 'topic'> {
    location?: Location & { sefer?: Sefer };
    topic?: Topic;
}

interface FeaturedData {
    featuredTopic: Topic | null;
    recentSources: RecentSource[];
    recentTopics: Topic[];
}

interface ContentDiscoveryProps {
    variant?: 'full' | 'compact'; // default: 'full'
}

/**
 * ContentDiscovery - Homepage content preview sections
 * Displays: Featured Topic, Recent Sources, Recently Updated
 * Per Task 2.5: Add content previews to balance search with discovery
 * Task 2.11: Added compact variant for mobile homepage
 */
export function ContentDiscovery({ variant = 'full' }: ContentDiscoveryProps) {
    const [data, setData] = useState<FeaturedData | null>(null);
    const [loading, setLoading] = useState(true);

    const isCompact = variant === 'compact';
    const gridCols = isCompact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3';
    const itemLimit = isCompact ? 2 : 3;

    const [error, setError] = useState(false);

    const loadData = () => {
        setLoading(true);
        setError(false);
        fetch('/api/topics?mode=discovery')
            .then(res => res.json())
            .then(setData)
            .catch(err => {
                console.error('Failed to load discovery content:', err);
                setError(true);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        Promise.resolve().then(() => loadData());
    }, []);

    if (loading) {
        return (
            <div className={`grid ${gridCols} gap-6`}>
                {(isCompact ? [1, 2] : [1, 2, 3]).map(i => (
                    <TopicCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-muted-foreground mb-4">Unable to load content</p>
                <button 
                    onClick={loadData}
                    className="text-sm text-primary hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: isCompact ? 0 : 0.6 }}
            className={`grid ${gridCols} gap-6`}
        >
            {/* Featured Topic */}
            {data.featuredTopic && (
                <Link
                    href={`/topics/${data.featuredTopic.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 p-6 backdrop-blur-sm shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-background/80 hover:shadow-lg hover:shadow-primary/10"
                >
                    <div className="mb-4 flex items-center gap-2 text-xs font-medium text-primary">
                        <Sparkles className="h-4 w-4" />
                        Featured Topic
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {data.featuredTopic.name}
                    </h3>
                    {data.featuredTopic.name_hebrew && (
                        <p className="mb-3 text-lg font-semibold text-muted-foreground">
                            {data.featuredTopic.name_hebrew}
                        </p>
                    )}
                    {data.featuredTopic.definition_short && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {data.featuredTopic.definition_short.replace(/<[^>]*>/g, '')}
                        </p>
                    )}
                    <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-primary opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1" />
                </Link>
            )}

            {/* Recent Sources */}
            {/* {(data.recentSources || []).length > 0 && (
                <div className="rounded-2xl border border-border bg-background/40 p-6">
                    <div className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        New Seforim
                    </div>
                    <ul className="space-y-3">
                        {(data.recentSources || []).slice(0, itemLimit).map((source) => (
                            <li key={source.id}>
                                <Link
                                    href={`/topics/${source.topic?.slug || ''}`}
                                    className="group block"
                                >
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                        {source.location?.sefer?.title || 'Source'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {source.location?.order_key} → {source.topic?.name}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )} */}

            {/* Recently Updated */}
            <div className="rounded-2xl border border-border/50 bg-background/60 p-6 backdrop-blur-sm shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Recently Updated
                </div>
                <ul className="space-y-3">
                    {(data.recentTopics || []).slice(0, isCompact ? 3 : 4).map((topic) => (
                        <li key={topic.id}>
                            <Link
                                href={`/topics/${topic.slug}`}
                                className="group flex items-center justify-between"
                            >
                                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    {topic.name}
                                </span>
                                {topic.category && (
                                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                                        {topic.category}
                                    </span>
                                )}
                            </Link>
                        </li>
                    ))}
                    {(!data.recentTopics || data.recentTopics.length === 0) && (
                        <li className="text-sm text-muted-foreground">No recent updates</li>
                    )}
                </ul>
                <Link
                    href="/topics"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                    Browse all topics <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        </motion.div>
    );
}
