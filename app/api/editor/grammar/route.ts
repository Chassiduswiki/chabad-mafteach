import { NextRequest, NextResponse } from 'next/server';
import { requireEditor } from '@/lib/auth';
import { getOpenRouterClient } from '@/lib/openrouter-client';

export const POST = requireEditor(async (request: NextRequest, context) => {
  try {
    const { text, statement_id } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log(`User ${context.userId} (${context.role}) requesting grammar check for text: ${text.substring(0, 50)}...`);

    // Use OpenRouter to check grammar and spelling
    const client = getOpenRouterClient();

    const prompt = `You are an expert Hebrew language editor. Analyze this Hebrew text for grammar, spelling, and clarity issues.

Text to analyze: "${text}"

Return a JSON object with corrections and suggestions:

{
  "original_text": "the original text",
  "corrected_text": "the corrected version with fixes",
  "issues_found": number,
  "corrections": [
    {
      "type": "grammar|spelling|clarity|punctuation",
      "original": "problematic text",
      "corrected": "fixed text",
      "explanation": "why this change was made"
    }
  ],
  "confidence": 0.0-1.0,
  "suggestions": ["additional writing tips"]
}

Guidelines:
- Preserve the original meaning and intent
- Only make changes that improve clarity or correctness
- For Hebrew text, consider proper vowelization and grammar rules
- Be conservative - don't change working text unnecessarily
- Focus on actual errors, not stylistic preferences
- If text is already correct, return it unchanged with empty corrections array`;

    const schema = {
      type: 'object',
      properties: {
        original_text: { type: 'string' },
        corrected_text: { type: 'string' },
        issues_found: { type: 'number' },
        corrections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['grammar', 'spelling', 'clarity', 'punctuation'] },
              original: { type: 'string' },
              corrected: { type: 'string' },
              explanation: { type: 'string' }
            },
            required: ['type', 'original', 'corrected', 'explanation']
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        suggestions: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['original_text', 'corrected_text', 'issues_found', 'corrections', 'confidence', 'suggestions']
    };

    const result = await client.chatJson<{
      original_text: string;
      corrected_text: string;
      issues_found: number;
      corrections: Array<{
        type: string;
        original: string;
        corrected: string;
        explanation: string;
      }>;
      confidence: number;
      suggestions: string[];
    }>(prompt, schema);

    // If we have a statement_id, we could update it in the database
    // For now, just return the AI analysis

    return NextResponse.json({
      success: true,
      analysis: result,
      statement_id: statement_id || null
    });

  } catch (error) {
    console.error('Grammar check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
