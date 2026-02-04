import { NextRequest, NextResponse } from 'next/server';
import { getBookBySlug } from '@/lib/api/source-books';
import { getChapterPageRange } from '@/lib/source-links';
import { handleApiError } from '@/lib/utils/api-errors';

/**
 * GET /api/source-links/[bookSlug]/chapters
 *
 * Returns all chapters for a book with their page ranges.
 * Designed to be fetched once and cached client-side so the
 * citation UI can do page→chapter lookups without extra round-trips.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ bookSlug: string }> }
) {
    try {
        const { bookSlug } = await params;

        const book = await getBookBySlug(bookSlug);
        if (!book) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        const chapters = (book.chapters || []).map(ch => {
            const range = getChapterPageRange(ch);
            return {
                id: ch.id,
                sort: ch.sort,
                chapter_number: ch.chapter_number,
                chapter_name: ch.chapter_name,
                chapter_name_english: ch.chapter_name_english,
                start_page: range?.start ?? null,
                end_page: range?.end ?? null,
                has_chabad_org: ch.chabad_org_article_id != null,
                has_lahak: ch.lahak_content_id != null,
                has_sefaria: ch.sefaria_ref != null,
            };
        });

        return NextResponse.json({
            book: {
                slug: book.slug,
                canonical_name: book.canonical_name,
                hebrew_name: book.hebrew_name,
                reference_style: book.reference_style,
                total_pages: book.total_pages,
            },
            chapters,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
