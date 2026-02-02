import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';
import { validatePageBoundaries } from '@/lib/source-links';
import type { SourceBook, SourceBookChapter } from '@/lib/types';
import { requirePermission } from '@/lib/security/permissions';
import { withAudit } from '@/lib/security/audit';
import { adminWriteRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';

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
];

export const POST = requirePermission('canManageSourceBooks', withAudit('update', 'admin.source-books.validate', async (request: NextRequest) => {
    const rateLimited = enforceRateLimit(request, adminWriteRateLimit);
    if (rateLimited) return rateLimited;

    try {
        const books = await directus.request(readItems('source_books', {
            fields: ['id', 'canonical_name', 'slug'],
            sort: ['canonical_name'],
            limit: -1,
        })) as SourceBook[];

        const results = [];
        let totalOverlaps = 0;

        for (const book of books) {
            const chapters = await directus.request(readItems('source_book_chapters', {
                filter: { book_id: { _eq: book.id } },
                fields: chapterFields,
                sort: ['sort', 'chapter_number'],
                limit: -1,
            })) as SourceBookChapter[];

            const chapterList = Array.isArray(chapters) ? chapters : chapters ? [chapters] : [];
            if (chapterList.length === 0) {
                results.push({
                    bookId: book.id,
                    canonicalName: book.canonical_name,
                    overlaps: [],
                    missingCount: 0,
                });
                continue;
            }

            const { overlaps, statusById } = validatePageBoundaries(chapterList);
            totalOverlaps += overlaps.length;

            const updates = chapterList.map(chapter => ({
                id: chapter.id,
                page_validation_status: statusById[chapter.id] ?? chapter.page_validation_status ?? 'pending',
            }));

            await Promise.all(
                updates.map(update =>
                    directus.request(updateItem('source_book_chapters', update.id, {
                        page_validation_status: update.page_validation_status,
                    }))
                )
            );

            const missingCount = updates.filter(update => update.page_validation_status === 'missing').length;

            results.push({
                bookId: book.id,
                canonicalName: book.canonical_name,
                overlaps: overlaps.map(item => ({
                    current: {
                        id: item.current.id,
                        chapterNumber: item.current.chapter_number,
                        chapterName: item.current.chapter_name,
                        range: item.currentRange,
                    },
                    next: {
                        id: item.next.id,
                        chapterNumber: item.next.chapter_number,
                        chapterName: item.next.chapter_name,
                        range: item.nextRange,
                    },
                })),
                missingCount,
            });
        }

        return NextResponse.json({
            summary: {
                totalBooks: results.length,
                booksWithOverlaps: results.filter(r => r.overlaps.length > 0).length,
                totalOverlaps,
                booksWithMissing: results.filter(r => r.missingCount > 0).length,
            },
            results,
        });
    } catch (error) {
        return handleApiError(error);
    }
}));
