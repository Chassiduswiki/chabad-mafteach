import { NextRequest, NextResponse } from 'next/server';
import { AI_CONFIG } from '@/lib/ai/config';

export async function POST(req: NextRequest) {
  try {
    const { topicId, content } = await req.json();

    // Analyze content and generate suggestions
    const prompt = `Analyze this Chassidic topic content and suggest 3-5 specific improvements:

Content: \"${content}\"

For each suggestion, provide:
1. A clear action title
2. Brief description of why it would help
3. Confidence score (0.0-1.0)

Respond in JSON format:
{
  \"suggestions\": [
    {
      \"id\": \"unique-id\",
      \"type\": \"action|content|relationship\",
      \"title\": \"Suggestion title\",
      \"description\": \"Why this helps\",
      \"confidence\": 0.85
    }
  ]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Suggestion generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
