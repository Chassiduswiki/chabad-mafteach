'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

interface PlatformLink {
    key: string;
    label: string;
    url: string;
}

// Display metadata per platform
const PLATFORM_META: Record<string, { label: string; description: string }> = {
    hebrewbooks: { label: 'HebrewBooks', description: 'PDF scan' },
    chabad_org: { label: 'Chabad.org', description: 'Torah texts' },
    lahak: { label: 'Lahak', description: "Rebbe's Torah" },
    chabadlibrary: { label: 'ChabadLibrary', description: 'Digital library' },
    sefaria: { label: 'Sefaria', description: 'Structured text' },
};

interface ResolvedChapter {
    chapter_name?: string | null;
    chapter_name_english?: string | null;
    start_page?: number | null;
    end_page?: number | null;
}

interface SourceLinksSectionProps {
    sourceTitle: string | null;
    reference: string | null;
}

/**
 * Extracts a page number from a citation reference string.
 * Handles: "p. 45", "page 45", "ע׳ 45", "45a", plain "45"
 */
function extractPage(reference: string | null): number | null {
    if (!reference) return null;

    // "p. 45" / "page 45" / "pg. 45"
    const pageMatch = reference.match(/(?:p(?:age|g)?\.?\s*)(\d+)/i);
    if (pageMatch) return parseInt(pageMatch[1], 10);

    // Hebrew page indicator "ע׳ 45" or "עמ׳ 45"
    const hebrewPageMatch = reference.match(/(?:ע(?:מ)?[׳'])?\s*(\d+)/);
    if (hebrewPageMatch) return parseInt(hebrewPageMatch[1], 10);

    // Folio like "45a" or "45b" — take the numeric part
    const folioMatch = reference.match(/(\d+)[ab]?\b/);
    if (folioMatch) return parseInt(folioMatch[1], 10);

    return null;
}

/**
 * Extracts a chapter number from a citation reference string.
 * Handles: "Chapter 3", "Ch. 3", "פרק ג"
 */
function extractChapter(reference: string | null): number | null {
    if (!reference) return null;

    const chapterMatch = reference.match(/(?:chapter|ch\.?)\s*(\d+)/i);
    if (chapterMatch) return parseInt(chapterMatch[1], 10);

    // Hebrew: "פרק" followed by a number or Hebrew numeral
    const hebrewNumerals: Record<string, number> = {
        'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
        'י': 10, 'יא': 11, 'יב': 12, 'יג': 13, 'יד': 14, 'טו': 15, 'טז': 16,
    };
    const hebrewChapterMatch = reference.match(/פרק\s+([א-ט]{1,2}[׳']?)/);
    if (hebrewChapterMatch) {
        const cleaned = hebrewChapterMatch[1].replace(/[׳']/g, '');
        return hebrewNumerals[cleaned] ?? null;
    }

    return null;
}

/**
 * Self-contained section that resolves a citation's source title to
 * multi-platform links via the source-links API. Renders nothing if
 * the source isn't in the catalog.
 */
export function SourceLinksSection({ sourceTitle, reference }: SourceLinksSectionProps) {
    const [links, setLinks] = useState<PlatformLink[]>([]);
    const [resolvedChapter, setResolvedChapter] = useState<ResolvedChapter | null>(null);
    const [loading, setLoading] = useState(false);
    const [bookSlug, setBookSlug] = useState<string | null>(null);

    useEffect(() => {
        if (!sourceTitle) return;

        let cancelled = false;
        setLoading(true);

        // Step 1: look up whether this title has a source book
        fetch(`/api/source-links/lookup?title=${encodeURIComponent(sourceTitle)}`)
            .then(res => res.json())
            .then(data => {
                if (cancelled || !data.book?.slug) {
                    setLoading(false);
                    return;
                }

                const slug = data.book.slug;
                setBookSlug(slug);

                // Step 2: resolve page or chapter
                const page = extractPage(reference);
                const chapter = extractChapter(reference);

                let resolveUrl = `/api/source-links/${slug}`;
                if (page) {
                    resolveUrl += `?page=${page}`;
                } else if (chapter) {
                    resolveUrl += `?chapter=${chapter}`;
                }

                return fetch(resolveUrl)
                    .then(res => res.json())
                    .then(resolved => {
                        if (cancelled) return;

                        const platformLinks: PlatformLink[] = Object.entries(resolved.links || {})
                            .filter(([, url]) => url)
                            .map(([key, url]) => ({
                                key,
                                label: PLATFORM_META[key]?.label ?? key,
                                url: url as string,
                            }));

                        setLinks(platformLinks);
                        setResolvedChapter(resolved.resolved_chapter);
                        setLoading(false);
                    });
            })
            .catch(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [sourceTitle, reference]);

    // Nothing to show if no book found and not loading
    if (!loading && links.length === 0) return null;

    return (
        <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Read on
            </label>

            {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 border border-border rounded-lg px-4 py-2.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Resolving links...</span>
                </div>
            )}

            {!loading && links.length > 0 && (
                <div className="space-y-1.5">
                    {resolvedChapter?.chapter_name && (
                        <p className="text-xs text-muted-foreground mb-2">
                            {resolvedChapter.chapter_name}
                            {resolvedChapter.chapter_name_english && (
                                <span className="opacity-70"> — {resolvedChapter.chapter_name_english}</span>
                            )}
                            {resolvedChapter.start_page != null && resolvedChapter.end_page != null && (
                                <span className="opacity-70"> (pp. {resolvedChapter.start_page}–{resolvedChapter.end_page})</span>
                            )}
                        </p>
                    )}
                    {links.map(link => (
                        <a
                            key={link.key}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 bg-muted/30 border border-border rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors"
                        >
                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="flex-1">{link.label}</span>
                            <span className="text-xs text-muted-foreground">
                                {PLATFORM_META[link.key]?.description}
                            </span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
