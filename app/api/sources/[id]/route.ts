import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem, deleteItem } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

const directus = createClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const sources = await directus.request(readItems('sources', {
            filter: { id: { _eq: parseInt(id) } },
            fields: [
                'id',
                'title',
                'citation_text',
                'metadata',
                'original_lang',
                'publication_year',
                'publisher',
                'isbn',
                'external_system',
                'external_url',
                'author_id',
                'authors.id',
                'authors.canonical_name',
                'authors.birth_year',
                'authors.death_year',
                'authors.era',
                'authors.bio_summary'
            ],
            limit: 1
        }));

        if ((sources as any[]).length === 0) {
            return NextResponse.json({ error: 'Source not found' }, { status: 404 });
        }

        return NextResponse.json(sources[0]);
    } catch (error) {
        console.error('Failed to fetch source:', error);
        return handleApiError(error);
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { 
            title, 
            author_id, 
            publication_year, 
            publisher, 
            isbn,
            external_system, 
            external_url, 
            original_lang,
            citation_text
        } = body;

        // Build update object with only provided fields
        const updateData: Record<string, any> = {};
        if (title !== undefined) updateData.title = title;
        if (author_id !== undefined) updateData.author_id = author_id || null;
        if (publication_year !== undefined) updateData.publication_year = publication_year ? parseInt(publication_year) : null;
        if (publisher !== undefined) updateData.publisher = publisher || null;
        if (isbn !== undefined) updateData.isbn = isbn || null;
        if (external_system !== undefined) updateData.external_system = external_system || null;
        if (external_url !== undefined) updateData.external_url = external_url || null;
        if (original_lang !== undefined) updateData.original_lang = original_lang || null;
        if (citation_text !== undefined) updateData.citation_text = citation_text || null;

        const book = await directus.request(updateItem('sources', parseInt(id), updateData));

        return NextResponse.json({ success: true, book });
    } catch (error) {
        console.error('Failed to update book:', error);
        return handleApiError(error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // First check if book exists
        const books = await directus.request(readItems('sources', {
            filter: { id: { _eq: parseInt(id) } },
            fields: ['id', 'title'],
            limit: 1
        }));

        if ((books as any[]).length === 0) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        // Delete the book (source_links will cascade or be handled by DB)
        await directus.request(deleteItem('sources', parseInt(id)));

        return NextResponse.json({ success: true, message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Failed to delete book:', error);
        return handleApiError(error);
    }
}
