'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import { usePopup } from '@/lib/popup-context';
import { fuzzyMatchCitation, hasHebrewBooksLink, CitationMatch } from '@/lib/citation-matcher';
import { getHebrewBooksUrl } from '@/lib/hebrewbooks';
import { TopicCitation, Location, Sefer } from '@/lib/types';
import { BasePopup } from '@/components/ui/BasePopup';

interface FootnotePopupProps {
    footnoteText: string;
    position: { x: number; y: number };
    availableCitations?: (TopicCitation & { location: Location; sefer: Sefer })[];
    onViewSource?: (citationId: number) => void;
}

export function FootnotePopup({
    footnoteText,
    position,
    availableCitations = [],
    onViewSource
}: FootnotePopupProps) {
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
        <BasePopup
            onClose={closePopup}
            triggerPosition={position}
            positionOptions={{ maxWidth: 320, offset: { y: 10 } }}
            className="w-80"
            contentClassName="space-y-3 p-4"
            header={
                <div className="flex items-center gap-2">
                    <span className="text-lg">📖</span>
                    <span className="font-medium text-muted-foreground text-sm">
                        Citation {match && `(${Math.round(match.confidence)}% match)`}
                    </span>
                </div>
            }
            footer="Press Esc to close"
        >
            {isLoading ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
            ) : (
                <>
                    {/* Original footnote text */}
                    <p className="text-foreground text-sm leading-relaxed">
                        {footnoteText}
                    </p>

                    {/* Level 1: Full match - show quoted text */}
                    {displayLevel === 1 && match && (
                        <div className="pt-3 border-t border-border space-y-2">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-3 w-3 text-amber-600" />
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Matched Citation
                                </span>
                            </div>

                            {/* Display quoted text */}
                            {match.citation.quoted_text_hebrew && (
                                <blockquote className="pr-3 font-serif text-right text-foreground leading-relaxed border-r-2 border-amber-500/30 text-sm">
                                    {match.citation.quoted_text_hebrew}
                                </blockquote>
                            )}

                            {match.citation.quoted_text_english && (
                                <blockquote className="pl-3 text-muted-foreground italic leading-relaxed border-l-2 border-amber-500/30 text-sm">
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
                    <div className="flex gap-3 pt-2">
                        {/* View Full Source - Level 1 only */}
                        {displayLevel === 1 && match && onViewSource && (
                            <button
                                onClick={handleViewSource}
                                className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-400 transition-colors font-medium"
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
                    </div>
                </>
            )}
        </BasePopup>
    );
}
