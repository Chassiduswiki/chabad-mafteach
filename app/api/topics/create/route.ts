import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { createItem, readItems } from '@directus/sdk';
import { verifyAuth } from '@/lib/auth';

const directus = createClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check auth - allow bypass in development
    const auth = verifyAuth(request);
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!auth && !isDev) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      canonical_title,
      canonical_title_en,
      canonical_title_transliteration,
      slug,
      topic_type,
      description,
    } = body;

    // Validation
    if (!canonical_title?.trim()) {
      return NextResponse.json(
        { error: 'Hebrew title (canonical_title) is required' },
        { status: 400 }
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    if (!topic_type) {
      return NextResponse.json(
        { error: 'Topic type is required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await directus.request(
      readItems('topics', {
        filter: { slug: { _eq: slug.toLowerCase() } },
        fields: ['id'],
        limit: 1,
      } as any)
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'A topic with this slug already exists' },
        { status: 409 }
      );
    }

    // Create the topic
    const newTopic = await directus.request(
      createItem('topics', {
        canonical_title,
        canonical_title_en: canonical_title_en || undefined,
        canonical_title_transliteration: canonical_title_transliteration || undefined,
        slug: slug.toLowerCase(),
        topic_type,
        description: description || undefined,
        content_status: 'minimal',
      } as any)
    );

    return NextResponse.json({ data: newTopic }, { status: 201 });
  } catch (error) {
    console.error('Failed to create topic:', error);
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
}
