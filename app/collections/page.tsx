'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, X, BookOpen, ExternalLink, Search, Filter, Clock, Star } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

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
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <Breadcrumbs items={[{ label: 'Collections' }]} />
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-4xl mx-auto px-4 py-8 lg:py-16">
                    <div className="text-center">
                        {/* Icon */}
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mb-6 lg:mb-8 mx-auto">
                            <Bookmark className="w-10 h-10 lg:w-12 lg:h-12 text-primary" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3 lg:mb-4">
                            My Collections
                        </h1>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm lg:text-base max-w-md mx-auto mb-8 lg:mb-12">
                            Save topics you're studying and build your personal collection of Chassidic concepts.
                        </p>

                        {/* Empty State Card */}
                        <div className="bg-card border border-border rounded-xl p-6 lg:p-8 mb-8 lg:mb-12 max-w-md mx-auto">
                            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 lg:mb-6 mx-auto">
                                <BookOpen className="w-6 h-6 lg:w-8 lg:h-8 text-muted-foreground/60" />
                            </div>

                            <h3 className="text-base lg:text-lg font-semibold text-foreground mb-2 lg:mb-3">
                                No saved topics yet
                            </h3>

                            <p className="text-sm text-muted-foreground mb-6 lg:mb-8 max-w-xs mx-auto">
                                Start exploring topics and click the bookmark icon to save them here for quick access.
                            </p>

                            <Link
                                href="/topics"
                                className="inline-flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm lg:text-base"
                            >
                                <BookOpen className="w-4 h-4 lg:w-5 lg:h-5" />
                                Explore Topics
                            </Link>
                        </div>

                        {/* Tips */}
                        <div className="text-left max-w-md mx-auto">
                            <h4 className="text-sm font-semibold text-foreground mb-3 lg:mb-4 flex items-center gap-2">
                                <Star className="w-4 h-4 text-primary" />
                                How to use Collections
                            </h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                    Browse topics and click the bookmark icon to save
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                    Access your saved topics anytime for quick review
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                    Build your personal study collection over time
                                </li>
                            </ul>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Breadcrumbs items={[{ label: 'Collections' }]} />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
                {/* Header Section */}
                <div className="mb-6 lg:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                                My Collections
                            </h1>
                            <p className="text-muted-foreground text-sm lg:text-base">
                                {bookmarks.length} saved topic{bookmarks.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <Link
                                href="/topics"
                                className="inline-flex items-center gap-2 px-3 lg:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span className="hidden sm:inline">Browse Topics</span>
                                <span className="sm:hidden">Browse</span>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-card border border-border rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                    <Bookmark className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">{bookmarks.length}</div>
                                    <div className="text-sm text-muted-foreground">Saved Topics</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {bookmarks.length > 0 ? Math.round((Date.now() - Math.min(...bookmarks.map(b => b.timestamp))) / (1000 * 60 * 60 * 24)) : 0}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Days Active</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                    <Star className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {bookmarks.length > 0 ? Math.round(bookmarks.reduce((acc, b) => acc + (Date.now() - b.timestamp), 0) / bookmarks.length / (1000 * 60 * 60 * 24)) : 0}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Avg. Age (days)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bookmarks Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {bookmarks.map((topic) => (
                        <div key={topic.id} className="group relative bg-card border border-border rounded-xl hover:shadow-lg hover:border-primary/20 transition-all duration-200 overflow-hidden">
                            {/* Remove Button */}
                            <button
                                onClick={() => removeBookmark(topic.id)}
                                className="absolute top-3 right-3 z-10 w-8 h-8 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                title="Remove from collection"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <Link href={`/topics/${topic.slug}`} className="block p-5">
                                {/* Header */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground text-base leading-tight mb-1 line-clamp-2">
                                            {topic.canonical_title || topic.name}
                                        </h3>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            Added {new Date(topic.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {topic.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                                        {topic.description}
                                    </p>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        View Topic
                                    </span>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Bottom spacing for mobile */}
                <div className="h-20 lg:h-8"></div>
            </main>
        </div>
    );
}
