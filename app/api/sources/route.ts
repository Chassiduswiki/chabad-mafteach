import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems, createItem } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const topicId = searchParams.get('topic_id');
        const id = searchParams.get('id');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '100');

        // Get single book by ID with full relations
        if (id) {
            const books = await directus.request(readItems('sources', {
                filter: { id: { _eq: parseInt(id) } },
                fields: [
                    '*',
                    { author_id: ['id', 'canonical_name', 'birth_year', 'death_year', 'era'] }
                ],
                limit: 1
            }));

            if ((books as any[]).length === 0) {
                return NextResponse.json({ error: 'Book not found' }, { status: 404 });
            }

            // Get topics using this book (via source_links where statement_id is null)
            const topicLinks = await directus.request(readItems('source_links', {
                filter: { 
                    _and: [
                        { source_id: { _eq: parseInt(id) } },
                        { statement_id: { _null: true } }
                    ]
                } as any,
                fields: [
                    'id',
                    { topic_id: ['id', 'canonical_title', 'slug'] }
                ] as any
            }));

            // Get inline citations (source_links where statement_id has value)
            const citationLinks = await directus.request(readItems('source_links', {
                filter: { 
                    _and: [
                        { source_id: { _eq: parseInt(id) } },
                        { statement_id: { _nnull: true } }
                    ]
                },
                fields: [
                    'id',
                    'section_reference',
                    'page_number',
                    { statement_id: ['id', 'text'] }
                ]
            }));

            return NextResponse.json({ 
                book: (books as any[])[0], 
                topics: (topicLinks as any[]).map(l => l.topic_id).filter(Boolean),
                citations: citationLinks
            });
        }

        // Get sources for a specific topic (original behavior)
        if (topicId) {
            const links = await directus.request(readItems('source_links', {
                filter: { 
                    statement_id: {
                        _in: {
                            _table: 'statements',
                            _on: {
                                statement_topics: {
                                    topic_id: { _eq: parseInt(topicId) }
                                }
                            }
                        }
                    }
                },
                fields: ['source_id'],
                limit: -1
            }));

            const sourceIds = (Array.isArray(links) ? links : [links])
                .map(l => l.source_id)
                .filter((id, idx, arr) => arr.indexOf(id) === idx)
                .filter((id): id is number => id !== undefined);

            if (sourceIds.length === 0) {
                return NextResponse.json({ data: [] });
            }

            const result = await directus.request(readItems('sources', {
                filter: { id: { _in: sourceIds } } as any,
                fields: ['id', 'title', 'external_system', 'external_url', 'metadata'],
                limit: -1
            }));

            const sourcesArray = Array.isArray(result) ? result : result ? [result] : [];
            return NextResponse.json({ data: sourcesArray });
        }

        // List all books with optional search
        const filter = search ? {
            _or: [
                { title: { _icontains: search } },
                { author_id: { canonical_name: { _icontains: search } } }
            ]
        } : {};

        const books = await directus.request(readItems('sources', {
            filter,
            fields: [
                'id', 'title', 'publication_year', 'publisher', 'isbn',
                'external_system', 'external_url', 'original_lang', 'citation_text',
                { author_id: ['id', 'canonical_name', 'birth_year', 'death_year'] }
            ],
            sort: ['title'],
            limit
        }));

        return NextResponse.json({ data: books });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST - Create a new source
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, author_name, author_id, publication_year, publisher, external_url, external_system, citation_text, original_lang } = body;

        if (!title?.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // If author_name is provided but no author_id, create the author first
        let finalAuthorId = author_id;
        if (author_name && !author_id) {
            try {
                // Check if author already exists
                const existingAuthors = await directus.request(readItems('authors', {
                    filter: { canonical_name: { _icontains: author_name } },
                    fields: ['id'],
                    limit: 1,
                } as any));

                if ((existingAuthors as any[]).length > 0) {
                    finalAuthorId = (existingAuthors as any[])[0].id;
                } else {
                    // Create new author
                    const newAuthor = await directus.request(createItem('authors', {
                        canonical_name: author_name,
                    }));
                    finalAuthorId = (newAuthor as any).id;
                }
            } catch (authorError) {
                console.warn('Failed to create/find author:', authorError);
                // Continue without author if creation fails
            }
        }

        const newSource = await directus.request(createItem('sources', {
            title,
            author_id: finalAuthorId || undefined,
            publication_year: publication_year ? parseInt(publication_year) : undefined,
            publisher: publisher || undefined,
            external_url: external_url || undefined,
            external_system: external_system || undefined,
            citation_text: citation_text || undefined,
            original_lang: original_lang || 'he',
        } as any));

        return NextResponse.json({ data: newSource }, { status: 201 });
    } catch (error) {
        console.error('Failed to create source:', error);
        return handleApiError(error);
    }
}
