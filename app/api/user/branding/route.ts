import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem, readMe } from '@directus/sdk';
import { requireAuth } from '@/lib/auth';

const directus = createClient();

/**
 * User Branding Preferences API
 * 
 * Manages user-specific branding settings stored in directus_users.branding_preferences
 * This allows each user to have their own visual preferences applied site-wide
 */

export const GET = requireAuth(async (request: NextRequest, context: { userId: string; role: string }) => {
  try {
    // Get current user's branding preferences
    const users = await directus.request(readItems('directus_users', {
      filter: { id: { _eq: context.userId } },
      fields: ['branding_preferences'],
      limit: 1
    } as any));

    const user = (users as any[])[0];
    
    return NextResponse.json({ 
      preferences: user?.branding_preferences || {} 
    });
  } catch (error) {
    console.error('Failed to fetch user branding preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
});

export const POST = requireAuth(async (request: NextRequest, context: { userId: string; role: string }) => {
  try {
    const body = await request.json();
    const { preferences } = body;

    // Update current user's branding preferences
    await directus.request(updateItem('directus_users', context.userId, {
      branding_preferences: preferences
    } as any));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update user branding preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
});
