import { NextRequest, NextResponse } from 'next/server';
import { AI_CONFIG } from '@/lib/ai/config';

export async function POST(req: NextRequest) {
  try {
    const { topicId, content, existing_relationships } = await req.json();

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ predictions: [], message: 'Not enough content to predict relationships' });
    }

    const prompt = `Based on the content of this Chassidic topic, predict potential relationships with other topics. 

Topic Content: \"${content}\"

Respond in JSON format with an array of predictions:
{
  \"predictions\": [
    {
      \"topic_id\": 45,
      \"topic_title\": \"Pnimiyus\",
      \"relationship_type\": \"opposite\",
      \"confidence\": 0.92,
      \"explanation\": \"Chitzoniuys and Pnimiyus are fundamental opposites...\"
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
  } catch (error) {
    console.error('Relationship prediction error:', error);
    return NextResponse.json({ error: 'Failed to predict relationships' }, { status: 500 });
  }
}
