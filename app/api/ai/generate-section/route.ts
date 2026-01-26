import { NextRequest, NextResponse } from 'next/server';
import OpenRouterClient, { AISettings } from '@/lib/ai/openrouter-client';
import { getDirectus } from '@/lib/directus';
import { readSingleton } from '@directus/sdk';
import { requireAuth } from '@/lib/auth';

export const POST = requireAuth(async (request: NextRequest, context) => {
  try {
    if (context.role !== 'admin' && context.role !== 'editor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { topic_id, section_id, field_name, current_content, topic_context } = await request.json();

    if (!field_name || !topic_context) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const directus = getDirectus();
    const aiSettings = await directus.request(readSingleton('ai_settings')) as AISettings;
    const client = new OpenRouterClient(aiSettings);

    const systemPrompt = `You are an expert scholar of Chassidic philosophy and Chabad literature. 
    Your goal is to generate high-quality, authentic content for a specific section of a topic entry in an encyclopedia.
    
    Topic Context: ${JSON.stringify(topic_context)}
    
    Section to generate: ${field_name}
    
    Instructions:
    1. Use deep mystical and philosophical terminology (e.g., "Atzmus", "Ohr Ein Sof", "Seder Hishtalshelus").
    2. Maintain a scholarly, respectful, and objective tone.
    3. Ensure the content is accurate according to the teachings of the Chabad Rebbes.
    4. If it's a 'practical_takeaway', provide actionable points.
    5. If it's a 'mashal', provide a classic Chassidic parable.
    6. Return the content in HTML format suitable for a Rich Text Editor.
    
    RESPONSE FORMAT:
    Return ONLY a JSON object: { "generated_content": "..." }`;

    const prompt = `Generate content for the "${field_name}" section of the topic described in the context. 
    ${current_content ? `Existing content to expand upon: ${current_content}` : 'The section is currently empty.'}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiSettings.api_key || process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Chabad Mafteach AI Assistant',
      },
      body: JSON.stringify({
        model: aiSettings.primary_model || 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'AI generation failed');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      generated_content: result.generated_content,
      model: data.model
    });

  } catch (error) {
    console.error('AI Generation error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 500 });
  }
});
