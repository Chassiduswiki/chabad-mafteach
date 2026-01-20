'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Hash, Compass, Clock, ArrowRight, BookOpen, Search } from 'lucide-react';
import { ContentDiscovery } from '@/components/features/home/ContentDiscovery';
import { useSearch } from '@/lib/search-context';

interface LastTopic {
    slug: string;
    name: string;
    timestamp: number;
}

/**
 * MobileHome - Mobile-optimized homepage component
 * Task 2.11: App-like experience with quick actions and Continue Learning
 * Shows only on screens < 1024px
 */
export function MobileHome() {
    const [lastTopic, setLastTopic] = useState<LastTopic | null>(null);
    const { setOpen } = useSearch();

    useEffect(() => {
        // Check for last visited topic in localStorage
        const stored = localStorage.getItem('chabad-mafteach:last-topic');
        if (stored) {
            try {
                const parsed: LastTopic = JSON.parse(stored);
                // Check if not expired (7 days)
                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                if (parsed.timestamp > sevenDaysAgo) {
                    setLastTopic(parsed);
                } else {
                    // Clean up expired entry
                    localStorage.removeItem('chabad-mafteach:last-topic');
                }
            } catch (e) {
                console.error('Failed to parse last topic', e);
            }
        }
    }, []);

    return (
        <div className="mobile-hero-compact w-full px-4 pb-32">
            {/* Compact Hero */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6 text-center"
            >
                <h1 className="text-2xl font-bold text-foreground mb-2">
                    Welcome Back
                </h1>
                <p className="text-sm text-muted-foreground">
                    Explore Chassidic wisdom
                </p>
            </motion.div>

            {/* Compact Search Trigger */}
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                onClick={() => setOpen(true)}
                className="mb-8 w-full flex items-center gap-3 rounded-2xl border border-border bg-background/60 backdrop-blur-sm px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-background/80 active:scale-[0.98]"
                style={{ minHeight: '44px' }}
            >
                <Search className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Search topics, sources...</span>
                <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">⌘K</kbd>
                </div>
            </motion.button>

            {/* Continue Learning Section */}
            {lastTopic && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="mb-8"
                >
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Continue Learning
                    </h2>
                    <Link
                        href={`/topics/${lastTopic.slug}`}
                        className="group block rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
                        style={{ minHeight: '60px' }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-medium text-primary">Pick up where you left off</span>
                                </div>
                                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {lastTopic.name}
                                </h3>
                            </div>
                            <ArrowRight className="h-5 w-5 text-primary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                        </div>
                    </Link>
                </motion.div>
            )}

            {/* Quick Action Cards */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mb-8"
            >
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    {/* Browse Topics Card */}
                    <Link
                        href="/topics"
                        className="quick-action-card group flex flex-col items-start justify-between rounded-2xl border border-border bg-background/40 p-4 transition-all hover:border-primary/20 hover:bg-background/60 hover:shadow-lg active:scale-[0.98]"
                        style={{ minHeight: '80px' }}
                    >
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                            <Hash className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="w-full">
                            <h3 className="text-sm font-semibold text-foreground mb-0.5">Browse Topics</h3>
                            <p className="text-xs text-muted-foreground">All concepts</p>
                        </div>
                        <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-primary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                    </Link>

                    {/* Explore Categories Card */}
                    {/* <Link
                        href="/explore"
                        className="quick-action-card group flex flex-col items-start justify-between rounded-2xl border border-border bg-background/40 p-4 transition-all hover:border-primary/20 hover:bg-background/60 hover:shadow-lg active:scale-[0.98]"
                        style={{ minHeight: '80px' }}
                    >
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                            <Compass className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div className="w-full">
                            <h3 className="text-sm font-semibold text-foreground mb-0.5">Explore</h3>
                            <p className="text-xs text-muted-foreground">By category</p>
                        </div>
                        <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-primary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                    </Link> */}

                    {/* Recent Sources Card */}
                    {/* <Link
                        href="/seforim"
                        className="quick-action-card group flex flex-col items-start justify-between rounded-2xl border border-border bg-background/40 p-4 transition-all hover:border-primary/20 hover:bg-background/60 hover:shadow-lg active:scale-[0.98]"
                        style={{ minHeight: '80px' }}
                    >
                        <div className="absolute top-4 right-4 opacity-0 transition-all group-hover:opacity-100">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="w-full">
                            <h3 className="text-sm font-semibold text-foreground mb-0.5">Sources</h3>
                            <p className="text-xs text-muted-foreground">Browse documents</p>
                        </div>
                        <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-primary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                    </Link> */}

                    {/* Recent Activity Card */}
                    <Link
                        href="/topics"
                        className="quick-action-card group flex flex-col items-start justify-between rounded-2xl border border-border bg-background/40 p-4 transition-all hover:border-primary/20 hover:bg-background/60 hover:shadow-lg active:scale-[0.98]"
                        style={{ minHeight: '80px' }}
                    >
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                            <Clock className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="w-full">
                            <h3 className="text-sm font-semibold text-foreground mb-0.5">Recent</h3>
                            <p className="text-xs text-muted-foreground">Updated topics</p>
                        </div>
                        <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-primary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </motion.div>

            {/* Featured Content - Compact Mode */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
            >
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Discover
                </h2>
                <ContentDiscovery variant="compact" />
            </motion.div>
        </div>
    );
}
