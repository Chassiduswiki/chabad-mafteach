import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET(request: NextRequest) {
  try {
    const directus = createClient();
    
    // Attempt to fetch dashboard metrics from Directus
    // Using a try-catch block for the request to handle missing collections or records gracefully
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
      console.warn('[Analytics Realtime] Failed to fetch from Directus, using mock data:', err);
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
      realTime: generateMockRealTimeData(),
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
    activeUsers: Math.floor(Math.random() * 50) + 10,
    todayViews: Math.floor(Math.random() * 1000) + 500,
    yesterdayViews: Math.floor(Math.random() * 1000) + 400,
    topCountries: [
      { country: 'United States', count: 234, flag: '🇺🇸' },
      { country: 'Israel', count: 156, flag: '🇮🇱' },
      { country: 'United Kingdom', count: 98, flag: '🇬🇧' },
      { country: 'Canada', count: 67, flag: '🇨🇦' },
      { country: 'Australia', count: 45, flag: '🇦🇺' },
    ],
    hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      views: Math.floor(Math.random() * 100),
      users: Math.floor(Math.random() * 50)
    })),
    searchTerms: [
      { term: 'Tanya chapter 1', count: 45 },
      { term: 'Chabad philosophy', count: 32 },
      { term: 'Moshiach', count: 28 },
      { term: 'Teshuvah', count: 21 },
      { term: 'Ahavat Yisrael', count: 19 },
    ]
  };
}

function generateMockUserAnalytics() {
  return {
    newUsers: Math.floor(Math.random() * 20) + 5,
    returningUsers: Math.floor(Math.random() * 100) + 50,
    avgSessionDuration: Math.floor(Math.random() * 300) + 120,
    topContributors: [
      { name: 'Rabbi Cohen', contributions: 45 },
      { name: 'Sarah Levy', contributions: 32 },
      { name: 'David Weiss', contributions: 28 },
    ],
    userJourney: [
      { from: 'Homepage', to: 'Topics', count: 234 },
      { from: 'Topics', to: 'Tanya', count: 156 },
      { from: 'Tanya', to: 'Chapter 1', count: 89 },
    ]
  };
}
