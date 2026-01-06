import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * GET /api/recommendations?topicId=123&limit=5
 * Get topic recommendations based on category and relationships
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const topicId = searchParams.get('topicId');
        const limit = parseInt(searchParams.get('limit') || '5');

        if (!topicId) {
            return NextResponse.json(
                { error: 'Topic ID is required' },
                { status: 400 }
            );
        }

        const directus = createClient();

        // Get the current topic to understand its category
        const currentTopic = await directus.request(readItems('topics', {
            filter: { id: { _eq: parseInt(topicId) } } as any,
            fields: ['id', 'canonical_title', 'topic_type', 'slug']
        })) as any[];

        if (!currentTopic || currentTopic.length === 0) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        const topic = currentTopic[0];
        const category = topic.topic_type;

        // Find related topics in the same category
        const categoryRecommendations = await directus.request(readItems('topics', {
            filter: {
                _and: [
                    { topic_type: { _eq: category } },
                    { id: { _neq: parseInt(topicId) } }
                ]
            } as any,
            fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
            limit: Math.min(limit, 10) // Get up to 10 for now, we'll rank them
        })) as any[];

        // Get topics with relationship data (from topic_relationships)
        const relatedTopics: any[] = [];

        try {
            // Get relationships where current topic is the parent
            const parentRelationships = await directus.request(readItems('topic_relationships', {
                filter: { parent_topic_id: { _eq: parseInt(topicId) } } as any,
                fields: ['*', { child_topic_id: ['id', 'canonical_title', 'slug', 'topic_type', 'description'] }] as any,
                sort: ['-strength'] as any
            })) as any[];

            // Get relationships where current topic is the child
            const childRelationships = await directus.request(readItems('topic_relationships', {
                filter: { child_topic_id: { _eq: parseInt(topicId) } } as any,
                fields: ['*', { parent_topic_id: ['id', 'canonical_title', 'slug', 'topic_type', 'description'] }] as any,
                sort: ['-strength'] as any
            })) as any[];

            // Add related topics from relationships
            parentRelationships.forEach(rel => {
                if (rel.child_topic_id) relatedTopics.push(rel.child_topic_id);
            });
            childRelationships.forEach(rel => {
                if (rel.parent_topic_id) relatedTopics.push(rel.parent_topic_id);
            });
        } catch (error) {
            // Relationships might not be set up yet, continue without them
            console.warn('Could not fetch topic relationships:', error);
        }

        // Combine and deduplicate recommendations
        const allRecommendations = [...categoryRecommendations, ...relatedTopics];
        const uniqueRecommendations = allRecommendations.filter((rec, index, self) =>
            index === self.findIndex(r => r.id === rec.id)
        );

        // Take only the requested limit
        const finalRecommendations = uniqueRecommendations.slice(0, limit);

        return NextResponse.json({
            currentTopic: {
                id: topic.id,
                title: topic.canonical_title,
                category: topic.topic_type
            },
            recommendations: finalRecommendations.map(rec => ({
                id: rec.id,
                title: rec.canonical_title,
                slug: rec.slug,
                category: rec.topic_type,
                description: rec.description,
                reason: rec.topic_type === category ? 'same_category' : 'related'
            }))
        });

    } catch (error) {
        console.error('Recommendations error:', error);
        return NextResponse.json(
            { error: 'Failed to get recommendations' },
            { status: 500 }
        );
    }
}
