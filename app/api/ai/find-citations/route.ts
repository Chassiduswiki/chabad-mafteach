import { NextRequest, NextResponse } from 'next/server';
import { AI_CONFIG } from '@/lib/ai/config';

export async function POST(req: NextRequest) {
  try {
    const { query, context } = await req.json();

    // Validate API key is configured
    if (!AI_CONFIG.apiKey) {
      console.error('OPENROUTER_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'AI service not configured. Please set OPENROUTER_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    // In a real implementation, this would search a vector database of the user's library
    // For now, we'll simulate a response from an AI model.

    const prompt = `Given the query \"${query}\" and the context of the article, find relevant citations from Chassidic literature (Tanya, Likkutei Sichos, etc.).

Context: \"${context}\"

Respond in JSON format with an array of citations:
{
  \"citations\": [
    {
      \"source_id\": 1,
      \"source_title\": \"Tanya\",
      \"reference\": \"Chapter 35\",
      \"quote\": \"...quote from the source...\",
      \"relevance\": 0.95
    }
  ]
}`;

    let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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

    // Fallback if json_object is not supported
    if (!response.ok) {
      const errorText = await response.text();
      let errorBody;
      try {
        errorBody = JSON.parse(errorText);
      } catch {
        throw new Error(`OpenRouter API failed with status ${response.status}: ${errorText}`);
      }
      
      if (errorBody.error?.message?.includes('response_format')) {
        console.log('Retrying without json_object response_format...');
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: AI_CONFIG.model,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        
        if (!response.ok) {
          const retryError = await response.text();
          console.error('OpenRouter API Error on retry:', retryError);
          throw new Error(`OpenRouter API failed with status ${response.status}: ${retryError}`);
        }
      } else {
        console.error('OpenRouter API Error:', errorText);
        throw new Error(`OpenRouter API failed with status ${response.status}: ${errorText}`);
      }
    }

    const data = await response.json();
    let result;
    try {
      result = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      // If parsing fails, try to extract JSON from a markdown code block
      const jsonMatch = data.choices[0].message.content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Citation finding error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to find citations' },
      { status: 500 }
    );
  }
}
