'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';

interface Recommendation {
    id: number;
    title: string;
    slug: string;
    category: string;
    description?: string;
    reason: 'same_category' | 'related';
}

interface TopicRecommendationsProps {
    topicId: number;
    limit?: number;
}

export function TopicRecommendations({ topicId, limit = 4 }: TopicRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecommendations();
    }, [topicId]);

    const fetchRecommendations = async () => {
        try {
            const response = await fetch(`/api/recommendations?topicId=${topicId}&limit=${limit}`);
            const data = await response.json();
            setRecommendations(data.recommendations || []);
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return null; // Don't show section if no recommendations
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Recommended Topics</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {recommendations.map((rec) => (
                    <Link
                        key={rec.id}
                        href={`/topics/${rec.slug}`}
                        className="group block p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                    {rec.title}
                                </h4>
                                {rec.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                        {rec.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                        {rec.category}
                                    </span>
                                    {rec.reason === 'related' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                            <TrendingUp className="w-3 h-3" />
                                            Related
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </div>

            {recommendations.length >= limit && (
                <div className="text-center pt-2">
                    <Link
                        href={`/topics?category=${recommendations[0]?.category}`}
                        className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors"
                    >
                        View more in {recommendations[0]?.category}
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            )}
        </div>
    );
}
