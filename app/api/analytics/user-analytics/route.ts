import { NextRequest, NextResponse } from 'next/server';
import { getUmamiStats } from '@/lib/analytics/umami';

export async function GET(request: NextRequest) {
  try {
    const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

    // Default empty state
    let stats = {
      newUsers: 0,
      returningUsers: 0,
      avgSessionDuration: 0,
      visitors: 0,
      pageviews: 0
    };

    if (websiteId) {
      try {
        // Fetch last 30 days by default
        const endAt = new Date();
        const startAt = new Date();
        startAt.setDate(startAt.getDate() - 30);

        const response = await getUmamiStats(websiteId, startAt, endAt);
        const data = response.data[0];

        if (data) {
          stats = {
            newUsers: data.visitors, // Umami 'visitors' are unique visitors
            returningUsers: Math.max(0, data.visits - data.visitors), // Rough approximation
            avgSessionDuration: data.visitDuration, // In seconds
            visitors: data.visitors,
            pageviews: data.pageviews
          };
        }
      } catch (err) {
        console.error('[Analytics User] Failed to fetch Umami stats:', err);
      }
    }

    // Return structured analytics
    const response = {
      newUsers: stats.newUsers,
      returningUsers: stats.returningUsers,
      avgSessionDuration: stats.avgSessionDuration,
      // These fields require complex aggregation not available in basic stats
      topContributors: [],
      userJourney: []
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('User Analytics API error:', error);
    return NextResponse.json({
      newUsers: 0,
      returningUsers: 0,
      avgSessionDuration: 0,
      topContributors: [],
      userJourney: []
    });
  }
}
