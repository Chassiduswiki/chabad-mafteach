import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem, deleteItem } from '@directus/sdk';

const directus = createClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const authors = await directus.request(readItems('authors', {
            filter: { id: { _eq: parseInt(id) } },
            fields: ['*'],
            limit: 1
        }));

        if (authors.length === 0) {
            return NextResponse.json({ error: 'Author not found' }, { status: 404 });
        }

        // Also fetch books by this author
        const books = await directus.request(readItems('sources', {
            filter: { author_id: { _eq: parseInt(id) } },
            fields: ['id', 'title', 'publication_year', 'external_system', 'external_url'],
            sort: ['title']
        }));

        return NextResponse.json({ author: authors[0], books });
    } catch (error) {
        console.error('Failed to fetch author:', error);
        return NextResponse.json({ error: 'Failed to fetch author' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        
        const author = await directus.request(updateItem('authors', parseInt(id), body));

        return NextResponse.json({ success: true, author });
    } catch (error) {
        console.error('Failed to update author:', error);
        return NextResponse.json({ error: 'Failed to update author' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await directus.request(deleteItem('authors', parseInt(id)));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete author:', error);
        return NextResponse.json({ error: 'Failed to delete author' }, { status: 500 });
    }
}
