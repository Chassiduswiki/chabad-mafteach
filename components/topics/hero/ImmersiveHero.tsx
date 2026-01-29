'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Share2, Headphones, Bookmark, BookmarkCheck, ChevronDown, Check, Loader2, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface ArticleHeroProps {
    title: string;
    titleHebrew: string;
    titleTransliteration?: string;
    category?: string;
    definitionShort?: string;
    topicSlug?: string;
    onScrollProgress?: (progress: number) => void;
    isAuthorized?: boolean;
}

export function ImmersiveHero({
    title,
    titleHebrew,
    titleTransliteration,
    category = "General Concept",
    definitionShort,
    topicSlug,
    isAuthorized = false
}: ArticleHeroProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isScholarly, setIsScholarly] = useState(false);
    const definitionRef = useRef<HTMLParagraphElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    // Check if topic is saved on mount and load scholarly preference
    useEffect(() => {
        if (topicSlug) {
            const savedTopics = JSON.parse(localStorage.getItem('savedTopics') || '[]');
            setIsSaved(savedTopics.includes(topicSlug));
        }

        const scholarlyPref = localStorage.getItem('scholarlyView') === 'true';
        setIsScholarly(scholarlyPref);
    }, [topicSlug]);

    const handleSave = () => {
        if (!topicSlug) return;
        const savedTopics = JSON.parse(localStorage.getItem('savedTopics') || '[]');
        if (isSaved) {
            const filtered = savedTopics.filter((s: string) => s !== topicSlug);
            localStorage.setItem('savedTopics', JSON.stringify(filtered));
            setIsSaved(false);
        } else {
            savedTopics.push(topicSlug);
            localStorage.setItem('savedTopics', JSON.stringify(savedTopics));
            setIsSaved(true);
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        const url = window.location.href;
        const shareData = { title: `${title} - Chabad Maftaiach`, text: definitionShort || `Learn about ${title}`, url };

        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(url);
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 2000);
            }
        } catch (err) {
            // User cancelled or error
            console.log('Share cancelled');
        }
        setIsSharing(false);
    };

    const handleListen = () => {
        if ('speechSynthesis' in window) {
            if (isListening) {
                window.speechSynthesis.cancel();
                setIsListening(false);
            } else {
                const text = definitionShort?.replace(/<[^>]*>/g, '') || `${title}. ${category} concept.`;
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.onend = () => setIsListening(false);
                utterance.onerror = () => setIsListening(false);
                window.speechSynthesis.speak(utterance);
                setIsListening(true);
            }
        }
    };

    // Parallax & Opacity transforms
    const yHero = useTransform(scrollY, [0, 300], [0, 100]);
    const opacityHero = useTransform(scrollY, [0, 250], [1, 0]);
    const scaleHero = useTransform(scrollY, [0, 300], [1, 0.95]);

    useEffect(() => {
        if (definitionRef.current) {
            // Check if the text is overflowing (i.e., it's clamped)
            setIsTruncated(definitionRef.current.scrollHeight > definitionRef.current.clientHeight);
        }
    }, [definitionShort]);

    return (
        <>
            {/* Immersive Hero Area */}
            <div ref={containerRef} className="relative min-h-[50vh] sm:min-h-[40vh] flex flex-col justify-center bg-gradient-to-b from-background via-background/50 to-background">
                {/* Dynamic Background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    {/* Hebrew Watermark */}
                    <motion.div
                        style={{ y: yHero, opacity: 0.08 }}
                        className="absolute right-[-10%] top-[10%] text-[20vw] sm:text-[15vw] font-hebrew font-bold leading-none text-foreground select-none blur-lg"
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
                                    {titleTransliteration || title}
                                </h1>
                                {titleHebrew && (
                                    <p className="text-3xl sm:text-4xl font-hebrew text-muted-foreground">
                                        {titleHebrew}
                                    </p>
                                )}
                            </div>

                            {/* Intro / Short Def */}
                            {definitionShort && (() => {
                                const cleanDefinition = definitionShort.replace(/<[^>]*>/g, '');
                                return (
                                    <div>
                                        <p
                                            ref={definitionRef}
                                            className={`text-lg sm:text-xl leading-relaxed text-muted-foreground max-w-xl transition-all duration-300 ${!isExpanded ? 'line-clamp-3' : ''}`}>
                                            {cleanDefinition}
                                        </p>
                                        {isTruncated && (
                                            <button
                                                onClick={() => setIsExpanded(!isExpanded)}
                                                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-2">
                                                {isExpanded ? 'See Less' : 'See More'}
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                <button
                                    onClick={handleListen}
                                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all shadow-lg ${isListening ? 'bg-primary/80 text-primary-foreground shadow-primary/30' : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'}`}
                                    aria-label={isListening ? 'Stop listening' : 'Listen to topic'}
                                >
                                    {isListening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Headphones className="w-4 h-4" />}
                                    <span>{isListening ? 'Playing...' : 'Listen'}</span>
                                </button>
                                <button
                                    onClick={handleSave}
                                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border font-medium transition-all ${isSaved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-muted/50 hover:bg-muted border-border text-foreground'}`}
                                    aria-label={isSaved ? 'Remove from saved' : 'Save topic'}
                                >
                                    {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="p-2.5 rounded-full bg-muted/30 hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors relative"
                                    aria-label="Share topic"
                                >
                                    {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : shareSuccess ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
                                </button>

                                {isAuthorized && topicSlug && (
                                    <Link
                                        href={`/editor/topics/${topicSlug}`}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-bold uppercase tracking-wider text-xs transition-all"
                                    >
                                        Edit Topic
                                    </Link>
                                )}

                                <button
                                    onClick={() => {
                                        const newState = !isScholarly;
                                        setIsScholarly(newState);
                                        localStorage.setItem('scholarlyView', newState.toString());
                                        window.dispatchEvent(new CustomEvent('scholarly-view-change', { detail: { show: newState } }));
                                    }}
                                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border font-medium transition-all ${isScholarly ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' : 'bg-muted/50 hover:bg-muted border-border text-foreground'}`}
                                    aria-label="Toggle scholarly view"
                                >
                                    <GraduationCap className="w-4 h-4" />
                                    <span>{isScholarly ? 'Scholarly' : 'Standard'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
