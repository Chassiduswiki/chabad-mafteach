'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, ArrowRight, BookOpen, Share2, Check } from 'lucide-react';

interface TopicCollection {
    id: string;
    title: string;
    slug: string;
    description?: string;
    topicCount: number;
}

interface FeaturedCollectionsProps {
    limit?: number;
}

export function FeaturedCollections({ limit = 3 }: FeaturedCollectionsProps) {
    const [collections, setCollections] = useState<TopicCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharedId, setSharedId] = useState<string | null>(null);

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            const response = await fetch('/api/topic-collections?featured=true');
            const data = await response.json();
            setCollections((data.collections || []).slice(0, limit));
        } catch (error) {
            console.error('Failed to fetch collections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async (collection: TopicCollection) => {
        const shareUrl = `${window.location.origin}/topics/collection/${collection.slug}`;

        try {
            if (navigator.share) {
                // Use native share API on mobile
                await navigator.share({
                    title: collection.title,
                    text: collection.description || `Check out this study collection: ${collection.title}`,
                    url: shareUrl
                });
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(shareUrl);
                setSharedId(collection.id);
                setTimeout(() => setSharedId(null), 2000);
            }
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };

    if (loading) {
        return (
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (collections.length === 0) {
        return null; // Don't show section if no collections
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Study Collections</h2>
                </div>
                <Link
                    href="/collections"
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                    View all
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection) => (
                    <Link
                        key={collection.id}
                        href={`/topics/collection/${collection.slug}`}
                        className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                        {collection.title}
                                    </h3>
                                    {collection.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                            {collection.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                    <BookOpen className="w-3 h-3" />
                                    {collection.topicCount}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{collection.topicCount} topics</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleShare(collection);
                                        }}
                                        className="p-1 hover:bg-muted/50 rounded transition-colors"
                                        title="Share collection"
                                    >
                                        {sharedId === collection.id ? (
                                            <Check className="w-3 h-3 text-green-600" />
                                        ) : (
                                            <Share2 className="w-3 h-3" />
                                        )}
                                    </button>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* Subtle gradient overlay on hover */}
                        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-xl" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
