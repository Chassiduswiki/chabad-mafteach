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
export function getChapterForPage(
    chapters: SourceBookChapter[],
    page: number
): SourceBookChapter | null {
    return chapters.find(
        ch => ch.start_page && ch.end_page && page >= ch.start_page && page <= ch.end_page
    ) || null;
}

/**
 * Get page range for a chapter
 */
export function getPagesForChapter(
    chapter: SourceBookChapter
): { start: number; end: number } | null {
    if (!chapter.start_page || !chapter.end_page) return null;
    return { start: chapter.start_page, end: chapter.end_page };
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
    return {
        hebrewbooks: chapter.start_page
            ? hebrewBooksPageUrl(book, chapter.start_page) || undefined
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
