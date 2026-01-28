import { NextRequest, NextResponse } from 'next/server';
import { getDirectus } from '@/lib/directus';
import { readSingleton } from '@directus/sdk';
import { AISettings } from '@/lib/ai/openrouter-client';
import { requireAuth } from '@/lib/auth';

interface SuggestionContext {
  textBefore: string;
  currentParagraph: string;
  sectionType?: string;
  topicTitle?: string;
  topicType?: string;
}

export const POST = requireAuth(async (request: NextRequest, context) => {
  try {
    if (context.role !== 'admin' && context.role !== 'editor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body: SuggestionContext = await request.json();
    const { textBefore, currentParagraph, sectionType, topicTitle, topicType } = body;

    if (!textBefore || textBefore.length < 20) {
      return NextResponse.json({ suggestion: null });
    }

    const directus = getDirectus();
    const aiSettings = await directus.request(readSingleton('ai_settings')) as AISettings;

    const systemPrompt = `You are an AI writing assistant for a Chassidic encyclopedia.
Your task is to provide SHORT inline text completions (1-2 sentences max) that naturally continue the user's writing.

Context:
- Topic: ${topicTitle || 'Unknown'}
- Type: ${topicType || 'concept'}
- Section: ${sectionType || 'general'}

Rules:
1. Return ONLY the completion text, nothing else
2. Keep suggestions brief (10-30 words)
3. Match the writing style and tone
4. Use appropriate Chassidic terminology when relevant
5. If you can't provide a good suggestion, return an empty string
6. Never repeat the user's text
7. Ensure grammatical continuity`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiSettings.api_key || process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Chabad Mafteach AI Assistant',
      },
      body: JSON.stringify({
        model: aiSettings.fallback_model || 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Continue this text naturally:\n\n${textBefore}` }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errorData);
      return NextResponse.json({ suggestion: null });
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim() || null;

    // Validate suggestion
    if (!suggestion || suggestion.length < 5 || suggestion.length > 200) {
      return NextResponse.json({ suggestion: null });
    }

    // Don't return if it's just repeating the input
    if (textBefore.endsWith(suggestion.slice(0, 20))) {
      return NextResponse.json({ suggestion: null });
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Inline suggestion error:', error);
    return NextResponse.json({ suggestion: null });
  }
});
