import { NextRequest, NextResponse } from 'next/server';
import OpenRouterClient from '@/lib/ai/openrouter-client';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    void OpenRouterClient;
    
    // Use a lightweight model for transliteration
    const prompt = `Transliterate the following Hebrew text to English using standard Chassidic transliteration conventions (e.g., "ch" for ח, "tz" for צ):

Hebrew: "${text}"

Respond with ONLY the transliteration, no explanation.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error('OpenRouter API failed');
    }

    const data = await response.json();
    const transliteration = data.choices[0].message.content.trim();

    return NextResponse.json({ transliteration });
  } catch (error) {
    console.error('Transliteration error:', error);
    return NextResponse.json(
      { error: 'Transliteration failed' },
      { status: 500 }
    );
  }
}
