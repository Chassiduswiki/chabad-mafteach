import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/directus';
import { readItems, createItem, createItems } from '@directus/sdk';

// GET /api/collections - List collections with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const featured = searchParams.get('featured') === 'true';
    const public_only = searchParams.get('public') !== 'false'; // default to public only
    const sort = searchParams.get('sort') || 'date_updated';
    const curator = searchParams.get('curator');

    const directus = createClient();
    
    // Build filter
    let filter: any = {
      status: { _eq: 'published' }
    };

    if (public_only) {
      filter.is_public = { _eq: true };
    }

    if (search) {
      filter._or = [
        { title: { _icontains: search } },
        { description: { _icontains: search } }
      ];
    }

    if (tags.length > 0) {
      filter.tags = { _contains: tags };
    }

    if (featured) {
      filter.is_featured = { _eq: true };
    }

    if (curator) {
      filter.curator = { _eq: curator };
    }

    // Fetch collections with related data using the Directus SDK
    const collections = await directus.request(readItems('topic_collections' as any, {
      filter,
      fields: [
        'id',
        'title',
        'slug',
        'description',
        'curator.id',
        'curator.first_name',
        'curator.last_name',
        'curator.avatar',
        'is_public',
        'is_featured',
        'cover_image.id',
        'cover_image.title',
        'cover_image.filename_download',
        'tags',
        'view_count',
        'like_count',
        'fork_count',
        'date_created',
        'date_updated',
        'topic_collection_topics.topic_id',
        'topic_collection_topics.order_index'
      ] as any[],
      sort: [`-${sort}`] as any[],
      limit,
      offset: (page - 1) * limit,
      deep: {
        topic_collection_topics: {
          _sort: ['order_index']
        }
      } as any
    }));

    // Get total count for pagination
    const totalCount = await directus.request(readItems('topic_collections' as any, {
      filter,
      aggregate: { count: ['id'] }
    })) as any[];

    return NextResponse.json({
      collections: collections || [],
      pagination: {
        page,
        limit,
        total: totalCount?.[0]?.count?.id || 0,
        pages: Math.ceil((totalCount?.[0]?.count?.id || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Collections fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// POST /api/collections - Create new collection
export const POST = requireAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json();
    const { title, description, is_public = false, tags = [], topic_ids = [] } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Collection title is required' },
        { status: 400 }
      );
    }

    const directus = createClient();

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const existing = await directus.request(readItems('topic_collections' as any, {
      filter: { slug: { _eq: slug } },
      fields: ['id']
    })) as any[];

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'A collection with this title already exists' },
        { status: 409 }
      );
    }

    // Create collection
    const collection = await directus.request(createItem('topic_collections' as any, {
      title: title.trim(),
      slug,
      description: description?.trim() || null,
      curator: userId,
      is_public,
      is_featured: false,
      tags: tags.filter(Boolean),
      status: 'published'
    }));

    // Add topics to collection if provided
    if (topic_ids.length > 0) {
      const topicRelations = topic_ids.map((topicId: number, index: number) => ({
        collection_id: collection.id,
        topic_id: topicId,
        order_index: index
      }));

      await directus.request(createItems('topic_collection_topics' as any, topicRelations));
    }

    // Fetch the complete collection with relations
    const completeCollection = await directus.request(readItems('topic_collections' as any, {
      filter: { id: { _eq: collection.id } },
      fields: [
        'id',
        'title',
        'slug',
        'description',
        'curator.id',
        'curator.first_name',
        'curator.last_name',
        'curator.avatar',
        'is_public',
        'is_featured',
        'cover_image.id',
        'cover_image.title',
        'cover_image.filename_download',
        'tags',
        'view_count',
        'like_count',
        'fork_count',
        'date_created',
        'date_updated',
        'topic_collection_topics.topic_id',
        'topic_collection_topics.order_index'
      ] as any[],
      deep: {
        topic_collection_topics: {
          _sort: ['order_index']
        }
      } as any
    })) as any[];

    return NextResponse.json(completeCollection[0], { status: 201 });
  } catch (error) {
    console.error('Collection creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
});
