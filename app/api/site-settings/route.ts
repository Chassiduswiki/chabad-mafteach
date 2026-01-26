import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readSingleton } from '@directus/sdk';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const directus = createClient();
    const settings = await directus.request(readSingleton('site_settings'));
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: 'Failed to fetch site settings' }, { status: 500 });
  }
}
