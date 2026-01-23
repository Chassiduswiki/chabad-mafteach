// app/api/ai/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenRouterClient from '@/lib/ai/openrouter-client';
import { getDirectus, Topic } from '@/lib/directus';
import { createItem, readItems, updateItem } from '@directus/sdk';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic_id, target_language, source_language, field, context } = body;

    if (!topic_id || !target_language || !source_language || !field) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const openRouterClient = new OpenRouterClient();

    // 1. Fetch content from Directus
    const contentToTranslate = await getTopicField(topic_id, field);

    if (!contentToTranslate) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // 2. Get translation from AI
    const result = await openRouterClient.translate(contentToTranslate, source_language, target_language, context);

    // 3. Save to translation history
    await saveTranslationHistory({
      topic_id,
      source_language,
      target_language,
      field,
      ...result,
    });

    // 4. Quality validation and auto-approval
    const qualityThreshold = 0.8;
    const autoApprovalThreshold = 0.95;

    if (result.quality.score >= qualityThreshold) {
      // Update the topic_translations table in Directus
      await updateTopicTranslation(topic_id, target_language, field, result.translation);

      const isAutoApproved = result.quality.score >= autoApprovalThreshold;
      return NextResponse.json({ 
        message: 'Translation successful and saved.',
        auto_approved: isAutoApproved,
        ...result 
      });
    } else {
      return NextResponse.json({ 
        message: 'Translation quality below threshold. Not saved.',
        ...result 
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Translation API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to translate', details: errorMessage }, { status: 500 });
  }
}
