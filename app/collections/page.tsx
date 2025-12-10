'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, X, BookOpen, ExternalLink } from 'lucide-react';

interface BookmarkedTopic {
    id: string;
    slug: string;
    name: string;
    canonical_title?: string;
    description?: string;
    timestamp: number;
}

export default function CollectionsPage() {
    const [bookmarks, setBookmarks] = useState<BookmarkedTopic[]>([]);

    useEffect(() => {
        // Load bookmarks from localStorage
        const stored = localStorage.getItem('chabad-mafteach:bookmarks');
        if (stored) {
            try {
                const parsed: BookmarkedTopic[] = JSON.parse(stored);
                // Filter out bookmarks older than 30 days
                const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                const validBookmarks = parsed.filter(b => b.timestamp > thirtyDaysAgo);
                setBookmarks(validBookmarks);

                // Update localStorage if we filtered any
                if (validBookmarks.length !== parsed.length) {
                    localStorage.setItem('chabad-mafteach:bookmarks', JSON.stringify(validBookmarks));
                }
            } catch (e) {
                console.error('Failed to parse bookmarks', e);
                localStorage.removeItem('chabad-mafteach:bookmarks');
            }
        }
    }, []);

    const removeBookmark = (topicId: string) => {
        const updated = bookmarks.filter(b => b.id !== topicId);
        setBookmarks(updated);
        localStorage.setItem('chabad-mafteach:bookmarks', JSON.stringify(updated));
    };

    if (bookmarks.length === 0) {
        return (
            <div className="min-h-screen bg-background text-foreground pb-32 pt-20 px-5">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <Bookmark className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">My Collections</h1>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Save topics you're studying and build your personal collection of Chassidic concepts.
                        </p>
                    </div>

                    <div className="text-center py-12">
                        <BookOpen className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium mb-2 text-muted-foreground">No saved topics yet</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                            Start exploring topics and click the bookmark icon to save them here for quick access.
                        </p>
                        <Link
                            href="/topics"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <BookOpen className="w-4 h-4" />
                            Explore Topics
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-32 pt-20 px-5">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My Collections</h1>
                    <p className="text-muted-foreground">
                        {bookmarks.length} saved topic{bookmarks.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {bookmarks.map((topic) => (
                        <div key={topic.id} className="group relative p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
                            <button
                                onClick={() => removeBookmark(topic.id)}
                                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                                title="Remove from collection"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <Link href={`/topics/${topic.slug}`} className="block">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground truncate">
                                            {topic.canonical_title || topic.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Added {new Date(topic.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {topic.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                        {topic.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-primary font-medium">
                                        View Topic
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
