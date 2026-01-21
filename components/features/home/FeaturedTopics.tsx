'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { TopicCardSkeleton } from '@/components/skeletons/TopicCardSkeleton';
import { useFeaturedTopics } from '@/lib/hooks/useTopics';

/**
 * FeaturedTopics - Replaces generic marketing cards with real topics
 * Task 2.13: Replace marketing copy with actual platform content
 * Shows 3 random published topics with real data
 */
export function FeaturedTopics() {
    const { data: topics, isLoading, error } = useFeaturedTopics();

    if (isLoading) {
        return (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
                {[1, 2, 3].map(i => (
                    <TopicCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (error) {
        console.error('Error loading featured topics:', error);
        return (
            <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Unable to load featured topics</p>
            </div>
        );
    }

    if (!topics || topics.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No featured topics available</p>
            </div>
        );
    }

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
                    className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 p-6 backdrop-blur-sm shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-background/80 hover:shadow-lg hover:shadow-primary/10"
                    aria-label={`View ${topic.name} topic`}
                >
                    {/* Category badge */}
                    <div className="mb-4 flex items-center gap-2">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        {topic.category && (
                            <span className="text-xs font-semibold text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                {topic.category}
                            </span>
                        )}
                    </div>

                    {/* Topic name */}
                    <h3 className="mb-2 text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {topic.name}
                    </h3>

                    {/* Hebrew name */}
                    {topic.name_hebrew && (
                        <p className="mb-3 text-lg font-semibold text-muted-foreground">
                            {topic.name_hebrew}
                        </p>
                    )}

                    {/* Short description */}
                    {topic.definition_short && (
                        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2 mb-4">
                            {topic.definition_short.replace(/<[^>]*>/g, '')}
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
                    <div className="absolute bottom-6 right-6 opacity-0 transition-all duration-200 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                        <ArrowRight className="h-5 w-5 text-primary" />
                    </div>
                </Link>
            ))}
        </motion.div>
    );
}

