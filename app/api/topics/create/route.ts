import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { createItem, readItems } from '@directus/sdk';
import { requireEditor } from '@/lib/auth';
import { isValidSlug, normalizeSlug, generateAlternativeSlugs, isValidSlugLength } from '@/lib/utils/slug-utils';

// Note: We use the server-side Admin client to create the item, 
// as the user's App JWT cannot be used directly with Directus.

export const POST = requireEditor(async (request: NextRequest, context: { userId: string; role: string }) => {
  try {
    // Extract token from request to likely use for user context, 
    // but actual DB write happens via Admin Statick Token for reliability

    // Create admin client for this request (ensures env vars are loaded)
    const adminDirectus = createClient();

    const body = await request.json();

    const {
      canonical_title,
      canonical_title_en,
      canonical_title_transliteration,
      slug,
      topic_type,
      description,
    } = body;

    // Validation
    if (!canonical_title?.trim()) {
      return NextResponse.json(
        { error: 'Hebrew title (canonical_title) is required' },
        { status: 400 }
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Normalize the slug
    const normalizedSlug = normalizeSlug(slug);

    // Validate slug format
    if (!isValidSlug(normalizedSlug)) {
      return NextResponse.json({
        error: 'Invalid slug format',
        message: 'Slug must contain only lowercase letters, numbers, and hyphens'
      }, { status: 400 });
    }

    // Check minimum length
    if (!isValidSlugLength(normalizedSlug)) {
      return NextResponse.json({
        error: 'Slug too short',
        message: 'Slug must be at least 3 characters long'
      }, { status: 400 });
    }

    if (!topic_type) {
      return NextResponse.json(
        { error: 'Topic type is required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    try {
      const existing = await adminDirectus.request(
        readItems('topics', {
          filter: { slug: { _eq: normalizedSlug } },
          fields: ['id'],
          limit: 1,
        } as any)
      );

      if ((existing as any[]).length > 0) {
        // Generate alternative slugs
        const alternatives = generateAlternativeSlugs(normalizedSlug);

        return NextResponse.json(
          {
            error: 'A topic with this slug already exists',
            alternatives,
            normalized: normalizedSlug
          },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Error checking for existing slug:', error);
      return NextResponse.json(
        { error: 'Failed to validate slug uniqueness' },
        { status: 500 }
      );
    }

    // Create the topic using the Admin client
    // We try to attribute it to the user via 'user_created' if possible
    const newTopic = await adminDirectus.request(
      createItem('topics', {
        user_created: context.userId, // Attribute to user
        canonical_title,
        canonical_title_en: canonical_title_en || undefined,
        canonical_title_transliteration: canonical_title_transliteration || undefined,
        slug: normalizedSlug,
        topic_type,
        description: description || undefined,
        content_status: 'minimal',
        status: 'draft' // Default to draft for new topics
      } as any)
    );

    return NextResponse.json({ data: newTopic }, { status: 201 });
  } catch (error) {
    console.error('Failed to create topic:', (error as any)?.message || error);
    // Return specific Directus error if available
    const errorMessage = (error as any)?.errors?.[0]?.message || 'Failed to create topic';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
