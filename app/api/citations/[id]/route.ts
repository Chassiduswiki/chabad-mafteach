import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * API route to get citation data by ID
 * GET /api/citations/:id
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: citationId } = await params;
    
    if (!citationId) {
      return NextResponse.json(
        { error: 'Missing citation ID' },
        { status: 400 }
      );
    }

    // Connect to Directus
    const directus = createClient();
    
    // Find source_link with matching citation_id
    const sourceLinks = await directus.request(
      readItems('source_links', {
        filter: { citation_id: { _eq: citationId } },
        fields: ['*', { source_id: ['*', { author_id: ['*'] }] }],
        limit: 1
      })
    );

    if (!sourceLinks || sourceLinks.length === 0) {
      return NextResponse.json(
        { error: 'Citation not found' },
        { status: 404 }
      );
    }

    const sourceLink = sourceLinks[0];
    const source = sourceLink.source_id;

    // Format the response with all needed information
    const citationData = {
      id: citationId,
      source: {
        id: source.id,
        title: source.title,
        author: source.author_id ? {
          id: source.author_id.id,
          name: source.author_id.canonical_name,
          birthYear: source.author_id.birth_year,
          deathYear: source.author_id.death_year,
          era: source.author_id.era
        } : null,
        publicationYear: source.publication_year,
        publisher: source.publisher,
        externalUrl: source.external_url
      },
      reference: {
        page: sourceLink.page_number,
        section: sourceLink.section_reference,
        verse: sourceLink.verse_reference,
        custom: sourceLink.notes
      },
      relationship: sourceLink.relationship_type
    };

    return NextResponse.json(citationData);
  } catch (error) {
    console.error('Error fetching citation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch citation data' },
      { status: 500 }
    );
  }
}
