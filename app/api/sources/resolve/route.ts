import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';
import {
    getChapterForPage,
    getLinksForBook,
    getLinksForChapter,
    getLinksForPage,
} from '@/lib/source-links';
import type { SourceBook, SourceBookChapter, PlatformLinks } from '@/lib/types';

const directus = createClient();

const parseFolioInput = (value: string) => {
    const normalized = value.trim().toLowerCase();
    const match = normalized.match(/^(\d+)\s*([ab])?$/);
    if (!match) return null;
    const folio = parseInt(match[1], 10);
    if (Number.isNaN(folio) || folio <= 0) return null;
    const side = (match[2] as 'a' | 'b' | undefined) || 'a';
    const pageNumber = folio * 2 - (side === 'a' ? 1 : 0);
    return { folio, side, pageNumber };
};

const mapLinksToResponse = (links: PlatformLinks) => ({
    hebrewBooks: links.hebrewbooks,
    chabadOrg: links.chabad_org,
    lahak: links.lahak,
    chabadLibrary: links.chabadlibrary,
    sefaria: links.sefaria,
});

const serializeChapter = (chapter: SourceBookChapter | null) => {
    if (!chapter) return null;
    return {
        id: chapter.id,
        chapterNumber: chapter.chapter_number,
        chapterName: chapter.chapter_name,
        chapterNameEnglish: chapter.chapter_name_english,
        startPage: chapter.start_page,
        endPage: chapter.end_page,
        hebrewbooksStartPage: chapter.hebrewbooks_start_page,
        hebrewbooksEndPage: chapter.hebrewbooks_end_page,
        pageValidationStatus: chapter.page_validation_status,
    };
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const bookId = searchParams.get('bookId');
        const pageParam = searchParams.get('page');
        const chapterId = searchParams.get('chapterId');
        const chapterNumberParam = searchParams.get('chapterNumber') || searchParams.get('chapter');

        if (!bookId) {
            return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
        }

        if (!pageParam && !chapterId && !chapterNumberParam) {
            return NextResponse.json(
                { error: 'page, chapterId, or chapterNumber is required' },
                { status: 400 }
            );
        }

        const books = await directus.request(readItems('source_books', {
            filter: { id: { _eq: bookId } },
            fields: [
                'id',
                'canonical_name',
                'reference_style',
                'hebrewbooks_id',
                'hebrewbooks_offset',
                'chabad_org_root_id',
                'lahak_root_id',
                'chabadlibrary_id',
                'sefaria_slug',
            ],
            limit: 1,
        }));

        const book = (Array.isArray(books) ? books[0] : books) as SourceBook | undefined;

        if (!book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        const chapters = await directus.request(readItems('source_book_chapters', {
            filter: { book_id: { _eq: bookId } },
            fields: [
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
            ],
            sort: ['sort', 'chapter_number'],
            limit: -1,
        })) as SourceBookChapter[];

        book.chapters = Array.isArray(chapters) ? chapters : chapters ? [chapters] : [];

        let links: PlatformLinks;
        let chapter: SourceBookChapter | null = null;
        let page: number | null = null;
        let folio: string | null = null;

        if (pageParam) {
            if (book.reference_style === 'folio') {
                const parsed = parseFolioInput(pageParam);
                if (!parsed) {
                    return NextResponse.json(
                        { error: 'page must be a valid folio reference (e.g., 12a, 12b)' },
                        { status: 400 }
                    );
                }
                page = parsed.pageNumber;
                folio = `${parsed.folio}${parsed.side}`;
            } else {
                page = parseInt(pageParam, 10);
                if (Number.isNaN(page) || page <= 0) {
                    return NextResponse.json(
                        { error: 'page must be a positive integer' },
                        { status: 400 }
                    );
                }
            }
            chapter = getChapterForPage(book.chapters, page);
            links = getLinksForPage(book, page);
        } else if (chapterId || chapterNumberParam) {
            if (chapterId) {
                chapter = book.chapters.find(ch => ch.id === chapterId) || null;
            } else if (chapterNumberParam) {
                const chapterNumber = parseInt(chapterNumberParam, 10);
                if (Number.isNaN(chapterNumber) || chapterNumber <= 0) {
                    return NextResponse.json(
                        { error: 'chapterNumber must be a positive integer' },
                        { status: 400 }
                    );
                }
                chapter =
                    book.chapters.find(ch => ch.chapter_number === chapterNumber)
                    || book.chapters.find(ch => ch.sort === chapterNumber)
                    || null;
            }

            if (!chapter) {
                return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
            }

            links = getLinksForChapter(book, chapter);
        } else {
            links = getLinksForBook(book);
        }

        return NextResponse.json({
            bookId: book.id,
            referenceStyle: book.reference_style,
            page,
            folio,
            chapter: serializeChapter(chapter),
            links: mapLinksToResponse(links),
        });
    } catch (error) {
        return handleApiError(error);
    }
}
