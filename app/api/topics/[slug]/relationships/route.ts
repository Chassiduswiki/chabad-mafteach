import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

const directus = createClient();

// GET - Get all relationships for a specific topic
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // First, get the topic ID from slug (slug could be ID or actual slug)
    let topicId: number;

    if (/^\d+$/.test(slug)) {
      topicId = parseInt(slug);
    } else {
      const topics = await directus.request(
        readItems('topics', {
          filter: { slug: { _eq: slug } },
          fields: ['id'],
          limit: 1,
        } as any)
      );

      if ((topics as any[]).length === 0) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
      }

      topicId = (topics as any[])[0].id;
    }

    // Get all relationships where this topic is either parent or child
    const relationships = await directus.request(
      readItems('topic_relationships', {
        filter: {
          _or: [
            { parent_topic_id: { _eq: topicId } },
            { child_topic_id: { _eq: topicId } },
          ],
        },
        fields: [
          'id',
          'relation_type',
          'strength',
          'display_order',
          'description',
          'parent_topic_id',
          'child_topic_id',
        ] as any,
        sort: ['display_order', 'id'],
      } as any)
    );

    // Fetch related topic details
    const relatedTopicIds = new Set<number>();
    (relationships as any[]).forEach((rel) => {
      if (rel.parent_topic_id && rel.parent_topic_id !== topicId) {
        relatedTopicIds.add(rel.parent_topic_id);
      }
      if (rel.child_topic_id && rel.child_topic_id !== topicId) {
        relatedTopicIds.add(rel.child_topic_id);
      }
    });

    let relatedTopicsMap: Record<number, any> = {};

    if (relatedTopicIds.size > 0) {
      const relatedTopics = await directus.request(
        readItems('topics', {
          filter: { id: { _in: Array.from(relatedTopicIds) } },
          fields: ['id', 'canonical_title', 'slug', 'topic_type'] as any,
        } as any)
      );

      (relatedTopics as any[]).forEach((t) => {
        relatedTopicsMap[t.id] = t;
      });
    }

    // Transform relationships to include nested topic objects
    const transformedRelationships = (relationships as any[]).map((rel) => ({
      id: rel.id,
      relation_type: rel.relation_type,
      strength: rel.strength,
      display_order: rel.display_order,
      description: rel.description,
      parent_topic_id: rel.parent_topic_id,
      child_topic_id: rel.child_topic_id,
      parentTopic: relatedTopicsMap[rel.parent_topic_id] || null,
      childTopic: relatedTopicsMap[rel.child_topic_id] || null,
    }));

    return NextResponse.json({ data: transformedRelationships });
  } catch (error) {
    console.error('Failed to fetch topic relationships:', error);
    return handleApiError(error);
  }
}
