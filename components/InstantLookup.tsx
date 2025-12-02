'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePopup } from '@/lib/popup-context';

interface LookupData {
    found: boolean;
    term?: string;
    hebrew?: string;
    quickDefinition?: string;
    fullDefinition?: string;
    slug?: string;
}

interface InstantLookupProps {
    term: string;
    position: { x: number; y: number };
}

export function InstantLookup({ term, position }: InstantLookupProps) {
    const [data, setData] = useState<LookupData | null>(null);
    const [loading, setLoading] = useState(true);
    const popupRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { closePopup } = usePopup();

    // Fetch definition
    useEffect(() => {
        async function fetchDefinition() {
            try {
                const response = await fetch(`/api/lookup?term=${encodeURIComponent(term)}`);
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Lookup failed:', error);
                setData({ found: false });
            } finally {
                setLoading(false);
            }
        }
        fetchDefinition();
    }, [term]);

    // Handle Enter key to navigate
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Enter' && data?.slug) {
                closePopup();
                router.push(`/topics/${data.slug}`);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data, router]);

    // Calculate popup position (prevent overflow)
    const getPopupStyle = () => {
        const maxWidth = 400;
        const maxHeight = 300;
        const padding = 16;

        let x = position.x;
        let y = position.y + 20; // Offset below cursor

        // Prevent horizontal overflow
        if (x + maxWidth > window.innerWidth - padding) {
            x = window.innerWidth - maxWidth - padding;
        }
        if (x < padding) {
            x = padding;
        }

        // Prevent vertical overflow
        if (y + maxHeight > window.innerHeight - padding) {
            y = position.y - maxHeight - 10; // Position above cursor
        }

        return { left: x, top: y };
    };

    if (!data && !loading) return null;

    return createPortal(
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
                onClick={closePopup}
            />

            {/* Popup */}
            <motion.div
                key="popup"
                ref={popupRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                style={{
                    position: 'fixed',
                    ...getPopupStyle(),
                    zIndex: 51
                }}
                className="w-full max-w-md"
            >
                <div className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-primary/20 ring-1 ring-white/10">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <p className="text-sm text-muted-foreground">Looking up...</p>
                        </div>
                    ) : !data?.found ? (
                        <div className="p-8 text-center">
                            <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm font-medium text-foreground">Term not found</p>
                            <p className="mt-1 text-xs text-muted-foreground">"{term}" isn't in our database yet</p>
                            <button
                                onClick={closePopup}
                                className="mt-4 text-xs text-primary hover:underline"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Close button */}
                            <button
                                onClick={closePopup}
                                className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* Content */}
                            <div className="p-6">
                                {/* Title */}
                                <div className="mb-4 pr-8">
                                    <h3 className="text-xl font-bold text-foreground">
                                        {data.term}
                                    </h3>
                                    {data.hebrew && (
                                        <p className="mt-1 font-hebrew text-lg text-muted-foreground dir-rtl">
                                            {data.hebrew}
                                        </p>
                                    )}
                                </div>

                                {/* Quick Definition */}
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {data.quickDefinition}
                                </p>

                                {/* Action Buttons */}
                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => {
                                            // TODO: Open side panel with full overview
                                            closePopup();
                                            router.push(`/topics/${data.slug}`);
                                        }}
                                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        2-min Overview
                                    </button>
                                    <button
                                        onClick={() => {
                                            closePopup();
                                            router.push(`/topics/${data.slug}`);
                                        }}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        Full Topic →
                                    </button>
                                </div>

                                {/* Keyboard Hints */}
                                <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                                    <span><kbd className="rounded bg-muted px-1.5 py-0.5">ESC</kbd> to close</span>
                                    <span><kbd className="rounded bg-muted px-1.5 py-0.5">↵</kbd> to open</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
