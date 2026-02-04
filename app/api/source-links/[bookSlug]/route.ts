import { NextRequest, NextResponse } from 'next/server';
import { getBookBySlug } from '@/lib/api/source-books';
import {
    getChapterForPage,
    getLinksForPage,
    getLinksForChapter,
    getLinksForBook,
} from '@/lib/source-links';
import { handleApiError } from '@/lib/utils/api-errors';

/**
 * GET /api/source-links/[bookSlug]
 *
 * Resolve a source book reference to multi-platform URLs.
 *
 * Query params (pick one, or omit both for book-level links):
 *   ?page=45       → resolve page to chapter, return links for that page
 *   ?chapter=3     → return links for chapter 3 (by sort order)
 *
 * Response shape:
 *   { links: PlatformLinks, resolved_chapter?: { ... } }
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ bookSlug: string }> }
) {
    try {
        const { bookSlug } = await params;
        const { searchParams } = new URL(request.url);

        const pageParam = searchParams.get('page');
        const chapterParam = searchParams.get('chapter');

        // Validate: can't specify both
        if (pageParam !== null && chapterParam !== null) {
            return NextResponse.json(
                { error: 'Specify either page or chapter, not both' },
                { status: 400 }
            );
        }

        // Validate numeric params if present
        if (pageParam !== null && (isNaN(Number(pageParam)) || Number(pageParam) < 1)) {
            return NextResponse.json(
                { error: 'page must be a positive integer' },
                { status: 400 }
            );
        }
        if (chapterParam !== null && (isNaN(Number(chapterParam)) || Number(chapterParam) < 1)) {
            return NextResponse.json(
                { error: 'chapter must be a positive integer' },
                { status: 400 }
            );
        }

        const book = await getBookBySlug(bookSlug);
        if (!book) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        const chapters = book.chapters || [];

        // --- Page resolution mode ---
        if (pageParam !== null) {
            const page = Number(pageParam);
            const links = getLinksForPage(book, page);
            const chapter = getChapterForPage(chapters, page);

            return NextResponse.json({
                links,
                resolved_chapter: chapter
                    ? {
                          id: chapter.id,
                          sort: chapter.sort,
                          chapter_number: chapter.chapter_number,
                          chapter_name: chapter.chapter_name,
                          chapter_name_english: chapter.chapter_name_english,
                          start_page: chapter.start_page,
                          end_page: chapter.end_page,
                      }
                    : null,
            });
        }

        // --- Chapter resolution mode ---
        if (chapterParam !== null) {
            const chapterSort = Number(chapterParam);
            const chapter = chapters.find(ch => ch.sort === chapterSort);

            if (!chapter) {
                return NextResponse.json(
                    { error: `Chapter ${chapterSort} not found in this book` },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                links: getLinksForChapter(book, chapter),
                resolved_chapter: {
                    id: chapter.id,
                    sort: chapter.sort,
                    chapter_number: chapter.chapter_number,
                    chapter_name: chapter.chapter_name,
                    chapter_name_english: chapter.chapter_name_english,
                    start_page: chapter.start_page,
                    end_page: chapter.end_page,
                },
            });
        }

        // --- Book-level fallback (no page or chapter specified) ---
        return NextResponse.json({
            links: getLinksForBook(book),
            resolved_chapter: null,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
