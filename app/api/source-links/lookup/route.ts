import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

const directus = createClient();

/**
 * GET /api/source-links/lookup?title=Derech+Mitzvosecha
 *
 * Given a source title, find the matching SourceBook by checking
 * canonical_name and alternate_names. Returns the book slug if found,
 * or null. Lightweight — does not load chapters.
 *
 * Used by the citation UI to determine whether a clicked citation
 * has a source book in the linking catalog.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const title = searchParams.get('title')?.trim();

        if (!title) {
            return NextResponse.json(
                { error: 'title is required' },
                { status: 400 }
            );
        }

        // Search published books. We fetch all and match in-app because
        // Directus JSON field filtering (_contains on alternate_names) is
        // unreliable across backends. The catalog is small (< 100 books).
        const books = await directus.request(
            readItems('source_books' as any, {
                filter: { status: { _eq: 'published' } },
                fields: ['id', 'slug', 'canonical_name', 'hebrew_name', 'alternate_names'],
                limit: -1,
            } as any)
        ) as { id: string; slug: string; canonical_name: string; hebrew_name?: string; alternate_names?: string[] }[];

        const list = Array.isArray(books) ? books : [];
        const normalized = title.toLowerCase();

        const match = list.find(book => {
            if (book.canonical_name.toLowerCase() === normalized) return true;
            if (book.hebrew_name && book.hebrew_name === title) return true;
            if (Array.isArray(book.alternate_names)) {
                return book.alternate_names.some(
                    (alt: string) => alt.toLowerCase() === normalized
                );
            }
            return false;
        });

        if (!match) {
            return NextResponse.json({ book: null });
        }

        return NextResponse.json({
            book: {
                slug: match.slug,
                canonical_name: match.canonical_name,
                hebrew_name: match.hebrew_name,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
