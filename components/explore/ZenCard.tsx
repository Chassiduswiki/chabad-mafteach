'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Share2, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ZenCardProps {
    statement: {
        id: number;
        text: string;
        translated_text?: string | null;
        source: {
            document_title: string;
            document_id: number;
            paragraph_order?: string;
        };
    };
    onNext: () => void;
    onSave?: () => void;
    isLoading?: boolean;
}

export function ZenCard({ statement, onNext, onSave, isLoading }: ZenCardProps) {
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Chassidic Insight',
                    text: statement.text,
                    url: window.location.href,
                });
            } catch (err) {
                // User cancelled or error
            }
        }
    };

    const [dragX, setDragX] = useState(0);

    const handleDragEnd = (_: any, info: any) => {
        const threshold = 100;
        if (info.offset.x < -threshold) {
            onNext();
        }
        setDragX(0);
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={statement.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                drag="x"
                dragConstraints={{ left: -300, right: 0 }}
                onDrag={(_, info) => setDragX(info.offset.x)}
                onDragEnd={handleDragEnd}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-12 touch-none cursor-grab active:cursor-grabbing"
            >
                {/* Visual Feedback for swipe */}
                <motion.div 
                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ opacity: dragX < 0 ? Math.abs(dragX) / 150 : 0 }}
                >
                    <ArrowRight className="h-8 w-8 text-primary/40" />
                </motion.div>
                {/* Quote Container */}
                <div className="max-w-2xl w-full text-center space-y-8">
                    {/* Hebrew Text */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="font-hebrew text-2xl sm:text-3xl md:text-4xl leading-relaxed text-foreground"
                        dir="rtl"
                        lang="he"
                    >
                        {statement.text}
                    </motion.div>

                    {/* English Translation */}
                    {statement.translated_text && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-lg sm:text-xl text-muted-foreground leading-relaxed italic"
                        >
                            &quot;{statement.translated_text}&quot;
                        </motion.div>
                    )}

                    {/* Source Attribution */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="pt-4"
                    >
                        <Link
                            href={`/seforim/${statement.source.document_id}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                            — {statement.source.document_title}
                            {statement.source.paragraph_order && (
                                <span className="text-muted-foreground">
                                    {statement.source.paragraph_order}
                                </span>
                            )}
                        </Link>
                    </motion.div>
                </div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-4 mt-12"
                >
                    {/* Save Button */}
                    <button
                        onClick={onSave}
                        className="flex items-center gap-2 px-5 py-3 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                    >
                        <Bookmark className="h-5 w-5" />
                        <span className="text-sm font-medium">Save</span>
                    </button>

                    {/* Share Button */}
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-5 py-3 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                    >
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Share</span>
                    </button>

                    {/* Go to Source */}
                    <Link
                        href={`/seforim/${statement.source.document_id}`}
                        className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200"
                    >
                        <ArrowRight className="h-5 w-5" />
                        <span className="text-sm font-medium">Source</span>
                    </Link>
                </motion.div>

                {/* Next Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={onNext}
                    disabled={isLoading}
                    className="mt-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="text-sm">
                        {isLoading ? 'Loading...' : 'Next insight'}
                    </span>
                </motion.button>
            </motion.div>
        </AnimatePresence>
    );
}
