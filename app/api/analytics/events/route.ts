import { NextRequest, NextResponse } from 'next/server';
import { createDirectus, rest, staticToken, createItems } from '@directus/sdk';

// Create server-side Directus client
function getDirectusClient() {
  const url = process.env.DIRECTUS_URL || 'http://localhost:8055';
  const token = process.env.DIRECTUS_STATIC_TOKEN || '';
  return createDirectus(url).with(rest()).with(staticToken(token));
}

interface AnalyticsEvent {
  type: 'page_view' | 'search' | 'click' | 'session_start';
  session_id: string;
  url: string;
  path: string;
  title?: string;
  referrer?: string;
  user_agent?: string;
  data?: Record<string, any>;
  timestamp?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid events data' }, { status: 400 });
    }

    const directus = getDirectusClient();
    
    // Get client info from request headers
    const userAgent = req.headers.get('user-agent') || undefined;
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined;
    
    // Transform events for Directus - handle both flat and nested formats
    const directusEvents = events.map((event: any) => {
      // Extract from nested data object (client tracker format) or flat format
      const eventData = event.data || {};
      return {
        type: event.type,
        session_id: event.session_id || eventData.sessionId || 'unknown',
        url: event.url || eventData.url || '',
        path: event.path || eventData.path || new URL(eventData.url || 'http://localhost/').pathname,
        title: event.title || eventData.title || null,
        referrer: event.referrer || eventData.referrer || (typeof document !== 'undefined' ? document.referrer : null),
        user_agent: userAgent || eventData.userAgent,
        ip_address: ip,
        data: eventData, // Store full data object for search queries, etc.
        // timestamp is auto-set by Directus
      };
    });

    // Batch insert events to Directus
    try {
      await directus.request(createItems('analytics_events', directusEvents));
    } catch (dbError) {
      // Log but don't fail - analytics shouldn't break the app
      console.error('Failed to store analytics events:', dbError);
    }

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    console.error('Analytics events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
