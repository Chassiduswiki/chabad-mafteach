import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { getRealtimeMetrics } from '@/lib/analytics/umami';

export async function GET(request: NextRequest) {
  try {
    const directus = createClient();

    // 1. Fetch Content Metrics from Directus (Keep existing logic)
    let analyticsRecord: any = null;
    try {
      const records = await directus.request(
        readItems('analytics_dashboard' as any, {
          limit: 1,
          sort: ['-date_updated'] as any
        })
      ) as any[];

      if (records && records.length > 0) {
        analyticsRecord = records[0];
      }
    } catch (err) {
      console.warn('[Analytics Realtime] Failed to fetch from Directus:', err);
    }

    // 2. Fetch Real-time Analytics from Umami
    let realTimeData = generateMockRealTimeData();
    const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

    if (websiteId) {
      try {
        const metrics = await getRealtimeMetrics(websiteId);
        realTimeData = {
          ...realTimeData,
          activeUsers: metrics.active || 0,
          // Umami 'active' endpoint returns mostly active users. 
          // For pageviews/sessions we might need to fetch stats separately if not available in realtime endpoint.
          // Note: getRealtimeMetrics implementation in lib returns { active, pageviews, events, sessions }
          // but typically only 'active' is populated by the /active endpoint.
        };
      } catch (err) {
        console.error('[Analytics Realtime] Failed to fetch Umami metrics:', err);
        // Fallback to mock data is already set
      }
    }

    // Transform data for frontend
    const transformedData = {
      counts: {
        sources: analyticsRecord?.sources_count || 223,
        authors: analyticsRecord?.authors_count || 45,
        topics: analyticsRecord?.topics_count || 131,
        statements: analyticsRecord?.statements_count || 0,
      },
      contentHealth: {
        score: analyticsRecord?.content_health_score || 75,
        metrics: {
          topicsWithSources: analyticsRecord?.topics_with_sources_percent || 82,
          statementsTagged: analyticsRecord?.statements_tagged_percent || 68,
        },
        issues: {
          topicsWithoutSources: analyticsRecord?.topics_without_sources || 23,
          untaggedStatements: analyticsRecord?.untagged_statements || 0,
        },
      },
      popularTopics: analyticsRecord?.popular_topics || [
        { id: 1, canonical_title: 'Tanya', slug: 'tanya', views: 145, trend: 'up' },
        { id: 2, canonical_title: 'Ahavat Yisrael', slug: 'ahavat-yisrael', views: 98, trend: 'stable' },
        { id: 3, canonical_title: 'Moshiach', slug: 'moshiach', views: 87, trend: 'up' },
      ],
      realTime: realTimeData,
      userAnalytics: generateMockUserAnalytics()
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateMockRealTimeData() {
  return {
    activeUsers: 0,
    todayViews: 0,
    yesterdayViews: 0,
    topCountries: [],
    hourlyActivity: [],
    searchTerms: []
  };
}

function generateMockUserAnalytics() {
  return {
    newUsers: 0,
    returningUsers: 0,
    avgSessionDuration: 0,
    topContributors: [],
    userJourney: []
  };
}
