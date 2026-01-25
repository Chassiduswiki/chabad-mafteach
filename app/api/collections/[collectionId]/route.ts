import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/directus';
import { readItems, updateItem, deleteItem } from '@directus/sdk';

// GET /api/collections/[id] - Get single collection with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const { searchParams } = new URL(request.url);
    const includeTopics = searchParams.get('include_topics') !== 'false';
    const byId = searchParams.get('by_id') === 'true';

    const directus = createClient();

    // Build filter - try slug first, then ID
    let filter: any;
    if (byId) {
      filter = { id: { _eq: collectionId } };
    } else {
      filter = { slug: { _eq: collectionId } };
    }

    // First get the collection to increment view count
    const collectionsForView = await directus.request(readItems('topic_collections' as any, {
      filter,
      fields: ['id']
    })) as any[];

    if (collectionsForView && collectionsForView.length > 0) {
      await directus.request(updateItem('topic_collections' as any, collectionsForView[0].id, {
        view_count: { _inc: 1 }
      } as any));
    }

    // Fetch collection with relations
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
        'curator.title',
        'curator.description',
        'is_public',
        'is_featured',
        'cover_image.id',
        'cover_image.title',
        'cover_image.filename_download',
        'tags',
        'view_count',
        'like_count',
        'fork_count',
        'status',
        'date_created',
        'date_updated',
        ...(includeTopics ? [
          'topic_collection_topics.topic_id',
          'topic_collection_topics.order_index',
          'topic_collection_topics.topic.id',
          'topic_collection_topics.topic.canonical_title',
          'topic_collection_topics.topic.slug',
          'topic_collection_topics.topic.description',
          'topic_collection_topics.topic.topic_type'
        ] : [])
      ] as any[],
      deep: includeTopics ? {
        topic_collection_topics: {
          _sort: ['order_index']
        }
      } as any : undefined
    })) as any[];

    if (!collections || collections.length === 0) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collection = collections[0];

    // Check if collection is public or user has access
    const auth = verifyAuth(request);
    if (!collection.is_public && (!auth || auth.userId !== collection.curator?.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Collection fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

// PUT /api/collections/[id] - Update collection
export const PUT = requireAuth(async (request: NextRequest, context: { userId: string; role: string }) => {
  try {
    const { userId } = context;
    const urlParts = new URL(request.url).pathname.split('/');
    const collectionId = urlParts[urlParts.length - 1];
    const { searchParams } = new URL(request.url);
    const byId = searchParams.get('by_id') === 'true';
    const body = await request.json();
    const { title, description, is_public, tags, status } = body;

    const directus = createClient();

    // Build filter - try slug first, then ID
    let filter: any;
    if (byId) {
      filter = { id: { _eq: collectionId } };
    } else {
      filter = { slug: { _eq: collectionId } };
    }

    // Check if user owns the collection
    const existing = await directus.request(readItems('topic_collections' as any, {
      filter,
      fields: ['id', 'curator']
    })) as any[];

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    if (existing[0].curator !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update collection
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (tags !== undefined) updateData.tags = tags.filter(Boolean);
    if (status !== undefined) updateData.status = status;

    const updatedCollection = await directus.request(updateItem('topic_collections' as any, existing[0].id, updateData));

    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error('Collection update error:', error);
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    );
  }
});

// DELETE /api/collections/[id] - Delete collection
export const DELETE = requireAuth(async (request: NextRequest, context: { userId: string; role: string }) => {
  try {
    const { userId } = context;
    const urlParts = new URL(request.url).pathname.split('/');
    const collectionId = urlParts[urlParts.length - 1];
    const { searchParams } = new URL(request.url);
    const byId = searchParams.get('by_id') === 'true';

    const directus = createClient();

    // Build filter - try slug first, then ID
    let filter: any;
    if (byId) {
      filter = { id: { _eq: collectionId } };
    } else {
      filter = { slug: { _eq: collectionId } };
    }

    // Check if user owns the collection
    const existing = await directus.request(readItems('topic_collections' as any, {
      filter,
      fields: ['id', 'curator']
    })) as any[];

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    if (existing[0].curator !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete collection (cascade will handle related records)
    await directus.request(deleteItem('topic_collections' as any, existing[0].id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Collection deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
});
