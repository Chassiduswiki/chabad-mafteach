import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';

// GET /api/topics/[id]/annotations - Get annotations for a topic
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const type = searchParams.get('type');
    const public_only = searchParams.get('public') !== 'false';

    const directus = createClient();

    // First get topic ID from slug
    const topics = await directus.request(readItems('topics', {
      filter: { slug: { _eq: slug } },
      fields: ['id']
    })) as any[];

    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const topicId = topics[0].id;

    // Build filter
    let filter: any = {
      topic_id: { _eq: topicId },
      status: { _eq: 'active' }
    };

    if (section) {
      filter.section_reference = { _eq: section };
    }

    if (type) {
      filter.annotation_type = { _eq: type };
    }

    if (public_only) {
      filter.is_public = { _eq: true };
    }

    const annotations = await directus.request(readItems('topic_annotations' as any, {
      filter,
      fields: [
        'id',
        'content',
        'annotation_type',
        'section_reference',
        'is_public',
        'like_count',
        'date_created',
        'user_created.id',
        'user_created.first_name',
        'user_created.last_name',
        'user_created.avatar'
      ],
      sort: ['-date_created']
    }));

    return NextResponse.json(annotations || []);
  } catch (error) {
    console.error('Annotations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    );
  }
}

// POST /api/topics/[id]/annotations - Create new annotation
export const POST = requireAuth(async (
  request: NextRequest,
  context: { userId: string; role: string }
) => {
  try {
    const { userId } = context;
    const urlParts = new URL(request.url).pathname.split('/');
    const slug = urlParts[urlParts.length - 2]; // Get slug from URL
    const body = await request.json();
    const { content, annotation_type, section_reference, is_public = true } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Annotation content is required' },
        { status: 400 }
      );
    }

    if (!annotation_type) {
      return NextResponse.json(
        { error: 'Annotation type is required' },
        { status: 400 }
      );
    }

    const directus = createClient();

    // First get topic ID from slug
    const topics = await directus.request(readItems('topics', {
      filter: { slug: { _eq: slug } },
      fields: ['id']
    })) as any[];

    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const topicId = topics[0].id;

    const annotation = await directus.request(createItem('topic_annotations' as any, {
      topic_id: topicId,
      user_created: userId,
      content: content.trim(),
      annotation_type,
      section_reference: section_reference || null,
      is_public,
      like_count: 0,
      status: 'active'
    }));

    // Fetch the complete annotation with user info
    const completeAnnotation = await directus.request(readItems('topic_annotations' as any, {
      filter: { id: { _eq: (annotation as any).id } },
      fields: [
        'id',
        'content',
        'annotation_type',
        'section_reference',
        'is_public',
        'like_count',
        'date_created',
        'user_created.id',
        'user_created.first_name',
        'user_created.last_name',
        'user_created.avatar'
      ]
    })) as any[];

    return NextResponse.json(completeAnnotation[0], { status: 201 });
  } catch (error) {
    console.error('Annotation creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create annotation' },
      { status: 500 }
    );
  }
});
