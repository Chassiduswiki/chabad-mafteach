'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ChevronRight, X, ArrowRight, Sparkles, History, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { stripHtml } from '@/lib/utils/text';

interface RelatedTopic {
    slug: string;
    canonical_title: string;
    description?: string;
    topic_type?: string;
    relationship?: {
        type?: string;
        description?: string;
    };
}

interface DeepDiveModeProps {
    currentTopic: {
        slug: string;
        canonical_title: string;
    };
    relatedTopics: RelatedTopic[];
    isOpen: boolean;
    onClose: () => void;
}

export function DeepDiveMode({ currentTopic, relatedTopics, isOpen, onClose }: DeepDiveModeProps) {
    const [history, setHistory] = useState<RelatedTopic[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<RelatedTopic | null>(null);

    // Filter out topics without slugs
    const validTopics = relatedTopics.filter(t => t.slug && t.canonical_title);

    useEffect(() => {
        if (isOpen && validTopics.length > 0) {
            setSelectedTopic(validTopics[0]);
            setHistory([]);
        }
    }, [isOpen, validTopics]);

    // Auto-advance through topics
    useEffect(() => {
        if (!isAutoPlaying || !isOpen) return;

        const timer = setInterval(() => {
            setCurrentIndex(prev => {
                const next = (prev + 1) % validTopics.length;
                setSelectedTopic(validTopics[next]);
                return next;
            });
        }, 5000);

        return () => clearInterval(timer);
    }, [isAutoPlaying, isOpen, validTopics]);

    const handleSelectTopic = (topic: RelatedTopic, index: number) => {
        if (selectedTopic) {
            setHistory(prev => [...prev, selectedTopic]);
        }
        setSelectedTopic(topic);
        setCurrentIndex(index);
        setIsAutoPlaying(false);
    };

    const handleGoBack = () => {
        if (history.length > 0) {
            const prev = history[history.length - 1];
            setHistory(h => h.slice(0, -1));
            setSelectedTopic(prev);
            const idx = validTopics.findIndex(t => t.slug === prev.slug);
            if (idx >= 0) setCurrentIndex(idx);
        }
    };

    const handleNavigateToTopic = () => {
        if (selectedTopic) {
            window.location.href = `/topics/${selectedTopic.slug}`;
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                                <Compass className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="font-semibold">Deep Dive Mode</h2>
                                <p className="text-xs text-muted-foreground">
                                    Exploring from {currentTopic.canonical_title}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {history.length > 0 && (
                                <button
                                    onClick={handleGoBack}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Back
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Journey Path */}
                    {history.length > 0 && (
                        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto pb-2">
                            <History className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-shrink-0">{currentTopic.canonical_title}</span>
                            {history.map((h, i) => (
                                <React.Fragment key={h.slug}>
                                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                    <span className="flex-shrink-0 truncate max-w-[120px]">{h.canonical_title}</span>
                                </React.Fragment>
                            ))}
                            {selectedTopic && (
                                <>
                                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                    <span className="flex-shrink-0 text-foreground font-medium">{selectedTopic.canonical_title}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Main Featured Topic */}
                    <AnimatePresence mode="wait">
                        {selectedTopic && (
                            <motion.div
                                key={selectedTopic.slug}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="mb-8"
                            >
                                <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border border-primary/10">
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                            <Sparkles className="w-3 h-3" />
                                            {selectedTopic.topic_type || 'Concept'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {currentIndex + 1} of {validTopics.length}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-3xl font-bold mb-4">{selectedTopic.canonical_title}</h3>
                                    
                                    {selectedTopic.description && (
                                        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                                            {stripHtml(selectedTopic.description)}
                                        </p>
                                    )}

                                    {selectedTopic.relationship?.description && (
                                        <div className="p-4 bg-background/50 rounded-xl border border-border mb-6">
                                            <p className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">Connection:</span>{' '}
                                                {stripHtml(selectedTopic.relationship.description)}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleNavigateToTopic}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                    >
                                        Dive Into This Topic
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Topic Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                                Related Concepts
                            </h4>
                            <button
                                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                                    isAutoPlaying 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-muted text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {isAutoPlaying ? '⏸ Pause' : '▶ Auto-explore'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {validTopics.map((topic, index) => (
                                <motion.button
                                    key={topic.slug}
                                    onClick={() => handleSelectTopic(topic, index)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`p-4 rounded-xl text-left transition-all ${
                                        selectedTopic?.slug === topic.slug
                                            ? 'bg-primary/10 border-2 border-primary/30 ring-2 ring-primary/20'
                                            : 'bg-muted/30 border border-border hover:border-primary/30 hover:bg-muted/50'
                                    }`}
                                >
                                    <h5 className="font-medium text-sm mb-1 line-clamp-2">
                                        {topic.canonical_title}
                                    </h5>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {topic.relationship?.type || topic.topic_type || 'Related'}
                                    </p>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Progress Bar for Auto-play */}
                {isAutoPlaying && (
                    <div className="fixed bottom-0 left-0 right-0 h-1 bg-muted">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 5, ease: 'linear' }}
                            key={currentIndex}
                        />
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
