import { NextRequest, NextResponse } from 'next/server';
import { aiAssistant } from '@/lib/ai/ai-assistant';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'expand_article':
        if (!data.topicTitle || !data.briefDescription) {
          return NextResponse.json({ error: 'topicTitle and briefDescription are required' }, { status: 400 });
        }
        result = await aiAssistant.expandTopicArticle(data.topicTitle, data.briefDescription);
        break;

      case 'generate_practical_takeaways':
        if (!data.topicTitle || !data.content) {
          return NextResponse.json({ error: 'topicTitle and content are required' }, { status: 400 });
        }
        result = await aiAssistant.generatePracticalTakeaways(data.topicTitle, data.content);
        break;

      case 'generate_mashal':
        if (!data.concept || !data.nimshal) {
          return NextResponse.json({ error: 'concept and nimshal are required' }, { status: 400 });
        }
        result = await aiAssistant.generateMashal(data.concept, data.nimshal);
        break;

      case 'enhance_content':
        if (!data.content) {
          return NextResponse.json({ error: 'content is required' }, { status: 400 });
        }
        result = await aiAssistant.enhanceContent(data.content, data.instructions);
        break;

      case 'generate_confusions':
        if (!data.topicTitle || !data.content) {
          return NextResponse.json({ error: 'topicTitle and content are required' }, { status: 400 });
        }
        result = await aiAssistant.generateCommonConfusions(data.topicTitle, data.content);
        break;

      case 'generate_key_concepts':
        if (!data.content) {
          return NextResponse.json({ error: 'content is required' }, { status: 400 });
        }
        result = await aiAssistant.generateKeyConcepts(data.content);
        break;

      case 'summarize':
        if (!data.content) {
          return NextResponse.json({ error: 'content is required' }, { status: 400 });
        }
        result = await aiAssistant.summarize(data.content, data.maxLength);
        break;

      case 'generate_historical_context':
        if (!data.topicTitle) {
          return NextResponse.json({ error: 'topicTitle is required' }, { status: 400 });
        }
        result = await aiAssistant.generateHistoricalContext(data.topicTitle, data.era);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('AI generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'AI generation failed', details: errorMessage }, { status: 500 });
  }
}
