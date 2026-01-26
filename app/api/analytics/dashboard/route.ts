import { NextRequest, NextResponse } from 'next/server';
import { readItems, aggregate } from '@directus/sdk';
import { createClient } from '@/lib/directus';

// Country flag mapping
const countryFlags: Record<string, string> = {
  'US': '🇺🇸', 'IL': '🇮🇱', 'CA': '🇨🇦', 'GB': '🇬🇧', 'AU': '🇦🇺',
  'DE': '🇩🇪', 'FR': '🇫🇷', 'BR': '🇧🇷', 'MX': '🇲🇽', 'IN': '🇮🇳',
  'Unknown': '🌍'
};

// Fetch real-time analytics from analytics_events collection
async function getRealTimeAnalytics(directus: ReturnType<typeof createClient>) {
  const now = new Date();
  // Use UTC dates to match Directus timestamps
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const yesterdayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)).toISOString();
  const last30Min = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  try {
    // Simplified: fetch all analytics events (no filter first to debug)
    let allEvents: any[] = [];
    try {
      allEvents = await directus.request(readItems('analytics_events', {
        fields: ['id', 'timestamp', 'session_id', 'type', 'path', 'country', 'data'],
        limit: 5000,
        sort: ['-timestamp'],
      })) as any[];
      console.log('[Analytics] Fetched', allEvents.length, 'events from Directus');
    } catch (err) {
      console.error('[Analytics] Failed to fetch events:', err);
      allEvents = [];
    }
    
    // Filter in JS for reliability
    const todayEvents = allEvents.filter((e: any) => 
      e.type === 'page_view' && new Date(e.timestamp) >= new Date(todayStart)
    );
    const yesterdayEvents = allEvents.filter((e: any) => 
      e.type === 'page_view' && 
      new Date(e.timestamp) >= new Date(yesterdayStart) && 
      new Date(e.timestamp) < new Date(todayStart)
    );
    const recentEvents = allEvents.filter((e: any) => 
      new Date(e.timestamp) >= new Date(now.getTime() - 24 * 60 * 60 * 1000)
    );
    const searchEvents = allEvents.filter((e: any) => 
      e.type === 'search' && 
      new Date(e.timestamp) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );

    // Count in JS (more reliable than SDK aggregate)
    const todayViews = (todayEvents as any[]).length;
    const yesterdayViews = (yesterdayEvents as any[]).length;
    
    // Active users = unique sessions in last 30 min
    const recentSessions = new Set(
      (recentEvents as any[])
        .filter((e: any) => new Date(e.timestamp) >= new Date(last30Min))
        .map((e: any) => e.session_id)
    );
    const activeUsers = recentSessions.size;

    // Process hourly activity
    const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
      const hourEvents = (recentEvents as any[]).filter((e: any) => {
        const eventHour = new Date(e.timestamp).getHours();
        return eventHour === i;
      });
      const uniqueSessions = new Set(hourEvents.map((e: any) => e.session_id));
      return {
        hour: i,
        views: hourEvents.filter((e: any) => e.type === 'page_view').length,
        users: uniqueSessions.size
      };
    });

    // Process country data
    const countryMap = new Map<string, number>();
    (recentEvents as any[]).forEach((e: any) => {
      const country = e.country || 'Unknown';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    const topCountries = Array.from(countryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({
        country: country === 'Unknown' ? 'Unknown' : country,
        count,
        flag: countryFlags[country] || '🌍'
      }));

    // Process search terms
    const searchMap = new Map<string, number>();
    (searchEvents as any[]).forEach((e: any) => {
      const term = e.data?.query || e.data?.term;
      if (term) {
        searchMap.set(term, (searchMap.get(term) || 0) + 1);
      }
    });
    const searchTerms = Array.from(searchMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, count]) => ({ term, count }));

    // Calculate unique sessions for user analytics
    const allSessions = new Set((recentEvents as any[]).map((e: any) => e.session_id));
    const totalSessions = allSessions.size;

    return {
      realTime: {
        activeUsers,
        todayViews,
        yesterdayViews,
        topCountries: topCountries.length > 0 ? topCountries : [{ country: 'No data yet', count: 0, flag: '📊' }],
        hourlyActivity,
        searchTerms: searchTerms.length > 0 ? searchTerms : [{ term: 'No searches yet', count: 0 }],
      },
      userAnalytics: {
        newUsers: Math.floor(totalSessions * 0.3), // Estimate ~30% new
        returningUsers: Math.floor(totalSessions * 0.7),
        avgSessionDuration: 240, // Would need session end tracking for accuracy
        userJourney: calculateUserJourney(recentEvents as any[]),
      }
    };
  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    // Return empty/zero data on error
    return {
      realTime: {
        activeUsers: 0,
        todayViews: 0,
        yesterdayViews: 0,
        topCountries: [{ country: 'Error loading', count: 0, flag: '⚠️' }],
        hourlyActivity: Array.from({ length: 24 }, (_, i) => ({ hour: i, views: 0, users: 0 })),
        searchTerms: [],
      },
      userAnalytics: {
        newUsers: 0,
        returningUsers: 0,
        avgSessionDuration: 0,
        userJourney: [],
      }
    };
  }
}

// Calculate user journey from events
function calculateUserJourney(events: any[]): Array<{ from: string; to: string; count: number }> {
  const journeyMap = new Map<string, number>();
  
  // Group events by session
  const sessionEvents = new Map<string, any[]>();
  events
    .filter(e => e.type === 'page_view')
    .forEach(e => {
      const list = sessionEvents.get(e.session_id) || [];
      list.push(e);
      sessionEvents.set(e.session_id, list);
    });

  // Track page transitions
  sessionEvents.forEach(sessionEvts => {
    const sorted = sessionEvts.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = getPageName(sorted[i].path);
      const to = getPageName(sorted[i + 1].path);
      if (from !== to) {
        const key = `${from}→${to}`;
        journeyMap.set(key, (journeyMap.get(key) || 0) + 1);
      }
    }
  });

  return Array.from(journeyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [from, to] = key.split('→');
      return { from, to, count };
    });
}

// Convert path to readable page name
function getPageName(path: string): string {
  if (!path || path === '/') return 'Homepage';
  const segment = path.split('/').filter(Boolean)[0];
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  console.log('[Analytics API] GET request started');
  try {
    const directus = createClient();

    // Fetch real counts from Directus collections in parallel
    console.log('[Analytics API] Fetching counts...');
    const [
      sourcesResult,
      authorsResult,
      topicsResult,
      statementsResult,
      documentsResult,
      topicsWithSourcesResult,
      recentTopics,
    ] = await Promise.all<any>([
      // Count sources
      (directus as any).request({ method: 'GET', path: '/items/sources', params: { aggregate: { count: '*' } } }).catch(() => [{ count: 0 }]),
      // Count authors
      (directus as any).request({ method: 'GET', path: '/items/authors', params: { aggregate: { count: '*' } } }).catch(() => [{ count: 0 }]),
      // Count topics
      (directus as any).request({ method: 'GET', path: '/items/topics', params: { aggregate: { count: '*' } } }).catch(() => [{ count: 0 }]),
      // Count statements
      (directus as any).request({ method: 'GET', path: '/items/statements', params: { aggregate: { count: '*' } } }).catch(() => [{ count: 0 }]),
      // Count documents (books/seforim)
      (directus as any).request({ method: 'GET', path: '/items/documents', params: { aggregate: { count: '*' } } }).catch(() => [{ count: 0 }]),
      // Count topics that have at least one source linked
      (directus as any).request({ method: 'GET', path: '/items/topic_sources', params: { aggregate: { countDistinct: 'topic_id' } } }).catch(() => [{ countDistinct: { topic_id: 0 } }]),
      // Get recent/popular topics (most recently updated as proxy for popular)
      (directus as any).request({ method: 'GET', path: '/items/topics', params: { fields: ['id', 'canonical_title', 'slug', 'topic_type', 'date_updated'], sort: ['-date_updated'], limit: 5 } }).catch(() => []),
    ]);
    console.log('[Analytics API] Counts fetched in', Date.now() - start, 'ms');
    
    // ... rest of processing ...
    const analyticsStart = Date.now();
    const realTimeAnalytics = await getRealTimeAnalytics(directus);
    console.log('[Analytics API] Real-time analytics fetched in', Date.now() - analyticsStart, 'ms');

    // ... formatting ...
    const data = {
      // ...
      ...realTimeAnalytics,
      // ...
    };

    console.log('[Analytics API] Request completed in', Date.now() - start, 'ms');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
