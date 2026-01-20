'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Share2, Headphones, Bookmark } from 'lucide-react';
import Link from 'next/link';

interface ArticleHeroProps {
    title: string;
    titleHebrew: string;
    category?: string;
    definitionShort?: string;
    onScrollProgress?: (progress: number) => void;
}

export function ImmersiveHero({
    title,
    titleHebrew,
    category = "General Concept",
    definitionShort
}: ArticleHeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    // Parallax & Opacity transforms
    const yHero = useTransform(scrollY, [0, 300], [0, 100]);
    const opacityHero = useTransform(scrollY, [0, 250], [1, 0]);
    const scaleHero = useTransform(scrollY, [0, 300], [1, 0.95]);

    // Nav Bar State (appears after scroll)
    const navOpacity = useTransform(scrollY, [200, 300], [0, 1]);
    const navY = useTransform(scrollY, [200, 300], [-20, 0]);

    return (
        <>
            {/* Sticky Minimal Nav (Hidden initially) */}
            <motion.div
                style={{ opacity: navOpacity, y: navY }}
                className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border/50 z-40 flex items-center justify-between px-4 sm:px-6 pointer-events-none data-[visible=true]:pointer-events-auto"
            >
                <div className="flex items-center gap-3">
                    <Link href="/topics" className="p-2 -ml-2 hover:bg-muted/50 rounded-full transition-colors pointer-events-auto">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <span className="font-semibold text-lg">{title}</span>
                </div>
                <div className="flex gap-2 pointer-events-auto">
                    <button className="p-2 hover:bg-muted/50 rounded-full transition-colors">
                        <Headphones className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 hover:bg-muted/50 rounded-full transition-colors">
                        <Share2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            </motion.div>

            {/* Immersive Hero Area */}
            <div ref={containerRef} className="relative min-h-[60vh] sm:min-h-[50vh] flex flex-col justify-center overflow-hidden bg-gradient-to-b from-background via-background/50 to-background">
                {/* Dynamic Background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    {/* Hebrew Watermark */}
                    <motion.div
                        style={{ y: yHero, opacity: 0.1 }}
                        className="absolute right-[-10%] top-[10%] text-[20vw] sm:text-[15vw] font-hebrew font-bold leading-none text-foreground select-none"
                    >
                        {titleHebrew}
                    </motion.div>

                    {/* Ambient Glows */}
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[100px] rounded-full" />
                    <div className="absolute bottom-[0%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[100px] rounded-full" />
                </div>

                {/* Content */}
                <motion.div
                    style={{ opacity: opacityHero, scale: scaleHero }}
                    className="relative z-10 px-6 sm:px-8 max-w-4xl mx-auto w-full pt-20 pb-12"
                >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 sm:gap-12 relative">
                        <div className="w-full space-y-6">
                            {/* Breadcrumbs / Category */}
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                <Link href="/topics" className="hover:text-primary transition-colors">Topics</Link>
                                <span>/</span>
                                <span className="text-primary">{category}</span>
                            </div>

                            {/* Title Block */}
                            <div>
                                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground mb-2">
                                    {title}
                                </h1>
                                <p className="text-3xl sm:text-4xl font-hebrew text-muted-foreground">
                                    {titleHebrew}
                                </p>
                            </div>

                            {/* Intro / Short Def */}
                            {definitionShort && (
                                <p className="text-lg sm:text-xl leading-relaxed text-muted-foreground max-w-xl">
                                    {definitionShort}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                    <Headphones className="w-4 h-4" />
                                    <span>Listen</span>
                                </button>
                                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted/50 hover:bg-muted border border-border text-foreground font-medium transition-colors">
                                    <Bookmark className="w-4 h-4" />
                                    <span>Save</span>
                                </button>
                                <button className="p-2.5 rounded-full bg-muted/30 hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
