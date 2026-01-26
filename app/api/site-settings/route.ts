import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const directusUrl = process.env.DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
    const staticToken = process.env.DIRECTUS_STATIC_TOKEN;
    
    // Fallback default settings
    const defaultSettings = {
      site_name: "Chabad Mafteach",
      tagline: "Deepen your understanding",
      search_placeholder: "Search topics, sources, authors...",
      homepage_hero_title: "Welcome to Chabad Mafteach",
      homepage_hero_subtitle: "Explore the wisdom of Chabad teachings",
      about_title: "About Chabad Mafteach",
      about_content: "A comprehensive platform for learning and exploring Chabad teachings."
    };

    if (!staticToken) {
      console.warn('No Directus static token configured, using fallback settings');
      return NextResponse.json(defaultSettings);
    }

    const response = await fetch(`${directusUrl}/items/site_settings?limit=1`, {
      headers: {
        'Authorization': `Bearer ${staticToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('Directus API error, using fallback settings:', response.status);
      return NextResponse.json(defaultSettings);
    }

    const data = await response.json();
    
    // Since site_settings is a singleton, return the first item or fallback
    const siteSettings = data.data && data.data.length > 0 ? data.data[0] : defaultSettings;
    
    return NextResponse.json(siteSettings);
  } catch (error) {
    console.error('Error fetching site settings, using fallback:', error);
    const fallbackSettings = {
      site_name: "Chabad Mafteach",
      tagline: "Deepen your understanding",
      search_placeholder: "Search topics, sources, authors..."
    };
    return NextResponse.json(fallbackSettings);
  }
}
