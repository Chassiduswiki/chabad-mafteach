import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';
import { formatCitationString } from '@/lib/citations/citationFormatter';

const directus = createClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  if (!query.trim()) {
    return NextResponse.json({ data: [] });
  }

  try {
    // Clean the query and split into individual terms
    const cleanQuery = query.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const searchTerms = cleanQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    let allSources: any[] = [];
    const seenIds = new Set();
    
    // Search for each term separately and combine results
    for (const term of searchTerms) {
      const sources = await directus.request(
        readItems('sources', {
          fields: [
            'id',
            'title',
            'original_lang',
            'publication_year',
            'publisher',
            'external_system',
            'external_url',
            'citation_text',
            'author_id',
            'parent_id',
            'page_number',
            'page_count',
            'parsha',
            'metadata',
          ] as any,
          filter: {
            _or: [
              { title: { _icontains: term } },
              { citation_text: { _icontains: term } },
              { publisher: { _icontains: term } },
              { parsha: { _icontains: term } },
            ],
          },
          limit,
          sort: ['title'],
        } as any)
      );
      
      // Add new sources to our combined results
      for (const source of sources) {
        if (!seenIds.has(source.id)) {
          allSources.push(source);
          seenIds.add(source.id);
        }
      }
    }

    // Transform to include formatted title
    const transformedSources = (allSources as any[]).map((source) => {
      // Generate formatted citation title
      // Only set rootSourceId if it's explicitly in metadata or parent_id chain
      const formattedTitle = formatCitationString({
        id: source.id,
        title: source.title,
        page_number: source.page_number,
        page_count: source.page_count,
        parsha: source.parsha,
        metadata: source.metadata,
        // Use explicit root_source_id from metadata if available
        rootSourceId: source.metadata?.root_source_id,
      });

      return {
        id: source.id,
        title: source.title,
        formatted_title: formattedTitle,
        author_id: source.author_id || null,
        publication_year: source.publication_year,
        publisher: source.publisher,
        external_system: source.external_system,
        external_url: source.external_url,
        citation_text: source.citation_text,
        parent_id: source.parent_id,
        page_number: source.page_number,
        page_count: source.page_count,
        parsha: source.parsha,
      };
    });

    return NextResponse.json({ data: transformedSources });
  } catch (error) {
    console.error('Source search error:', error);
    return handleApiError(error);
  }
}
