'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface FeaturedTopic {
    id: number;
    slug: string;
    canonical_title: string;
    name_hebrew?: string;
    description?: string;
    topic_type?: string;
}

export function FeaturedTopicCard() {
    const [topic, setTopic] = useState<FeaturedTopic | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/topics?mode=discovery')
            .then(res => res.json())
            .then(data => {
                if (data && data.featuredTopic) {
                    setTopic({
                        id: data.featuredTopic.id,
                        slug: data.featuredTopic.slug,
                        canonical_title: data.featuredTopic.name || data.featuredTopic.canonical_title,
                        name_hebrew: data.featuredTopic.name_hebrew,
                        description: data.featuredTopic.definition_short || data.featuredTopic.description,
                        topic_type: data.featuredTopic.category || data.featuredTopic.topic_type,
                    });
                }
            })
            .catch(err => {
                console.error('Error fetching featured topic:', err);
                // Optionally set an error state here if needed
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-6 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded mb-4" />
                <div className="h-6 w-48 bg-muted rounded mb-2" />
                <div className="h-4 w-full bg-muted rounded" />
            </div>
        );
    }

    if (!topic) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Link
                href={`/topics/${topic.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
            >
                {/* Decorative sparkle */}
                <div className="absolute top-4 right-4 text-primary/20 group-hover:text-primary/40 transition-colors">
                    <Sparkles className="h-8 w-8" />
                </div>

                {/* Badge */}
                <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                    <Sparkles className="h-3 w-3" />
                    Featured Concept
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                    {topic.canonical_title}
                </h3>

                {/* Hebrew name */}
                {topic.name_hebrew && (
                    <p className="font-hebrew text-lg text-muted-foreground mb-3">
                        {topic.name_hebrew}
                    </p>
                )}

                {/* Definitions */}
                {topic.description && (() => {
                    const content = topic.description;
                    let definitions: string[] = [];

                    // Check for <ul> tag for list format
                    if (content.includes('<ul>')) {
                        const items = content.match(/<li>(.*?)<\/li>/g) || [];
                        definitions = items.map(item => item.replace(/<[^>]*>/g, '').trim());
                    } 
                    // Check for numbered list format (e.g., "1. ... 2. ...")
                    else if (content.match(/\d\.\s/)) {
                        definitions = content.replace(/<[^>]*>/g, '').match(/\d+\..+?(?=\d+\.|$)/g) || [];
                    } 
                    // Fallback for plain text or other formats
                    else {
                        definitions = [content.replace(/<[^>]*>/g, '').trim()];
                    }

                    if (definitions.length === 0 || (definitions.length === 1 && !definitions[0])) {
                        return <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{content.replace(/<[^>]*>/g, '')}</p>;
                    }

                    return (
                        <div className="space-y-3 mb-4">
                            {definitions.slice(0, 3).map((def, idx) => (
                                <div key={idx} className="flex items-start gap-3 text-sm">
                                    <span className="font-semibold text-primary flex-shrink-0 pt-0.5">{idx + 1}.</span>
                                    <p className="text-muted-foreground leading-relaxed">{def.replace(/^\d+\.\s*/, '').trim()}</p>
                                </div>
                            ))}
                        </div>
                    );
                })()}

                {/* CTA */}
                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                    Explore this concept <ArrowRight className="h-4 w-4" />
                </div>
            </Link>
        </motion.div>
    );
}
