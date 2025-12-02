import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    try {
        const filter = category ? { category: { _eq: category as any } } : {};

        const topics = await directus.request(readItems('topics', {
            filter,
            sort: ['name'],
            fields: ['id', 'name', 'name_hebrew', 'slug', 'category', 'definition_short']
        }));

        return NextResponse.json({ topics });
    } catch (error) {
        console.error('Topics fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }
}
