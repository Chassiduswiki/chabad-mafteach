import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

// POST /api/collections/[id]/like - Like a collection
export const POST = requireAuth(async (request: NextRequest, context: { userId: string; role: string }) => {
  try {
    const { userId } = context;
    const urlParts = new URL(request.url).pathname.split('/');
    const collectionId = urlParts[urlParts.length - 2]; // Get collectionId from URL

    const directus = createClient();

    // Check if collection exists and is public
    const collections = await directus.request(readItems('topic_collections' as any, {
      filter: { id: { _eq: collectionId } },
      fields: ['id', 'is_public', 'like_count']
    })) as any[];

    if (!collections || collections.length === 0) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collection = collections[0];

    if (!collection.is_public) {
      return NextResponse.json(
        { error: 'Cannot like private collection' },
        { status: 403 }
      );
    }

    // Check if user already liked this collection
    const existingLikes = await directus.request(readItems('collection_likes' as any, {
      filter: {
        collection_id: { _eq: collectionId },
        user_id: { _eq: userId }
      },
      fields: ['id']
    })) as any[];

    if (existingLikes && existingLikes.length > 0) {
      return NextResponse.json(
        { error: 'Already liked' },
        { status: 409 }
      );
    }

    // Create like record
    await directus.request(createItem('collection_likes' as any, {
      collection_id: collectionId,
      user_id: userId
    }));

    // Update like count
    await directus.request(updateItem('topic_collections' as any, collection.id, {
      like_count: (collection.like_count || 0) + 1
    }));

    return NextResponse.json({ success: true, liked: true });
  } catch (error) {
    console.error('Collection like error:', error);
    return NextResponse.json(
      { error: 'Failed to like collection' },
      { status: 500 }
    );
  }
});

// DELETE /api/collections/[id]/like - Unlike a collection
export const DELETE = requireAuth(async (request: NextRequest, context: { userId: string; role: string }) => {
  try {
    const { userId } = context;
    const urlParts = new URL(request.url).pathname.split('/');
    const collectionId = urlParts[urlParts.length - 2]; // Get collectionId from URL

    const directus = createClient();

    // Find the like record
    const existingLikes = await directus.request(readItems('collection_likes' as any, {
      filter: {
        collection_id: { _eq: collectionId },
        user_id: { _eq: userId }
      },
      fields: ['id']
    })) as any[];

    if (!existingLikes || existingLikes.length === 0) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      );
    }

    await directus.request(deleteItem('collection_likes' as any, existingLikes[0].id));

    // Get current collection to update count
    const collections = await directus.request(readItems('topic_collections' as any, {
      filter: { id: { _eq: collectionId } },
      fields: ['id', 'like_count']
    })) as any[];

    if (collections && collections.length > 0) {
      const collection = collections[0];
      // Update like count
      await directus.request(updateItem('topic_collections' as any, collection.id, {
        like_count: Math.max(0, (collection.like_count || 0) - 1)
      }));
    }

    return NextResponse.json({ success: true, liked: false });
  } catch (err) {
    console.error('Unlike failed:', err);
    return NextResponse.json(
      { error: 'Failed to unlike collection' },
      { status: 500 }
    );
  }
});
