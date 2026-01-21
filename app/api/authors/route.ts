import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

const directus = createClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const search = searchParams.get('search');

        const filter = search ? {
            canonical_name: { _contains: search }
        } : {};

        const authors = await directus.request(readItems('authors', {
            filter,
            fields: ['id', 'canonical_name', 'birth_year', 'death_year', 'era', 'bio_summary'],
            limit,
            sort: ['canonical_name']
        }));

        return NextResponse.json({ data: authors });
    } catch (error) {
        console.error('Failed to fetch authors:', error);
        return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { canonical_name, birth_year, death_year, era, bio_summary } = body;

        if (!canonical_name) {
            return NextResponse.json({ error: 'canonical_name is required' }, { status: 400 });
        }

        const author = await directus.request(createItem('authors', {
            canonical_name,
            birth_year: birth_year || null,
            death_year: death_year || null,
            era: era || null,
            bio_summary: bio_summary || null
        }));

        return NextResponse.json({ success: true, author });
    } catch (error) {
        console.error('Failed to create author:', error);
        return NextResponse.json({ error: 'Failed to create author' }, { status: 500 });
    }
}
