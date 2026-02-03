/**
 * Source Links Utility Library
 *
 * Handles URL generation for multi-platform source linking and
 * Chabad.org API sync for auto-populating chapter data.
 */

import type { SourceBook, SourceBookChapter, PlatformLinks } from '../types';

// ============ URL Generation =============

/**
 * Generate HebrewBooks URL for a specific page
 */
export function hebrewBooksPageUrl(book: SourceBook, page: number): string | null {
    if (!book.hebrewbooks_id) return null;
    const pdfPage = page + (book.hebrewbooks_offset || 0);
    return `https://hebrewbooks.org/pdfpager.aspx?req=${book.hebrewbooks_id}&pgnum=${pdfPage}`;
}

/**
 * Generate HebrewBooks URL for book info page
 */
export function hebrewBooksBookUrl(book: SourceBook): string | null {
    if (!book.hebrewbooks_id) return null;
    return `https://hebrewbooks.org/${book.hebrewbooks_id}`;
}

/**
 * Generate Chabad.org URL for a chapter
 */
export function chabadOrgChapterUrl(chapter: SourceBookChapter): string | null {
    if (!chapter.chabad_org_article_id) return null;
    return `https://www.chabad.org/torah-texts/${chapter.chabad_org_article_id}`;
}

/**
 * Generate Chabad.org URL for book root
 */
export function chabadOrgBookUrl(book: SourceBook): string | null {
    if (!book.chabad_org_root_id) return null;
    return `https://www.chabad.org/torah-texts/${book.chabad_org_root_id}`;
}

/**
 * Generate Lahak.org URL for a chapter
 */
export function lahakChapterUrl(chapter: SourceBookChapter): string | null {
    if (!chapter.lahak_content_id) return null;
    return `https://lahak.org/${chapter.lahak_content_id}`;
}

/**
 * Generate Lahak.org URL for book root
 */
export function lahakBookUrl(book: SourceBook): string | null {
    if (!book.lahak_root_id) return null;
    return `https://lahak.org/${book.lahak_root_id}`;
}

/**
 * Generate ChabadLibrary URL for book
 */
export function chabadLibraryBookUrl(book: SourceBook): string | null {
    if (!book.chabadlibrary_id) return null;
    return `https://chabadlibrary.org/books/${book.chabadlibrary_id}`;
}

/**
 * Generate Sefaria URL for a chapter
 */
export function sefariaChapterUrl(chapter: SourceBookChapter): string | null {
    if (!chapter.sefaria_ref) return null;
    return `https://www.sefaria.org/${encodeURIComponent(chapter.sefaria_ref)}?lang=bi`;
}

/**
 * Generate Sefaria URL for book root
 */
export function sefariaBookUrl(book: SourceBook): string | null {
    if (!book.sefaria_slug) return null;
    return `https://www.sefaria.org/${encodeURIComponent(book.sefaria_slug)}?tab=contents`;
}

// ============ Page/Chapter Resolution =============

/**
 * Find which chapter contains a given page number
 */
export function getChapterPageRange(
    chapter: SourceBookChapter
): { start: number; end: number } | null {
    const start = chapter.hebrewbooks_start_page ?? chapter.start_page;
    const end = chapter.hebrewbooks_end_page ?? chapter.end_page;
    if (!start || !end) return null;
    if (start <= 0 || end <= 0) return null;
    if (start > end) return null;
    return { start, end };
}

export function getChapterForPage(
    chapters: SourceBookChapter[],
    page: number
): SourceBookChapter | null {
    return chapters.find(ch => {
        const range = getChapterPageRange(ch);
        return range ? page >= range.start && page <= range.end : false;
    }) || null;
}

/**
 * Get page range for a chapter
 */
export function getPagesForChapter(
    chapter: SourceBookChapter
): { start: number; end: number } | null {
    return getChapterPageRange(chapter);
}

/**
 * Generate all available platform links for a specific page
 */
export function getLinksForPage(book: SourceBook, page: number): PlatformLinks {
    const chapters = book.chapters || [];
    const chapter = getChapterForPage(chapters, page);

    return {
        hebrewbooks: hebrewBooksPageUrl(book, page) || undefined,
        chabad_org: chapter ? chabadOrgChapterUrl(chapter) || undefined : undefined,
        lahak: chapter ? lahakChapterUrl(chapter) || undefined : undefined,
        chabadlibrary: chabadLibraryBookUrl(book) || undefined, // book-level only
        sefaria: chapter ? sefariaChapterUrl(chapter) || undefined : undefined,
    };
}

/**
 * Generate all available platform links for a chapter
 */
export function getLinksForChapter(
    book: SourceBook,
    chapter: SourceBookChapter
): PlatformLinks {
    const range = getChapterPageRange(chapter);
    return {
        hebrewbooks: range?.start
            ? hebrewBooksPageUrl(book, range.start) || undefined
            : hebrewBooksBookUrl(book) || undefined,
        chabad_org: chabadOrgChapterUrl(chapter) || undefined,
        lahak: lahakChapterUrl(chapter) || undefined,
        chabadlibrary: chabadLibraryBookUrl(book) || undefined,
        sefaria: sefariaChapterUrl(chapter) || undefined,
    };
}

/**
 * Generate all available platform links for a book (root level)
 */
export function getLinksForBook(book: SourceBook): PlatformLinks {
    return {
        hebrewbooks: hebrewBooksBookUrl(book) || undefined,
        chabad_org: chabadOrgBookUrl(book) || undefined,
        lahak: lahakBookUrl(book) || undefined,
        chabadlibrary: chabadLibraryBookUrl(book) || undefined,
        sefaria: sefariaBookUrl(book) || undefined,
    };
}

// ============ Page Boundary Validation ============

export type PageBoundaryStatus = 'pending' | 'valid' | 'overlap' | 'missing' | 'invalid';

export interface PageBoundaryOverlap {
    current: SourceBookChapter;
    next: SourceBookChapter;
    currentRange: { start: number; end: number };
    nextRange: { start: number; end: number };
}

const chapterSortValue = (chapter: SourceBookChapter) => {
    if (typeof chapter.sort === 'number') return chapter.sort;
    if (typeof chapter.chapter_number === 'number') return chapter.chapter_number;
    return Number.MAX_SAFE_INTEGER;
};

export function validatePageBoundaries(chapters: SourceBookChapter[]): {
    overlaps: PageBoundaryOverlap[];
    statusById: Record<string, PageBoundaryStatus>;
} {
    const statusById: Record<string, PageBoundaryStatus> = {};
    const overlaps: PageBoundaryOverlap[] = [];

    chapters.forEach(chapter => {
        statusById[chapter.id] = 'pending';
    });

    const withRanges = chapters.map(chapter => {
        const range = getChapterPageRange(chapter);
        if (!range) {
            const start = chapter.hebrewbooks_start_page ?? chapter.start_page;
            const end = chapter.hebrewbooks_end_page ?? chapter.end_page;
            if (start && end && start > end) {
                statusById[chapter.id] = 'invalid';
            } else {
                statusById[chapter.id] = 'missing';
            }
        } else {
            statusById[chapter.id] = 'valid';
        }
        return {
            chapter,
            range,
            sortKey: range?.start ?? chapterSortValue(chapter),
        };
    });

    const ordered = [...withRanges].sort((a, b) => {
        if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
        return chapterSortValue(a.chapter) - chapterSortValue(b.chapter);
    });

    for (let i = 0; i < ordered.length - 1; i += 1) {
        const current = ordered[i];
        const next = ordered[i + 1];
        if (!current.range || !next.range) continue;
        if (current.range.end >= next.range.start) {
            overlaps.push({
                current: current.chapter,
                next: next.chapter,
                currentRange: current.range,
                nextRange: next.range,
            });
            statusById[current.chapter.id] = 'overlap';
            statusById[next.chapter.id] = 'overlap';
        }
    }

    return { overlaps, statusById };
}

// ============ Chabad.org API Sync =============

interface ChabadOrgNavigationChild {
    'article-id': number;
    'hebrew-title'?: string;
    'hebrew-title-2'?: string;
    'toc-hebrew-title'?: string;
    'parent-id'?: number;
}

interface ChabadOrgNavigationResponse {
    'article-id': number;
    'hebrew-title'?: string;
    children?: ChabadOrgNavigationChild[];
}

/**
 * Fetch chapter structure from Chabad.org API
 */
export async function fetchChabadOrgChapters(
    rootId: number
): Promise<{ chapters: Partial<SourceBookChapter>[]; error?: string }> {
    try {
        const response = await fetch(
            `https://www.chabad.org/api/v2/chabadorg/torahtexts/book-navigation/${rootId}`
        );

        if (!response.ok) {
            return { chapters: [], error: `API returned ${response.status}` };
        }

        const data: ChabadOrgNavigationResponse = await response.json();

        if (!data.children || !Array.isArray(data.children)) {
            return { chapters: [], error: 'No children found in response' };
        }

        const chapters: Partial<SourceBookChapter>[] = data.children.map((child, index) => ({
            sort: index + 1,
            chapter_name: child['hebrew-title'] || child['toc-hebrew-title'] || '',
            chabad_org_article_id: child['article-id'],
        }));

        return { chapters };
    } catch (error) {
        return {
            chapters: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Sync chapters from Chabad.org for a book
 * Returns the chapters that should be created/updated
 */
export async function syncChabadOrgChapters(
    book: SourceBook
): Promise<{ chapters: Partial<SourceBookChapter>[]; error?: string }> {
    if (!book.chabad_org_root_id) {
        return { chapters: [], error: 'Book has no chabad_org_root_id' };
    }

    return fetchChabadOrgChapters(book.chabad_org_root_id);
}
