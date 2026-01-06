import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * GET /api/editor/translations/languages
 * Get available languages for translation
 */
export async function GET(request: NextRequest) {
    try {
        const directus = createClient();

        const languages = await directus.request(readItems('languages' as any, {
            fields: ['code', 'name', 'direction'],
            sort: ['name'],
            limit: -1
        })) as any[];

        return NextResponse.json({ languages });
    } catch (error) {
        console.error('Languages fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch languages' },
            { status: 500 }
        );
    }
}
