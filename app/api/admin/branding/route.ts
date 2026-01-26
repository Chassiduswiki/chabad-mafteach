import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem, createItem } from '@directus/sdk';
import { requireAuth } from '@/lib/auth';

const directus = createClient();

/**
 * Admin Branding & Theme API
 * 
 * Manages site-wide branding settings (CSS/JS injection, colors, fonts)
 * stored in a singleton-like topic or a dedicated settings collection.
 */

export const GET = requireAuth(async (request: NextRequest, context: { userId: string; role: string }) => {
  if (context.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const settings = await directus.request(readItems('topics', {
      filter: { slug: { _eq: 'site-branding-settings' } },
      limit: 1
    } as any));

    return NextResponse.json({ 
      settings: (settings as any[])[0]?.metadata?.branding || {} 
    });
  } catch (error) {
    console.error('Branding fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 });
  }
});

export const POST = requireAuth(async (request: NextRequest, context: { userId: string; role: string }) => {
  if (context.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { branding } = body;

    // Find or create the settings topic
    const existing = await directus.request(readItems('topics', {
      filter: { slug: { _eq: 'site-branding-settings' } },
      limit: 1
    } as any));

    if ((existing as any[]).length > 0) {
      await directus.request(updateItem('topics', (existing as any[])[0].id, {
        metadata: { 
          ...(existing as any[])[0].metadata,
          branding 
        }
      } as any));
    } else {
      await directus.request(createItem('topics', {
        canonical_title: 'Site Branding Settings',
        slug: 'site-branding-settings',
        topic_type: 'system',
        metadata: { branding }
      } as any));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Branding update failed:', error);
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 });
  }
});
