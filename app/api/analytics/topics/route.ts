import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { getTopPages } from '@/lib/analytics/umami';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';
    
    // Calculate date range
    const endAt = new Date();
    const startAt = new Date();
    if (range === '7d') {
      startAt.setDate(endAt.getDate() - 7);
    } else if (range === '30d') {
      startAt.setDate(endAt.getDate() - 30);
    } else {
      startAt.setHours(endAt.getHours() - 24); // 24h default
    }

    const websiteId = process.env.UMAMI_WEBSITE_ID;
    const umamiHost = process.env.UMAMI_HOST;
    const umamiUsername = process.env.UMAMI_USERNAME;
    const umamiPassword = process.env.UMAMI_PASSWORD;
    const umamiCloudKey = process.env.UMAMI_CLOUD_API_KEY || process.env.UMAMI_API_KEY;

    // Try to get real analytics from Umami if configured
    // - Cloud: UMAMI_CLOUD_API_KEY (or UMAMI_API_KEY) + UMAMI_WEBSITE_ID
    // - Self-hosted: UMAMI_HOST + UMAMI_USERNAME + UMAMI_PASSWORD + UMAMI_WEBSITE_ID
    if (websiteId && (umamiCloudKey || (umamiHost && umamiUsername && umamiPassword))) {
      try {
        // Get top pages from Umami
        const topPages = await getTopPages(websiteId, startAt, endAt, 100);
        
        // Get topics from Directus to map URLs
        const directus = createClient();
        const topics = await directus.request(readItems('topics', {
          fields: ['id', 'canonical_title', 'slug', 'topic_type', 'status', 'date_updated', 'date_created'],
          sort: ['-date_updated'],
          limit: 200
        }));

        // Create URL-to-topic mapping
        const topicMap = new Map();
        topics.forEach((topic: any) => {
          const url = `/topics/${topic.slug}`;
          topicMap.set(url, topic);
        });

        // Merge Umami data with topic data
        const topicsWithAnalytics = topPages
          .filter(page => topicMap.has(page.url)) // Only include actual topic pages
          .map(page => {
            const topic = topicMap.get(page.url);
            return {
              id: topic.id,
              canonical_title: topic.canonical_title,
              slug: topic.slug,
              topic_type: topic.topic_type,
              status: topic.status,
              // Real analytics data from Umami
              views: page.pageviews,
              visitors: page.visitors,
              bounces: page.bounces,
              // Calculate trend based on recent activity
              trend: page.pageviews > 10 ? 'up' : page.pageviews > 0 ? 'stable' : undefined,
              changePercent: page.pageviews > 0 ? Math.min(page.pageviews * 2, 100) : 0
            };
          });

        // Sort by views
        topicsWithAnalytics.sort((a, b) => b.views - a.views);

        // Calculate summary from real data
        const publishedTopics = topicsWithAnalytics.filter(t => t.status === 'published');
        const totalViews = topicsWithAnalytics.reduce((sum, t) => sum + t.views, 0);
        const totalVisitors = topicsWithAnalytics.reduce((sum, t) => sum + (t.visitors || 0), 0);
        
        const summary = {
          totalViews,
          totalTopics: publishedTopics.length,
          avgViewsPerTopic: publishedTopics.length > 0 ? Math.round(totalViews / publishedTopics.length * 10) / 10 : 0
        };

        return NextResponse.json({
          topics: topicsWithAnalytics,
          summary,
          dataSource: 'umami', // Using real Umami analytics
          dateRange: { startAt: startAt.toISOString(), endAt: endAt.toISOString() }
        });
      } catch (umamiError) {
        console.error('Umami analytics error, falling back to Directus:', umamiError);
        // Fall back to Directus data if Umami fails
      }
    }

    // Fallback: Use Directus statement counts as proxy
    const directus = createClient();
    const topics = await directus.request(readItems('topics', {
      fields: ['id', 'canonical_title', 'slug', 'topic_type', 'status', 'date_updated', 'date_created'],
      sort: ['-date_updated'],
      limit: 200
    }));

    // Get statement counts per topic via statement_topics junction
    let statementCounts: Record<number, number> = {};
    try {
      const statementTopics = await directus.request(readItems('statement_topics' as any, {
        fields: ['topic_id'],
        limit: -1
      }));
      
      statementTopics.forEach((st: any) => {
        if (st.topic_id) {
          statementCounts[st.topic_id] = (statementCounts[st.topic_id] || 0) + 1;
        }
      });
    } catch (e) {
      console.log('Could not fetch statement_topics:', e);
    }

    // Transform to analytics format - use statement counts as a proxy for "engagement"
    const topicsWithAnalytics = topics.map((topic: any) => {
      const stmtCount = statementCounts[topic.id] || 0;
      return {
        id: topic.id,
        canonical_title: topic.canonical_title,
        slug: topic.slug,
        topic_type: topic.topic_type,
        status: topic.status,
        // Use statement count as proxy for content depth/views
        views: stmtCount,
        trend: stmtCount > 5 ? 'up' : stmtCount > 0 ? 'stable' : undefined,
        changePercent: stmtCount > 0 ? Math.min(stmtCount * 10, 100) : 0
      };
    });

    // Sort by "views" (statement count) descending
    topicsWithAnalytics.sort((a, b) => b.views - a.views);

    // Calculate summary
    const publishedTopics = topicsWithAnalytics.filter(t => t.status === 'published');
    const totalStatements = Object.values(statementCounts).reduce((sum, count) => sum + count, 0);
    
    const summary = {
      totalViews: totalStatements, // Total statements as proxy
      totalTopics: publishedTopics.length,
      avgViewsPerTopic: publishedTopics.length > 0 ? Math.round(totalStatements / publishedTopics.length * 10) / 10 : 0
    };

    return NextResponse.json({
      topics: topicsWithAnalytics,
      summary,
      dataSource: 'directus', // Using Directus data as fallback
      note: 'Views represent statement counts. Configure Umami for real page views.'
    });
  } catch (error) {
    console.error('Topics analytics error:', error);
    return NextResponse.json({ 
      topics: [], 
      summary: { totalViews: 0, totalTopics: 0, avgViewsPerTopic: 0 },
      error: 'Failed to fetch analytics'
    });
  }
}
