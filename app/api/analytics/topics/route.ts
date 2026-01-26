import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';

    const directus = createClient();

    // Get all topics with their data
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
      
      // Count statements per topic
      statementTopics.forEach((st: any) => {
        if (st.topic_id) {
          statementCounts[st.topic_id] = (statementCounts[st.topic_id] || 0) + 1;
        }
      });
    } catch (e) {
      // statement_topics might not exist or be accessible
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
      dataSource: 'directus', // Using Directus data
      note: 'Views represent statement counts. Connect analytics provider for real page views.'
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
