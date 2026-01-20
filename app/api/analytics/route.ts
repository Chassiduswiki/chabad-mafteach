import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem, createItem } from '@directus/sdk';

/**
 * POST /api/analytics/track-view
 * Track a topic view for analytics
 */
export async function POST(request: NextRequest) {
    try {
        const { topicId, sessionId } = await request.json();

        if (!topicId) {
            return NextResponse.json(
                { error: 'Topic ID is required' },
                { status: 400 }
            );
        }

        const directus = createClient();

        // Check if analytics record exists for this topic
        const existingAnalytics = await directus.request(readItems('topic_analytics' as any, {
            filter: { topic_id: { _eq: parseInt(topicId) } } as any,
            limit: 1
        })) as any[];

        const now = new Date().toISOString();

        if (existingAnalytics.length > 0) {
            // Update existing record
            const analytics = existingAnalytics[0];
            await directus.request(updateItem('topic_analytics' as any, analytics.id, {
                views: analytics.views + 1,
                last_viewed: now
                // TODO: Add unique visitor tracking with sessionId
            }));

            return NextResponse.json({ success: true, updated: true });
        } else {
            // Create new analytics record
            await directus.request(createItem('topic_analytics' as any, {
                topic_id: parseInt(topicId),
                views: 1,
                unique_visitors: 1, // TODO: Implement proper unique visitor counting
                avg_time_spent: 0,
                last_viewed: now
            }));

            return NextResponse.json({ success: true, created: true });
        }

    } catch (error) {
        console.error('Analytics tracking error:', error);
        return NextResponse.json(
            { error: 'Failed to track view' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/analytics/popular-topics
 * Get topics sorted by popularity (views)
 */
export async function GET() {
    try {
        const directus = createClient();

        // Get topics with their analytics data
        const analytics = await directus.request(readItems('topic_analytics' as any, {
            fields: ['topic_id', 'views', 'last_viewed'],
            sort: ['-views'] as any,
            limit: 20
        })) as any[];

        // Get topic details for the top viewed topics
        const topicIds = analytics.map(a => a.topic_id);
        if (topicIds.length === 0) {
            return NextResponse.json({ topics: [] });
        }

        const topics = await directus.request(readItems('topics', {
            filter: { id: { _in: topicIds } } as any,
            fields: ['id', 'canonical_title', 'slug', 'topic_type']
        })) as any[];

        // Combine analytics with topic data
        const popularTopics = analytics.map(analytics => {
            const topic = topics.find(t => t.id === analytics.topic_id);
            return {
                ...topic,
                views: analytics.views,
                last_viewed: analytics.last_viewed
            };
        }).filter(t => t.canonical_title); // Filter out any missing topics

        return NextResponse.json({ topics: popularTopics });

    } catch (error) {
        console.error('Popular topics fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch popular topics' },
            { status: 500 }
        );
    }
}
