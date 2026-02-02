// app/api/ai/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenRouterClient from '@/lib/ai/openrouter-client';
import { getDirectus, Topic } from '@/lib/directus';
import { createItem, readItems, readSingleton, updateItem } from '@directus/sdk';
import { getCachedAIResult, setCachedAIResult } from '@/lib/ai/cache';
import { createHash } from 'crypto';

const TRANSLATABLE_FIELDS = new Set([
  'canonical_title',
  'description',
  'definition_positive',
  'definition_negative',
  'overview',
  'article',
  'practical_takeaways',
  'historical_context',
  'mashal',
  'global_nimshal',
]);

async function getTopicField(topicId: string, field: string): Promise<string> {
  const directus = getDirectus();
  const topic = await directus.request(
    readItems('topics', {
      filter: { id: { _eq: parseInt(topicId, 10) } },
      fields: [field as keyof Topic],
      limit: 1,
    })
  );
  return (topic[0] as any)?.[field] as string;
}

async function saveTranslationHistory(data: any): Promise<void> {
  const directus = getDirectus();
  await directus.request(
    createItem('translation_history', {
      topic_id: data.topic_id,
      source_language: data.source_language,
      target_language: data.target_language,
      field: data.field,
      translation: data.translation,
      quality_score: data.quality.score,
      quality_explanation: data.quality.explanation,
      model: data.model,
      is_fallback: data.isFallback,
      status: 'pending',
    })
  );
}

async function updateTopicTranslation(topicId: string, language: string, field: string, translation: string): Promise<void> {
  const directus = getDirectus();
  
  const existingTranslations = await directus.request(
    readItems('topic_translations', {
      filter: {
        topics_id: { _eq: parseInt(topicId, 10) },
        languages_code: { _eq: language },
      },
      limit: 1,
    })
  );

  if (existingTranslations.length > 0) {
    const translationId = existingTranslations[0].id;
    await directus.request(
      updateItem('topic_translations', translationId, { [field]: translation })
    );
  } else {
    await directus.request(
      createItem('topic_translations', {
        topics_id: parseInt(topicId, 10),
        languages_code: language,
        [field]: translation,
      })
    );
  }
}

function buildCacheKey(params: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  field: string;
  context?: string;
}) {
  const hash = createHash('sha256')
    .update(params.text)
    .update('|')
    .update(params.sourceLanguage)
    .update('|')
    .update(params.targetLanguage)
    .update('|')
    .update(params.field)
    .update('|')
    .update(params.context || '')
    .digest('hex');
  return `translate:v2:${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { topic_id, target_language, source_language, field, context, content } = body || {};

    if (!target_language || !source_language || !field) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const normalizedTopicId = topic_id ? String(topic_id) : null;
    const parsedTopicId = normalizedTopicId ? parseInt(normalizedTopicId, 10) : null;
    if (normalizedTopicId && (parsedTopicId === null || Number.isNaN(parsedTopicId))) {
      return NextResponse.json({ error: 'Invalid topic_id' }, { status: 400 });
    }
    if (!normalizedTopicId && !content) {
      return NextResponse.json({ error: 'topic_id or content is required' }, { status: 400 });
    }

    if (!TRANSLATABLE_FIELDS.has(field) && !content) {
      return NextResponse.json({ error: 'Unsupported field for translation' }, { status: 400 });
    }

    const directus = getDirectus();
    
    // 1. Fetch AI settings from Directus
    const settings = await directus.request(readSingleton('ai_settings'));
    const openRouterClient = new OpenRouterClient(settings);

    // 2. Fetch content from Directus (if content not supplied)
    let contentToTranslate: string | null = typeof content === 'string' ? content : null;
    if (!contentToTranslate && normalizedTopicId) {
      contentToTranslate = await getTopicField(normalizedTopicId, field);
    }

    if (!contentToTranslate) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const cacheKey = buildCacheKey({
      text: contentToTranslate,
      sourceLanguage: source_language,
      targetLanguage: target_language,
      field,
      context,
    });
    const cached = getCachedAIResult(cacheKey, 1000 * 60 * 60 * 12);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    // 3. Get translation from AI
    const result = await openRouterClient.translate(contentToTranslate, source_language, target_language, context);
    if (!result?.translation) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 502 });
    }

    if (normalizedTopicId) {
      // 4. Save to translation history
      await saveTranslationHistory({
        topic_id: normalizedTopicId,
        source_language,
        target_language,
        field,
        ...result,
      });
    }

    // 5. Quality validation and auto-approval
    const qualityThreshold = settings?.quality_threshold ?? 0.8;
    const autoApprovalThreshold = settings?.auto_approval_threshold ?? 0.95;
    const responsePayload = {
      translation: result.translation,
      quality: result.quality,
      model: result.model,
      isFallback: result.isFallback,
      cached: false,
    };

    if (result.quality.score >= qualityThreshold) {
      // Update the topic_translations table in Directus
      if (normalizedTopicId) {
        await updateTopicTranslation(normalizedTopicId, target_language, field, result.translation);
      }

      const isAutoApproved = result.quality.score >= autoApprovalThreshold;
      const payload = {
        message: 'Translation successful and saved.',
        auto_approved: isAutoApproved,
        ...responsePayload,
      };
      setCachedAIResult(cacheKey, payload);
      return NextResponse.json(payload);
    } else {
      const payload = {
        message: 'Translation quality below threshold. Not saved.',
        ...responsePayload,
      };
      setCachedAIResult(cacheKey, payload);
      return NextResponse.json(payload, { status: 200 });
    }

  } catch (error) {
    console.error('Translation API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to translate', details: errorMessage }, { status: 500 });
  }
}
