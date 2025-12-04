'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ArrowRight, Sparkles } from 'lucide-react';

interface FeaturedTopic {
    id: number;
    name: string;
    name_hebrew?: string;
    slug: string;
    category?: string;
    definition_short?: string;
}

interface RecentSource {
    id: number;
    excerpt?: string;
    location?: {
        display_name: string;
        sefer?: {
            title: string;
        };
    };
    topic?: {
        name: string;
        slug: string;
    };
}

interface RecentTopic {
    id: number;
    name: string;
    name_hebrew?: string;
    slug: string;
    category?: string;
}

interface FeaturedData {
    featuredTopic: FeaturedTopic | null;
    recentSources: RecentSource[];
    recentTopics: RecentTopic[];
}

/**
 * ContentDiscovery - Homepage content preview sections
 * Displays: Featured Topic, Recent Sources, Recently Updated
 * Per Task 2.5: Add content previews to balance search with discovery
 */
export function ContentDiscovery() {
    const [data, setData] = useState<FeaturedData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/featured')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse rounded-2xl border border-border bg-muted/20 p-6 h-48" />
                ))}
            </div>
        );
    }

    if (!data) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
            {/* Featured Topic */}
            {data.featuredTopic && (
                <Link
                    href={`/topics/${data.featuredTopic.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                    <div className="mb-4 flex items-center gap-2 text-xs font-medium text-primary">
                        <Sparkles className="h-4 w-4" />
                        Featured Topic
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {data.featuredTopic.name}
                    </h3>
                    {data.featuredTopic.name_hebrew && (
                        <p className="mb-3 font-hebrew text-lg text-muted-foreground">
                            {data.featuredTopic.name_hebrew}
                        </p>
                    )}
                    {data.featuredTopic.definition_short && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {data.featuredTopic.definition_short}
                        </p>
                    )}
                    <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-primary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                </Link>
            )}

            {/* Recent Sources */}
            <div className="rounded-2xl border border-border bg-background/40 p-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    New Sources
                </div>
                <ul className="space-y-3">
                    {(data.recentSources || []).slice(0, 3).map((source) => (
                        <li key={source.id}>
                            <Link
                                href={`/topics/${source.topic?.slug || ''}`}
                                className="group block"
                            >
                                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                    {source.location?.sefer?.title || 'Source'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {source.location?.display_name} → {source.topic?.name}
                                </p>
                            </Link>
                        </li>
                    ))}
                    {(!data.recentSources || data.recentSources.length === 0) && (
                        <li className="text-sm text-muted-foreground">No recent sources</li>
                    )}
                </ul>
                <Link
                    href="/seforim"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                    View all sources <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            {/* Recently Updated */}
            <div className="rounded-2xl border border-border bg-background/40 p-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Recently Updated
                </div>
                <ul className="space-y-3">
                    {(data.recentTopics || []).slice(0, 4).map((topic) => (
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
