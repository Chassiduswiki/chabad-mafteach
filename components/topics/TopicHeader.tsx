'use client';

import { Topic } from '@/lib/directus';
import { useState, useEffect } from 'react';
import { ChevronUp, Home } from 'lucide-react';
import Link from 'next/link';

interface TopicHeaderProps {
    topic: Topic;
}

export function TopicHeader({ topic }: TopicHeaderProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
            setShowBackToTop(window.scrollY > 400);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            {/* Sticky Header - Enhanced for mobile context (Task 2.8) */}
            <div className={`sticky top-0 z-40 border-b transition-all duration-200 ${isScrolled ? 'border-border/40 bg-background/80 backdrop-blur-md' : 'border-transparent bg-transparent'
                }`}>
                <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                    <div className={`flex items-center gap-3 transition-opacity duration-200 ${isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {/* Home button on mobile */}
                        <Link
                            href="/topics"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors sm:hidden"
                        >
                            <Home className="h-4 w-4" />
                        </Link>
                        <div className="flex items-center gap-2 min-w-0">
                            <h2 className="text-base sm:text-lg font-semibold truncate">{topic.name}</h2>
                            {topic.name_hebrew && (
                                <span className="hidden sm:inline font-hebrew text-lg text-muted-foreground">{topic.name_hebrew}</span>
                            )}
                        </div>
                    </div>

                    {/* Back to top button */}
                    <button
                        onClick={scrollToTop}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 ${isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        aria-label="Back to top"
                    >
                        <ChevronUp className="h-5 w-5" />
                    </button>
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

            {/* Floating Back to Top Button for mobile (Task 2.8) */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 sm:hidden ${showBackToTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
                    }`}
                aria-label="Scroll to top"
            >
                <ChevronUp className="h-6 w-6" />
            </button>
        </>
    );
}

