import { NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, aggregate } from '@directus/sdk';

/**
 * GET /api/analytics/dashboard
 * 
 * Aggregated dashboard metrics for admin panel
 * Returns all stats in a single request to improve performance
 * 
 * @returns {Object} Dashboard metrics including:
 *   - counts: Total counts for books, authors, topics, statements
 *   - contentHealth: Quality metrics (topics with sources, untagged statements, etc.)
 *   - popularTopics: Top 10 most viewed topics
 *   - recentActivity: Latest edits and changes
 *   - trends: Growth metrics (new content this week/month)
 */
export async function GET() {
    try {
        const directus = createClient();

        // Fetch all data in parallel for performance
        const [
            topicsCount,
            sourcesCount,
            authorsCount,
            statementsCount,
            popularTopics,
            topicsWithSources,
            untaggedStatements,
            recentTopics
        ] = await Promise.all([
            // Counts - using type assertions for Directus SDK compatibility
            directus.request(aggregate('topics' as any, {
                aggregate: { count: '*' } as any
            }) as any),
            directus.request(aggregate('sources' as any, {
                aggregate: { count: '*' } as any
            }) as any),
            directus.request(aggregate('authors' as any, {
                aggregate: { count: '*' } as any
            }) as any),
            directus.request(aggregate('statements' as any, {
                aggregate: { count: '*' } as any
            }) as any),

            // Popular topics (from analytics)
            fetchPopularTopics(directus),

            // Content health metrics
            fetchTopicsWithSources(directus),
            fetchUntaggedStatements(directus),

            // Recent activity
            fetchRecentTopics(directus)
        ]);

        // Calculate content health score (0-100)
        const totalTopics = (topicsCount as any)[0]?.count || 0;
        const topicsWithSourcesCount = topicsWithSources.length;
        const totalStatements = (statementsCount as any)[0]?.count || 0;
        const untaggedCount = untaggedStatements.length;

        const healthMetrics = {
            topicsWithSources: totalTopics > 0 ? Math.round((topicsWithSourcesCount / totalTopics) * 100) : 0,
            statementsTagged: totalStatements > 0 ? Math.round(((totalStatements - untaggedCount) / totalStatements) * 100) : 0,
        };

        const healthScore = Math.round((healthMetrics.topicsWithSources + healthMetrics.statementsTagged) / 2);

        return NextResponse.json({
            counts: {
                topics: totalTopics,
                sources: (sourcesCount as any)[0]?.count || 0,
                authors: (authorsCount as any)[0]?.count || 0,
                statements: totalStatements,
            },
            contentHealth: {
                score: healthScore,
                metrics: {
                    topicsWithSources: healthMetrics.topicsWithSources,
                    statementsTagged: healthMetrics.statementsTagged,
                },
                issues: {
                    topicsWithoutSources: totalTopics - topicsWithSourcesCount,
                    untaggedStatements: untaggedCount,
                }
            },
            popularTopics: popularTopics.slice(0, 10),
            recentActivity: {
                recentTopics: recentTopics.slice(0, 5),
            },
            trends: {
                // TODO: Implement time-based trends
                newTopicsThisWeek: 0,
                newTopicsThisMonth: 0,
            }
        });

    } catch (error) {
        console.error('Dashboard analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard analytics' },
            { status: 500 }
        );
    }
}

/**
 * Fetch popular topics with their analytics data
 */
async function fetchPopularTopics(directus: any) {
    try {
        // @ts-ignore - Directus SDK type strictness workaround
        const analytics = await directus.request(readItems('topic_analytics' as any, {
            fields: ['topic_id', 'views', 'last_viewed'],
            sort: ['-views'] as any,
            limit: 20
        })) as any[];

        if (analytics.length === 0) return [];

        const topicIds = analytics.map(a => a.topic_id);
        // @ts-ignore - Directus SDK type strictness workaround
        const topics = await directus.request(readItems('topics' as any, {
            filter: { id: { _in: topicIds } } as any,
            fields: ['id', 'canonical_title', 'slug', 'topic_type']
        })) as any[];

        return analytics.map(analytics => {
            const topic = topics.find(t => t.id === analytics.topic_id);
            return {
                ...topic,
                views: analytics.views,
                last_viewed: analytics.last_viewed
            };
        }).filter(t => t.canonical_title);
    } catch (error) {
        console.error('Failed to fetch popular topics:', error);
        return [];
    }
}

/**
 * Fetch topics that have at least one source
 */
async function fetchTopicsWithSources(directus: any) {
    try {
        // Get all statement_topics mappings
        // @ts-ignore - Directus SDK type strictness workaround
        const mappings = await directus.request(readItems('statement_topics' as any, {
            fields: ['topic_id'],
            limit: -1
        })) as any[];

        // Get unique topic IDs
        const uniqueTopicIds = [...new Set(mappings.map(m => m.topic_id))];
        return uniqueTopicIds;
    } catch (error) {
        console.error('Failed to fetch topics with sources:', error);
        return [];
    }
}

/**
 * Fetch statements that are not tagged to any topic
 */
async function fetchUntaggedStatements(directus: any) {
    try {
        // Get all statement IDs that have tags
        // @ts-ignore - Directus SDK type strictness workaround
        const taggedStatements = await directus.request(readItems('statement_topics' as any, {
            fields: ['statement_id'],
            limit: -1
        })) as any[];

        const taggedIds = taggedStatements.map(s => s.statement_id);

        // Get all statements
        // @ts-ignore - Directus SDK type strictness workaround
        const allStatements = await directus.request(readItems('statements' as any, {
            fields: ['id'],
            limit: -1
        })) as any[];

        // Find untagged ones
        return allStatements.filter(s => !taggedIds.includes(s.id));
    } catch (error) {
        console.error('Failed to fetch untagged statements:', error);
        return [];
    }
}

/**
 * Fetch recently created topics
 */
async function fetchRecentTopics(directus: any) {
    try {
        // @ts-ignore - Directus SDK type strictness workaround
        return await directus.request(readItems('topics' as any, {
            fields: ['id', 'canonical_title', 'slug', 'date_created'],
            sort: ['-date_created'] as any,
            limit: 10
        })) as any[];
    } catch (error) {
        console.error('Failed to fetch recent topics:', error);
        return [];
    }
}
