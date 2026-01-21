import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems, createItem } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const topicId = searchParams.get('topic_id');

        if (!topicId) {
            return NextResponse.json({ error: 'topic_id required' }, { status: 400 });
        }

        // Get source_links for this topic
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
            .filter((id): id is number => id !== undefined); // unique and filter undefined

        if (sourceIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // Get sources
        const result = await directus.request(readItems('sources', {
            filter: { id: { _in: sourceIds } } as any,
            fields: ['id', 'title', 'external_system', 'external_url', 'metadata'],
            limit: -1
        }));

        const sourcesArray = Array.isArray(result) ? result : result ? [result] : [];

        return NextResponse.json({ data: sourcesArray });
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
