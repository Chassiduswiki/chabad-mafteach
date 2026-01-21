import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

const directus = createClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  if (!query.trim()) {
    return NextResponse.json({ data: [] });
  }

  try {
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
        ] as any,
        filter: {
          _or: [
            { title: { _icontains: query } },
            { citation_text: { _icontains: query } },
            { publisher: { _icontains: query } },
          ],
        },
        limit,
        sort: ['title'],
      } as any)
    );

    // Transform to include author info (author_id is not expanded, just the raw ID)
    const transformedSources = (sources as any[]).map((source) => ({
      id: source.id,
      title: source.title,
      author_id: source.author_id || null,
      publication_year: source.publication_year,
      publisher: source.publisher,
      external_system: source.external_system,
      external_url: source.external_url,
      citation_text: source.citation_text,
    }));

    return NextResponse.json({ data: transformedSources });
  } catch (error) {
    console.error('Source search error:', error);
    return handleApiError(error);
  }
}
