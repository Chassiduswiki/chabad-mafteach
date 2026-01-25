'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, X, BookOpen, ExternalLink, Search, Filter, Clock, Star, Users, Sparkles } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CollectionDiscovery } from '@/components/collections/CollectionDiscovery';
import { cn } from '@/lib/utils';

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
    const [activeTab, setActiveTab] = useState('community');

    useEffect(() => {
        // Load bookmarks from localStorage
        const stored = localStorage.getItem('chabad-mafteach:bookmarks');
        if (stored) {
            try {
                const parsed: BookmarkedTopic[] = JSON.parse(stored);
                // Filter out bookmarks older than 30 days
                const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                const validBookmarks = parsed.filter(b => b.timestamp > thirtyDaysAgo);
                
                // Use a microtask to avoid synchronous setState warning
                Promise.resolve().then(() => setBookmarks(validBookmarks));

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

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Breadcrumbs items={[{ label: 'Collections' }]} />
                    <Link
                        href="/collections/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all font-bold text-xs shadow-lg shadow-primary/10"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Create Collection
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
                <div className="mb-10 text-center space-y-4">
                    <h1 className="text-4xl font-serif italic tracking-tight text-foreground">
                        Collections
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light leading-relaxed">
                        Curated journeys through Chassidic thought. Save topics, organize your study, and explore collections from the community.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="bg-muted/50 p-1 rounded-full border border-border/50">
                            <TabsTrigger value="community" className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Users className="w-4 h-4 mr-2" />
                                Community
                            </TabsTrigger>
                            <TabsTrigger value="personal" className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Bookmark className="w-4 h-4 mr-2" />
                                My Bookmarks ({bookmarks.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="community" className="animate-in fade-in duration-500">
                        <CollectionDiscovery />
                    </TabsContent>

                    <TabsContent value="personal" className="animate-in fade-in duration-500">
                        {bookmarks.length === 0 ? (
                            <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/50 max-w-2xl mx-auto">
                                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-6 mx-auto">
                                    <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">No saved topics yet</h3>
                                <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-sm">
                                    Start exploring topics and click the bookmark icon to save them for quick access.
                                </p>
                                <Link
                                    href="/topics"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all font-bold text-sm shadow-md"
                                >
                                    Explore Topics
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {bookmarks.map((topic) => (
                                        <div key={topic.id} className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden">
                                            <button
                                                onClick={() => removeBookmark(topic.id)}
                                                className="absolute top-3 right-3 z-10 w-8 h-8 bg-background/80 hover:bg-destructive/10 hover:text-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                title="Remove bookmark"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>

                                            <Link href={`/topics/${topic.slug}`} className="block p-6 space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                        <BookOpen className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                                            {topic.canonical_title || topic.name}
                                                        </h3>
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                                                            Added {new Date(topic.timestamp).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {topic.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-light italic">
                                                        {topic.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between pt-4 border-t border-border/30">
                                                    <span className="text-xs text-primary font-bold flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                                                        View Topic <ExternalLink className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
