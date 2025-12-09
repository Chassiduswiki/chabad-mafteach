import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterClient } from '@/lib/openrouter-client';

export async function POST(request: NextRequest) {
  try {
    const { text, document_id } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // Use OpenRouter to extract topics
    const client = getOpenRouterClient();

    const prompt = `Analyze this Hebrew/English text from a Jewish philosophical/ethical work and identify the main topics and concepts discussed.

Text to analyze: "${text}"

Focus on:
- Philosophical concepts
- Ethical teachings
- Kabbalistic ideas
- Talmudic principles
- Jewish law concepts
- Spiritual practices
- Moral lessons

Return a JSON object with topics:
{
  "topics": [
    {
      "name": "Topic name in English",
      "hebrew_name": "Hebrew name if applicable",
      "category": "philosophy|ethics|kabbalah|halacha|spirituality",
      "confidence": 0.9,
      "description": "Brief explanation of the topic"
    }
  ]
}

Guidelines:
- Extract 3-7 most important topics
- Use precise, standard terminology
- Include Hebrew terms when relevant
- Focus on substantive concepts rather than generalities
- High confidence (>0.8) for well-supported topics only`;

    const schema = {
      type: 'object',
      properties: {
        topics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              hebrew_name: { type: 'string' },
              category: { type: 'string' },
              confidence: { type: 'number' },
              description: { type: 'string' }
            },
            required: ['name', 'category', 'confidence']
          }
        }
      },
      required: ['topics']
    };

    const result = await client.chatJson<{
      topics: {
        name: string;
        hebrew_name?: string;
        category: string;
        confidence: number;
        description?: string;
      }[]
    }>(prompt, schema);

    // TODO: In the future, create topic entries and link to document in Directus
    // For now, just return the suggested topics

    return NextResponse.json({
      success: true,
      text_analyzed: text,
      topics_found: result.topics.length,
      topics: result.topics
    });

  } catch (error) {
    console.error('Topic tagging error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
