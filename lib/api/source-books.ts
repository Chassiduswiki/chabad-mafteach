/**
 * Source Books API - Business Logic Layer
 *
 * Handles reads for source_books and source_book_chapters.
 * URL generation and page↔chapter resolution live in lib/source-links/index.ts.
 */

import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import type { SourceBook, SourceBookChapter } from '@/lib/types';

const BOOK_FIELDS = [
    'id',
    'status',
    'canonical_name',
    'hebrew_name',
    'slug',
    'alternate_names',
    'author',
    'year_written',
    'category',
    'reference_style',
    'total_pages',
    'notes',
    'hebrewbooks_id',
    'hebrewbooks_offset',
    'chabad_org_root_id',
    'chabad_org_synced_at',
    'lahak_root_id',
    'chabadlibrary_id',
    'sefaria_slug',
    'date_created',
    'date_updated',
];

const CHAPTER_FIELDS = [
    'id',
    'book_id',
    'sort',
    'chapter_number',
    'chapter_name',
    'chapter_name_english',
    'start_page',
    'end_page',
    'hebrewbooks_start_page',
    'hebrewbooks_end_page',
    'page_validation_status',
    'chabad_org_article_id',
    'lahak_content_id',
    'sefaria_ref',
    'date_created',
    'date_updated',
];

/**
 * List all published source books, ordered by name.
 */
export async function listBooks(): Promise<SourceBook[]> {
    const directus = createClient();

    const books = await directus.request(
        readItems('source_books' as any, {
            filter: { status: { _eq: 'published' } },
            fields: BOOK_FIELDS,
            sort: ['canonical_name'],
            limit: -1,
        } as any)
    ) as unknown as SourceBook[];

    return Array.isArray(books) ? books : [];
}

/**
 * Get a single source book by slug, with its chapters loaded and sorted.
 * Returns null if not found or not published.
 */
export async function getBookBySlug(slug: string): Promise<SourceBook | null> {
    const directus = createClient();
    const normalizedSlug = slug.toLowerCase();

    const books = await directus.request(
        readItems('source_books' as any, {
            filter: {
                _and: [
                    { slug: { _eq: normalizedSlug } },
                    { status: { _eq: 'published' } },
                ],
            },
            fields: BOOK_FIELDS,
            limit: 1,
        } as any)
    ) as unknown as SourceBook[];

    const book = Array.isArray(books) && books.length > 0 ? books[0] : null;
    if (!book) return null;

    const chapters = await getChaptersForBook(book.id);
    return { ...book, chapters };
}

/**
 * Get all chapters for a book, sorted by position.
 */
export async function getChaptersForBook(bookId: string): Promise<SourceBookChapter[]> {
    const directus = createClient();

    const chapters = await directus.request(
        readItems('source_book_chapters' as any, {
            filter: { book_id: { _eq: bookId } },
            fields: CHAPTER_FIELDS,
            sort: ['sort', 'chapter_number'],
            limit: -1,
        } as any)
    ) as unknown as SourceBookChapter[];

    return Array.isArray(chapters) ? chapters : [];
}
