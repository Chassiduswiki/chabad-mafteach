'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePopup } from '@/lib/popup-context';
import { BasePopup } from '@/components/ui/BasePopup';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UI } from '@/lib/constants';

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
    onClose?: () => void;
}

export function InstantLookup({ term, position, onClose }: InstantLookupProps) {
    const [data, setData] = useState<LookupData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { closePopup: contextClosePopup } = usePopup();

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            contextClosePopup();
        }
    };

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
                handleClose();
                router.push(`/topics/${data.slug}`);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data, router]);

    // If not loaded yet, don't render anything (or render loading state in popup?)
    // The original code returned null if !data && !loading.
    // But we want to show loading state inside the popup.
    // So we should render BasePopup immediately.

    return (
        <BasePopup
            onClose={handleClose}
            triggerPosition={position}
            positionOptions={{
                maxWidth: UI.POPUP.MAX_WIDTH_DESKTOP,
                offset: { x: 0, y: 20 }
            }}
            className="w-full max-w-md"
            contentClassName="p-0"
        >
            <div className="relative overflow-hidden rounded-lg">
                {loading ? (
                    <div className="p-8 text-center">
                        <LoadingSpinner size="md" className="mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Looking up...</p>
                    </div>
                ) : !data?.found ? (
                    <div className="p-8 text-center">
                        <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-foreground">Term not found</p>
                        <p className="mt-1 text-xs text-muted-foreground">"{term}" isn't in our database yet</p>
                        <button
                            onClick={handleClose}
                            className="mt-4 text-xs text-primary hover:underline"
                        >
                            Close
                        </button>
                    </div>
                ) : (
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
                                    handleClose();
                                    router.push(`/topics/${data.slug}`);
                                }}
                                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                            >
                                <Sparkles className="h-4 w-4" />
                                2-min Overview
                            </button>
                            <button
                                onClick={() => {
                                    handleClose();
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
                )}
            </div>
        </BasePopup>
    );
}
