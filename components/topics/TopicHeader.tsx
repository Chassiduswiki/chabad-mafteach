'use client';

import { Topic } from '@/lib/directus';
import { useState, useEffect } from 'react';

interface TopicHeaderProps {
    topic: Topic;
}

export function TopicHeader({ topic }: TopicHeaderProps) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* Sticky Header */}
            <div className={`sticky top-0 z-40 border-b transition-all duration-200 ${isScrolled ? 'border-border/40 bg-background/80 backdrop-blur-md' : 'border-transparent bg-transparent'
                }`}>
                <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
                    <div className={`flex items-center gap-4 transition-opacity duration-200 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
                        <h2 className="text-lg font-semibold">{topic.name}</h2>
                        {topic.name_hebrew && (
                            <span className="font-hebrew text-lg text-muted-foreground">{topic.name_hebrew}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Header Content */}
            <div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-12">
                <div className="mb-6 mt-6">
                    <div className="mb-3 flex items-center gap-3">
                        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                            {topic.category || 'Concept'}
                        </span>
                        {topic.difficulty_level && (
                            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                                {topic.difficulty_level}
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {topic.name}
                    </h1>

                    {topic.name_hebrew && (
                        <p className="mt-1 font-hebrew text-xl text-muted-foreground dir-rtl">
                            {topic.name_hebrew}
                        </p>
                    )}

                    {/* At a Glance */}
                    <div className="mt-6">
                        {topic.definition_short && (
                            <p className="text-lg leading-relaxed text-muted-foreground max-w-3xl">
                                {topic.definition_short}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
