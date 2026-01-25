import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/directus';
import { readItems, createItem, deleteItem } from '@directus/sdk';

// POST /api/collections/[id]/follow - Follow a collection
export const POST = requireAuth(async (request: NextRequest, context: { userId: string; role: string }) => {
  try {
    const { userId } = context;
    const urlParts = new URL(request.url).pathname.split('/');
    const collectionId = urlParts[urlParts.length - 2]; // Get collectionId from URL

    const directus = createClient();

    // Check if collection exists and is public
    const collections = await directus.request(readItems('topic_collections' as any, {
      filter: { id: { _eq: collectionId } },
      fields: ['id', 'is_public']
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
        { error: 'Cannot follow private collection' },
        { status: 403 }
      );
    }

    // Check if user already follows this collection
    const existingFollows = await directus.request(readItems('collection_follows' as any, {
      filter: {
        collection_id: { _eq: collectionId },
        user_id: { _eq: userId }
      },
      fields: ['id']
    })) as any[];

    if (existingFollows && existingFollows.length > 0) {
      return NextResponse.json(
        { error: 'Already following' },
        { status: 409 }
      );
    }

    // Create follow record
    await directus.request(createItem('collection_follows' as any, {
      collection_id: collectionId,
      user_id: userId
    }));

    return NextResponse.json({ success: true, following: true });
  } catch (error) {
    console.error('Collection follow error:', error);
    return NextResponse.json(
      { error: 'Failed to follow collection' },
      { status: 500 }
    );
  }
});

// DELETE /api/collections/[id]/follow - Unfollow a collection
export const DELETE = requireAuth(async (request: NextRequest, context: { userId: string; role: string }) => {
  try {
    const { userId } = context;
    const urlParts = new URL(request.url).pathname.split('/');
    const collectionId = urlParts[urlParts.length - 2]; // Get collectionId from URL

    const directus = createClient();

    // Find the follow record
    const existingFollows = await directus.request(readItems('collection_follows' as any, {
      filter: {
        collection_id: { _eq: collectionId },
        user_id: { _eq: userId }
      },
      fields: ['id']
    })) as any[];

    if (!existingFollows || existingFollows.length === 0) {
      return NextResponse.json(
        { error: 'Follow not found' },
        { status: 404 }
      );
    }

    await directus.request(deleteItem('collection_follows' as any, existingFollows[0].id));

    return NextResponse.json({ success: true, following: false });
  } catch (err) {
    console.error('Unfollow failed:', err);
    return NextResponse.json(
      { error: 'Failed to unfollow collection' },
      { status: 500 }
    );
  }
});
