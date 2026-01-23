import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { createItems } from '@directus/sdk';

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();
    
    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid events data' }, { status: 400 });
    }
    
    // Store events in Directus
    const directus = createClient();
    
    // Transform events for Directus
    const transformedEvents = events.map(event => ({
      type: event.type,
      session_id: event.data.sessionId,
      user_id: event.data.userId || null,
      url: event.data.url,
      path: event.data.path,
      title: event.data.title,
      referrer: event.data.referrer || null,
      user_agent: event.data.userAgent,
      ip_address: event.data.ipAddress || null,
      country: event.data.country || null,
      city: event.data.city || null,
      data: {
        ...event.data,
        // Remove fields that are already in the main table
        sessionId: undefined,
        userId: undefined,
        url: undefined,
        path: undefined,
        title: undefined,
        referrer: undefined,
        userAgent: undefined,
        ipAddress: undefined,
        country: undefined,
        city: undefined,
      },
      timestamp: new Date(event.timestamp).toISOString()
    }));
    
    // Create items in Directus
    await directus.request(
      createItems('analytics_events' as any, transformedEvents) as any
    );
    
    return NextResponse.json({ success: true, received: events.length });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Failed to track events' }, { status: 500 });
  }
}
