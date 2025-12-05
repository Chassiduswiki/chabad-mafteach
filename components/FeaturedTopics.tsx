'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';

interface TopicWithStats {
    id: number;
    name: string;
    name_hebrew?: string;
    slug: string;
    category?: string;
    definition_short?: string;
    citation_count?: number;
}

/**
 * FeaturedTopics - Replaces generic marketing cards with real topics
 * Task 2.13: Replace marketing copy with actual platform content
 * Shows 3 random published topics with real data
 */
export function FeaturedTopics() {
    const [topics, setTopics] = useState<TopicWithStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/topics?mode=featured&limit=3')
            .then(res => res.json())
            .then(data => setTopics(data.topics || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse rounded-2xl border border-border bg-muted/20 p-8 h-64" />
                ))}
            </div>
        );
    }

    if (!topics || topics.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6"
        >
            {topics.slice(0, 3).map((topic, i) => (
                <Link
                    key={topic.id}
                    href={`/topics/${topic.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-background/40 p-8 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:bg-background/60 hover:shadow-xl hover:shadow-primary/5"
                >
                    {/* Category badge */}
                    <div className="mb-4 flex items-center gap-2">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        {topic.category && (
                            <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted/50 rounded-full">
                                {topic.category}
                            </span>
                        )}
                    </div>

                    {/* Topic name */}
                    <h3 className="mb-2 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {topic.name}
                    </h3>

                    {/* Hebrew name */}
                    {topic.name_hebrew && (
                        <p className="mb-3 font-hebrew text-base text-muted-foreground">
                            {topic.name_hebrew}
                        </p>
                    )}

                    {/* Short description */}
                    {topic.definition_short && (
                        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2 mb-4">
                            {topic.definition_short}
                        </p>
                    )}

                    {/* Source count */}
                    {topic.citation_count !== undefined && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                            <Sparkles className="h-3.5 w-3.5" />
                            {topic.citation_count} {topic.citation_count === 1 ? 'source' : 'sources'}
                        </div>
                    )}

                    {/* Hover arrow */}
                    <div className="absolute bottom-6 right-6 opacity-0 transition-all transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                        <ArrowRight className="h-5 w-5 text-primary" />
                    </div>
                </Link>
            ))}
        </motion.div>
    );
}
