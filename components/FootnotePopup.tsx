'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, ExternalLink, BookOpen } from 'lucide-react';
import { usePopup } from '@/lib/popup-context';
import { fuzzyMatchCitation, hasHebrewBooksLink, CitationMatch } from '@/lib/citation-matcher';
import { getHebrewBooksUrl } from '@/lib/hebrewbooks';
import { TopicCitation, Location, Sefer } from '@/lib/types';

interface FootnotePopupProps {
    footnoteId: string;
    footnoteText: string;
    position: { x: number; y: number };
    availableCitations?: (TopicCitation & { location: Location; sefer: Sefer })[];
    onViewSource?: (citationId: number) => void;
}

export function FootnotePopup({
    footnoteId,
    footnoteText,
    position,
    availableCitations = [],
    onViewSource
}: FootnotePopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);
    const { closePopup } = usePopup();
    const [match, setMatch] = useState<CitationMatch | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Attempt to match citation on mount
    useEffect(() => {
        setIsLoading(true);

        if (availableCitations.length > 0) {
            const foundMatch = fuzzyMatchCitation(footnoteText, availableCitations);
            setMatch(foundMatch);
        }

        setIsLoading(false);
    }, [footnoteText, availableCitations]);

    // Determine display level based on match quality
    const displayLevel = match
        ? match.confidence >= 50
            ? 1 // Full match: show quoted text + HebrewBooks
            : hasHebrewBooksLink(match.citation.sefer)
                ? 2 // Sefer exists: show HebrewBooks only
                : 3 // No match: plain text
        : 3; // No match: plain text

    const handleViewSource = () => {
        if (match && onViewSource) {
            onViewSource(match.citation.id);
        }
        closePopup();
    };

    const handleHebrewBooks = () => {
        if (match && hasHebrewBooksLink(match.citation.sefer)) {
            const url = getHebrewBooksUrl(
                match.citation.sefer.hebrewbooks_id!,
                match.citation.location.reference_text
            );
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" />

            {/* Popup */}
            <div
                ref={popupRef}
                className="fixed z-50 w-[90vw] max-w-md bg-background border border-border rounded-xl shadow-2xl"
                style={{
                    left: `${Math.min(position.x, window.innerWidth - 400)}px`,
                    top: `${Math.min(position.y + 10, window.innerHeight - 300)}px`,
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📖</span>
                        <span className="font-semibold text-sm text-muted-foreground">
                            Citation {match && `(${Math.round(match.confidence)}% match)`}
                        </span>
                    </div>
                    <button
                        onClick={closePopup}
                        className="p-1 hover:bg-muted rounded-md transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground">Loading...</div>
                    ) : (
                        <>
                            {/* Original footnote text */}
                            <p className="text-sm text-foreground leading-relaxed">
                                {footnoteText}
                            </p>

                            {/* Level 1: Full match - show quoted text */}
                            {displayLevel === 1 && match && (
                                <div className="pt-3 border-t border-border space-y-2">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Matched Citation
                                        </span>
                                    </div>

                                    {/* Display quoted text */}
                                    {match.citation.quoted_text_hebrew && (
                                        <blockquote className="pr-3 font-hebrew text-right text-sm leading-relaxed border-r-2 border-primary/30">
                                            {match.citation.quoted_text_hebrew}
                                        </blockquote>
                                    )}

                                    {match.citation.quoted_text_english && (
                                        <blockquote className="pl-3 text-sm leading-relaxed border-l-2 border-primary/30 text-muted-foreground italic">
                                            {match.citation.quoted_text_english}
                                        </blockquote>
                                    )}

                                    {/* Source attribution */}
                                    <p className="text-xs text-muted-foreground">
                                        — {match.citation.sefer.title}, {match.citation.location.reference_text}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t border-border">
                                {/* View Full Source - Level 1 only */}
                                {displayLevel === 1 && match && onViewSource && (
                                    <button
                                        onClick={handleViewSource}
                                        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                                    >
                                        <BookOpen className="h-3 w-3" />
                                        View Full Source
                                    </button>
                                )}

                                {/* HebrewBooks Link - Level 1 & 2 */}
                                {(displayLevel === 1 || displayLevel === 2) && match && hasHebrewBooksLink(match.citation.sefer) && (
                                    <button
                                        onClick={handleHebrewBooks}
                                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        HebrewBooks →
                                    </button>
                                )}

                                {/* Level 3: No actions, just footnote text */}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer hint */}
                <div className="px-4 pb-3 text-xs text-muted-foreground text-center">
                    Press Esc to close
                </div>
            </div>
        </>
    );
}
