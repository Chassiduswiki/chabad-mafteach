import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

const directus = createClient();

export interface LanguageAvailability {
  code: string;
  name: string;
  nativeName: string;
  available: boolean;
  hasTitle: boolean;
  hasDescription: boolean;
  translationQuality?: string;
  isMachineTranslated?: boolean;
}

const LANGUAGE_INFO: Record<string, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  he: { name: 'Hebrew', nativeName: 'עברית' },
};

/**
 * GET /api/topics/[slug]/languages
 *
 * Returns which languages have actual translations for a topic,
 * including translation quality metadata.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // First, get the topic ID from slug
    const topics = await directus.request(
      readItems('topics', {
        filter: { slug: { _eq: slug.toLowerCase() } },
        fields: ['id', 'canonical_title', 'description'],
        limit: 1,
      })
    );

    if (!topics || topics.length === 0) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    const topic = topics[0] as { id: number; canonical_title: string; description?: string };

    // Get all translations for this topic
    const translations = await directus.request(
      readItems('topic_translations' as any, {
        filter: { topic_id: { _eq: topic.id } },
        fields: [
          'id',
          'language_code',
          'title',
          'description',
          'translation_quality',
          'is_machine_translated',
        ],
      })
    ) as any[];

    // Build availability map
    const translationMap = new Map(
      translations.map((t) => [t.language_code, t])
    );

    // Build response for each supported language
    const languages: LanguageAvailability[] = Object.entries(LANGUAGE_INFO).map(
      ([code, info]) => {
        const translation = translationMap.get(code);

        // English is always "available" since it's the default/fallback
        // For other languages, check if there's actual translated content
        const hasTitle = translation?.title && translation.title.trim().length > 0;
        const hasDescription = translation?.description && translation.description.trim().length > 0;

        // A language is "available" if:
        // 1. It's English (default), OR
        // 2. It has at least a title
        const available = code === 'en' || hasTitle;

        return {
          code,
          name: info.name,
          nativeName: info.nativeName,
          available,
          hasTitle: code === 'en' ? true : hasTitle,
          hasDescription: code === 'en' ? !!topic.description : hasDescription,
          translationQuality: translation?.translation_quality || (code === 'en' ? 'original' : undefined),
          isMachineTranslated: translation?.is_machine_translated || false,
        };
      }
    );

    return NextResponse.json({
      topicId: topic.id,
      topicTitle: topic.canonical_title,
      languages,
      defaultLanguage: 'en',
    });
  } catch (error) {
    console.error('Error fetching topic languages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch language availability' },
      { status: 500 }
    );
  }
}
