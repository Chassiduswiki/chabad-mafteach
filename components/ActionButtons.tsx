'use client';

import { useState, useEffect } from 'react';
import { Share2, Bookmark, Check } from 'lucide-react';

interface ActionButtonsProps {
    topicSlug: string;
    topicName: string;
}

export function ActionButtons({ topicSlug, topicName }: ActionButtonsProps) {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showCopied, setShowCopied] = useState(false);

    // Load bookmark state from localStorage
    useEffect(() => {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedTopics') || '[]');
        setIsBookmarked(bookmarks.includes(topicSlug));
    }, [topicSlug]);

    const handleShare = async () => {
        const url = window.location.href;

        try {
            // Try native share API first (mobile)
            if (navigator.share) {
                await navigator.share({
                    title: `${topicName} - Chabad Mafteach`,
                    url: url,
                });
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(url);
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
            }
        } catch (error) {
            // Silent fail or show error message
            console.error('Share failed:', error);
        }
    };

    const handleBookmark = () => {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedTopics') || '[]');

        if (isBookmarked) {
            // Remove bookmark
            const updated = bookmarks.filter((slug: string) => slug !== topicSlug);
            localStorage.setItem('bookmarkedTopics', JSON.stringify(updated));
            setIsBookmarked(false);
        } else {
            // Add bookmark
            const updated = [...bookmarks, topicSlug];
            localStorage.setItem('bookmarkedTopics', JSON.stringify(updated));
            setIsBookmarked(true);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Share Button */}
            <button
                onClick={handleShare}
                className="group relative rounded-full p-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                title="Share topic"
                aria-label="Share topic"
            >
                <Share2 className="h-4 w-4" />

                {/* Copied toast */}
                {showCopied && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs whitespace-nowrap flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2">
                        <Check className="h-3 w-3" />
                        Link copied!
                    </div>
                )}
            </button>

            {/* Bookmark Button */}
            <button
                onClick={handleBookmark}
                className={`group relative rounded-full p-2 transition-all ${isBookmarked
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark topic'}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark topic'}
            >
                <Bookmark
                    className={`h-4 w-4 transition-all ${isBookmarked ? 'fill-current' : ''}`}
                />
            </button>
        </div>
    );
}
