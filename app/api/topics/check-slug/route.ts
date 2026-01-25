import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { isValidSlug, normalizeSlug, generateAlternativeSlugs, isValidSlugLength } from '@/lib/utils/slug-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSlug = searchParams.get('slug');

    if (!rawSlug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }
    
    // Normalize the slug
    const slug = normalizeSlug(rawSlug);
    
    // Validate slug format
    if (!isValidSlug(slug)) {
      return NextResponse.json({ 
        error: 'Invalid slug format', 
        normalized: slug,
        valid: false,
        message: 'Slug must contain only lowercase letters, numbers, and hyphens'
      }, { status: 400 });
    }
    
    // Check minimum length
    if (!isValidSlugLength(slug)) {
      return NextResponse.json({ 
        error: 'Slug too short', 
        normalized: slug,
        valid: false,
        message: 'Slug must be at least 3 characters long'
      }, { status: 400 });
    }

    // Use Directus SDK for more reliable API access
    const directus = createClient();
    
    try {
      const existingTopics = await directus.request(
        readItems('topics', {
          filter: { slug: { _eq: slug } },
          fields: ['id', 'slug'],
          limit: 1
        })
      );
      
      const available = !existingTopics || existingTopics.length === 0;

      // If not available, suggest alternatives
      let alternatives: string[] = [];
      if (!available) {
        // Generate alternative slugs
        alternatives = generateAlternativeSlugs(slug);
      }

      return NextResponse.json({ 
        available, 
        alternatives,
        normalized: slug,
        valid: true,
        original: rawSlug
      });
    } catch (directusError) {
      console.error('Directus API error:', directusError);
      
      // Fallback to direct API call if Directus SDK fails
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/items/topics?filter[slug][_eq]=${encodeURIComponent(slug)}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.DIRECTUS_ADMIN_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const available = !data.data || data.data.length === 0;

      // If not available, suggest alternatives
      let alternatives: string[] = [];
      if (!available) {
        alternatives = generateAlternativeSlugs(slug);
      }

      return NextResponse.json({ 
        available, 
        alternatives,
        normalized: slug,
        valid: true,
        original: rawSlug
      });
    }
  } catch (error) {
    console.error('Slug check error:', error);
    return NextResponse.json({ 
      error: 'Slug check failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
