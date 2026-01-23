import { NextRequest, NextResponse } from 'next/server';
import { aiAssistant } from '@/lib/ai/ai-assistant';
import { AI_CONFIG } from '@/lib/ai/config';

export async function POST(req: NextRequest) {
  try {
    const { topicTitle, context } = await req.json();

    if (!topicTitle) {
      return NextResponse.json({ error: 'Topic title is required' }, { status: 400 });
    }

    const result = await aiAssistant.expandTopicArticle(topicTitle, context || '');

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Article generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Article generation failed', details: errorMessage }, { status: 500 });
  }
}
