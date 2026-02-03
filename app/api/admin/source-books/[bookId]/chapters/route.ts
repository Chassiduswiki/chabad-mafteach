import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';
import { validatePageBoundaries } from '@/lib/source-links';
import type { SourceBookChapter } from '@/lib/types';

const directus = createClient();

const chapterFields = [
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
];

const normalizePageValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.trunc(parsed);
};

const fetchChapters = async (bookId: string) => {
    const chapters = await directus.request(readItems('source_book_chapters', {
        filter: { book_id: { _eq: bookId } },
        fields: chapterFields,
        sort: ['sort', 'chapter_number'],
        limit: -1,
    }));

    return (Array.isArray(chapters) ? chapters : chapters ? [chapters] : []) as SourceBookChapter[];
};

const applyValidationStatuses = async (chapters: SourceBookChapter[]) => {
    const { statusById, overlaps } = validatePageBoundaries(chapters);
    const updates = chapters
        .map(chapter => ({
            id: chapter.id,
            page_validation_status: statusById[chapter.id] ?? chapter.page_validation_status ?? 'pending',
        }))
        .filter(update => update.page_validation_status !== undefined);

    await Promise.all(
        updates.map(update =>
            directus.request(updateItem('source_book_chapters', update.id, {
                page_validation_status: update.page_validation_status,
            }))
        )
    );

    return { overlaps, statusById };
};

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ bookId: string }> }
) {
    try {
        const { bookId } = await params;
        const chapters = await fetchChapters(bookId);
        return NextResponse.json({ data: chapters });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ bookId: string }> }
) {
    try {
        const { bookId } = await params;
        const body = await request.json();
        const updates = Array.isArray(body?.updates) ? body.updates : [];

        await Promise.all(
            updates.map((update: any) => {
                if (!update?.id) return null;
                const payload = {
                    hebrewbooks_start_page: normalizePageValue(update.hebrewbooks_start_page),
                    hebrewbooks_end_page: normalizePageValue(update.hebrewbooks_end_page),
                };
                return directus.request(updateItem('source_book_chapters', update.id, payload));
            }).filter(Boolean)
        );

        const chapters = await fetchChapters(bookId);
        const validation = await applyValidationStatuses(chapters);
        const hydrated = chapters.map(chapter => ({
            ...chapter,
            page_validation_status: validation.statusById[chapter.id] ?? chapter.page_validation_status,
        }));

        return NextResponse.json({
            data: hydrated,
            overlaps: validation.overlaps,
            statusById: validation.statusById,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
