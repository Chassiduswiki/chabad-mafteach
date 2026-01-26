import { NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

const directus = createClient();

/**
 * Public Branding API
 * Returns non-sensitive branding settings for the frontend
 */
export async function GET() {
  try {
    const settings = await directus.request(readItems('topics', {
      filter: { slug: { _eq: 'site-branding-settings' } },
      limit: 1
    } as any));

    const branding = (settings as any[])[0]?.metadata?.branding || {};
    
    // Filter out any sensitive info if added in the future
    const publicBranding = {
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      fontSerif: branding.fontSerif,
      fontSans: branding.fontSans,
      bannerText: branding.bannerText,
      bannerEnabled: branding.bannerEnabled,
      logo: branding.logo,
    };

    return NextResponse.json(publicBranding);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch public branding' }, { status: 500 });
  }
}
