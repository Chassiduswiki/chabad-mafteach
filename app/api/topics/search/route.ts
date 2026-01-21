import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

const directus = createClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
  const type = searchParams.get('type'); // Optional: filter by topic_type

  if (!query.trim()) {
    return NextResponse.json({ data: [] });
  }

  try {
    const filter: any = {
      _or: [
        { canonical_title: { _icontains: query } },
        { canonical_title_en: { _icontains: query } },
        { canonical_title_transliteration: { _icontains: query } },
        { description: { _icontains: query } },
        { slug: { _icontains: query } },
      ],
    };

    // Add type filter if specified
    if (type) {
      filter._and = [
        { topic_type: { _eq: type } },
        { _or: filter._or },
      ];
      delete filter._or;
    }

    const topics = await directus.request(
      readItems('topics', {
        fields: [
          'id',
          'canonical_title',
          'canonical_title_en',
          'canonical_title_transliteration',
          'slug',
          'topic_type',
          'description',
        ] as any,
        filter,
        limit,
        sort: ['canonical_title'],
      } as any)
    );

    return NextResponse.json({ data: topics });
  } catch (error) {
    console.error('Topic search error:', error);
    return handleApiError(error);
  }
}
