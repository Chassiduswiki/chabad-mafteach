import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';
import { requirePermission } from '@/lib/security/permissions';
import { withAudit } from '@/lib/security/audit';
import { adminReadRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';

const directus = createClient();

export const GET = requirePermission('canManageSourceBooks', withAudit('read', 'admin.source-books', async (request: NextRequest) => {
    const rateLimited = enforceRateLimit(request, adminReadRateLimit);
    if (rateLimited) return rateLimited;

    try {
        const books = await directus.request(readItems('source_books', {
            fields: [
                'id',
                'canonical_name',
                'hebrew_name',
                'slug',
                'hebrewbooks_id',
                'hebrewbooks_offset',
                'reference_style',
            ],
            sort: ['canonical_name'],
            limit: -1,
        }));

        const data = Array.isArray(books) ? books : books ? [books] : [];
        return NextResponse.json({ data });
    } catch (error) {
        return handleApiError(error);
    }
}));
