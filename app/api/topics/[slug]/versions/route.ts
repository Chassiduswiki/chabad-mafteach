import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';
import { requireEditor } from '@/lib/auth';

const directus = createClient();

/**
 * Topic Versioning & History API
 * 
 * Logic:
 * 1. GET: Fetch version history for a topic
 * 2. POST: Revert topic to a specific version
 */

export const GET = requireEditor(async (request: NextRequest, context: { userId: string; role: string }, { params }: { params: { slug: string } }) => {
  try {
    const slug = params.slug;
    
    // Fetch the topic ID first
    const topics = await directus.request(readItems('topics', {
      filter: { slug: { _eq: slug } },
      fields: ['id'],
      limit: 1
    } as any));

    if (!topics || (topics as any[]).length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const topicId = (topics as any[])[0].id;

    // Fetch revisions from directus_revisions
    // We need to find revisions where the collection is 'topics' and the item is our topic ID
    const revisions = await directus.request(readItems('directus_revisions', {
      filter: {
        _and: [
          { collection: { _eq: 'topics' } },
          { item: { _eq: String(topicId) } }
        ]
      },
      fields: ['id', 'user.*', 'delta', 'timestamp'],
      sort: ['-timestamp'],
      limit: 50
    } as any));

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error('Failed to fetch version history:', error);
    return NextResponse.json({ error: 'Failed to fetch version history' }, { status: 500 });
  }
});

export const POST = requireEditor(async (request: NextRequest, context: { userId: string; role: string }, { params }: { params: { slug: string } }) => {
  try {
    const slug = params.slug;
    const body = await request.json();
    const { revisionId } = body;

    if (!revisionId) {
      return NextResponse.json({ error: 'Revision ID is required' }, { status: 400 });
    }

    // 1. Fetch the topic ID
    const topics = await directus.request(readItems('topics', {
      filter: { slug: { _eq: slug } },
      fields: ['id'],
      limit: 1
    } as any));

    if (!topics || (topics as any[]).length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const topicId = (topics as any[])[0].id;

    // 2. Fetch the specific revision
    const revision = await directus.request(readItems('directus_revisions', {
      filter: { id: { _eq: revisionId } },
      fields: ['delta'],
      limit: 1
    } as any));

    if (!revision || (revision as any[]).length === 0) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    const delta = (revision as any[])[0].delta;

    // 3. Apply the delta back to the topic
    // Directus revisions store the changes. To truly "revert", we'd ideally
    // have a snapshots system, but here we'll assume the user wants to 
    // apply the state captured in that revision's delta if possible.
    // NOTE: In a production system, you'd calculate the full state by 
    // replaying all deltas or using Directus snapshots if enabled.
    
    await directus.request(updateItem('topics', topicId, delta as any));

    return NextResponse.json({ success: true, message: 'Topic reverted successfully' });
  } catch (error) {
    console.error('Failed to revert topic version:', error);
    return NextResponse.json({ error: 'Failed to revert version' }, { status: 500 });
  }
});
