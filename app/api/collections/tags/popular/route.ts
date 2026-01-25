import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET(request: NextRequest) {
  try {
    const directus = createClient();
    
    // Fetch all published collections to extract tags
    // We fetch a larger limit to get a good sample of tags
    const collections = await directus.request(
      readItems('topic_collections' as any, {
        filter: {
          status: { _eq: 'published' },
          is_public: { _eq: true }
        },
        fields: ['tags'],
        limit: 100
      })
    ) as any[];

    // Extract and count tags
    const tagCounts: Record<string, number> = {};
    collections.forEach(c => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach((tag: string) => {
          if (tag) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      }
    });

    // Sort by count descending and take top 15
    const popularTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag]) => tag);

    return NextResponse.json(popularTags);
  } catch (error) {
    console.error('Popular tags fetch error:', error);
    // Return common fallback tags if search fails
    return NextResponse.json(['Tanya', 'Halacha', 'Chassidus', 'History', 'Kabbalah']);
  }
}
