import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, createItem, deleteItem } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

const directus = createClient();

// GET - List all topic relationships (with optional filter by topic)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const topicId = searchParams.get('topicId');

  try {
    let filter: any = {};

    if (topicId) {
      filter = {
        _or: [
          { parent_topic_id: { _eq: parseInt(topicId) } },
          { child_topic_id: { _eq: parseInt(topicId) } },
        ],
      };
    }

    const relationships = await directus.request(
      readItems('topic_relationships', {
        fields: [
          'id',
          'relation_type',
          'strength',
          'display_order',
          'description',
          'parent_topic_id',
          'child_topic_id',
          // Nested topic data
          { parent_topic_id: ['id', 'canonical_title', 'slug', 'topic_type'] },
          { child_topic_id: ['id', 'canonical_title', 'slug', 'topic_type'] },
        ] as any,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        sort: ['display_order', 'id'],
      } as any)
    );

    // Transform to include nested topic objects
    const transformedRelationships = (relationships as any[]).map((rel) => ({
      id: rel.id,
      relation_type: rel.relation_type,
      strength: rel.strength,
      display_order: rel.display_order,
      description: rel.description,
      parent_topic_id: typeof rel.parent_topic_id === 'object' ? rel.parent_topic_id?.id : rel.parent_topic_id,
      child_topic_id: typeof rel.child_topic_id === 'object' ? rel.child_topic_id?.id : rel.child_topic_id,
      parentTopic: typeof rel.parent_topic_id === 'object' ? rel.parent_topic_id : null,
      childTopic: typeof rel.child_topic_id === 'object' ? rel.child_topic_id : null,
    }));

    return NextResponse.json({ data: transformedRelationships });
  } catch (error) {
    console.error('Failed to fetch topic relationships:', error);
    return handleApiError(error);
  }
}

// POST - Create a new topic relationship
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { parent_topic_id, child_topic_id, relation_type, strength, description } = body;

    if (!parent_topic_id || !child_topic_id) {
      return NextResponse.json(
        { error: 'parent_topic_id and child_topic_id are required' },
        { status: 400 }
      );
    }

    // Check if relationship already exists
    const existing = await directus.request(
      readItems('topic_relationships', {
        filter: {
          _and: [
            { parent_topic_id: { _eq: parent_topic_id } },
            { child_topic_id: { _eq: child_topic_id } },
          ],
        },
        limit: 1,
      } as any)
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Relationship already exists between these topics' },
        { status: 409 }
      );
    }

    const newRelationship = await directus.request(
      createItem('topic_relationships', {
        parent_topic_id,
        child_topic_id,
        relation_type: relation_type || 'related_to',
        strength: strength || 0.5,
        description: description || null,
      })
    );

    return NextResponse.json({ data: newRelationship }, { status: 201 });
  } catch (error) {
    console.error('Failed to create topic relationship:', error);
    return handleApiError(error);
  }
}
