import { NextRequest, NextResponse } from 'next/server';
import { getDirectus } from '@/lib/directus';
import { readSingleton } from '@directus/sdk';
import { DEFAULT_AI_MODEL } from '@/lib/ai/config';

interface FieldData {
  canonical_title?: string;
  canonical_title_en?: string;
  canonical_title_transliteration?: string;
  topic_type?: string;
  description?: string;
  includeDescription?: boolean; // Also generate description if missing
}

interface CompletionResult {
  field: keyof FieldData;
  value: string;
  confidence: number;
}

export async function POST(req: NextRequest) {
  try {
    const { fields }: { fields: FieldData } = await req.json();

    if (!fields || typeof fields !== 'object') {
      return NextResponse.json({ error: 'Fields object is required' }, { status: 400 });
    }

    const directus = getDirectus();
    
    // Fetch AI settings for model configuration
    const aiSettings = await directus.request(readSingleton('ai_settings')).catch(() => ({})) as any;
    const modelToUse = aiSettings?.primary_model || 'google/gemini-2.0-flash-exp:free';
    const apiKey = aiSettings?.api_key || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'AI provider not configured' }, { status: 500 });
    }

    // Determine what we have and what we need
    const filledFields: string[] = [];
    const emptyFields: string[] = [];

    if (fields.canonical_title?.trim()) filledFields.push('hebrew');
    else emptyFields.push('hebrew');

    if (fields.canonical_title_en?.trim()) filledFields.push('english');
    else emptyFields.push('english');

    if (fields.canonical_title_transliteration?.trim()) filledFields.push('transliteration');
    else emptyFields.push('transliteration');

    if (fields.topic_type?.trim()) filledFields.push('topic_type');
    else emptyFields.push('topic_type');

    // Optionally include description in the completion
    if (fields.includeDescription && !fields.description?.trim()) {
      emptyFields.push('description');
    }

    // Nothing to do if all fields are filled or none are filled
    if (emptyFields.length === 0 || filledFields.length === 0) {
      return NextResponse.json({ suggestions: [], message: 'No auto-completion needed' });
    }

    // Build context from filled fields
    const context: string[] = [];
    if (fields.canonical_title) context.push(`Hebrew title: "${fields.canonical_title}"`);
    if (fields.canonical_title_en) context.push(`English title: "${fields.canonical_title_en}"`);
    if (fields.canonical_title_transliteration) context.push(`Transliteration: "${fields.canonical_title_transliteration}"`);
    if (fields.topic_type) context.push(`Topic type: "${fields.topic_type}"`);
    if (fields.description) context.push(`Description: "${fields.description}"`);

    // Build the prompt
    const needsList = emptyFields.map(f => {
      if (f === 'hebrew') return 'Hebrew title (canonical_title)';
      if (f === 'english') return 'English title/translation (canonical_title_en)';
      if (f === 'transliteration') return 'Transliteration (canonical_title_transliteration)';
      if (f === 'topic_type') return 'Topic type (one of: concept, person, place, event, mitzvah, sefirah)';
      if (f === 'description') return 'Short description (1-2 sentences explaining what this topic is)';
      return f;
    }).join(', ');

    const prompt = `You are helping complete a Jewish/Chassidic topic entry form. Based on the following information:

${context.join('\n')}

Please suggest values for the missing fields: ${needsList}

Rules:
- For Hebrew: Use authentic Hebrew text (no vowels/nikkud unless essential)
- For English: Provide a clear, meaningful English translation or title (not just transliteration)
- For Transliteration: Use standard Chassidic conventions (ch for ח, tz for צ, etc.)
- For Topic type: Choose the most appropriate from: concept, person, place, event, mitzvah, sefirah
- For Description: Write 1-2 concise sentences explaining what this topic is in the context of Chassidic philosophy

Respond in this exact JSON format (only include fields that were requested):
{
  "suggestions": [
    { "field": "canonical_title", "value": "...", "confidence": 0.9 },
    { "field": "canonical_title_en", "value": "...", "confidence": 0.85 },
    { "field": "canonical_title_transliteration", "value": "...", "confidence": 0.95 },
    { "field": "topic_type", "value": "concept", "confidence": 0.8 },
    { "field": "description", "value": "...", "confidence": 0.7 }
  ]
}

Only include fields that need to be filled. Confidence should be 0-1 based on how certain you are.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error('AI API failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    const suggestions: CompletionResult[] = parsed.suggestions || [];

    // Validate topic_type if present
    const validTypes = ['concept', 'person', 'place', 'event', 'mitzvah', 'sefirah'];
    const filteredSuggestions = suggestions.filter(s => {
      if (s.field === 'topic_type' && !validTypes.includes(s.value)) {
        return false;
      }
      return s.value && s.confidence > 0.5; // Only return confident suggestions
    });

    return NextResponse.json({ 
      suggestions: filteredSuggestions,
      filledFields,
      emptyFields 
    });

  } catch (error) {
    console.error('Auto-complete error:', error);
    return NextResponse.json(
      { error: 'Auto-completion failed', suggestions: [] },
      { status: 500 }
    );
  }
}
