import { NextRequest, NextResponse } from 'next/server';
import { requireEditor } from '@/lib/auth';
import { getOpenRouterClient } from '@/lib/openrouter-client';

export const POST = requireEditor(async (request: NextRequest, context) => {
  try {
    const { text, style, statement_id } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log(`User ${context.userId} (${context.role}) requesting paraphrase for text: ${text.substring(0, 50)}...`);

    // Use OpenRouter to paraphrase and improve text
    const client = getOpenRouterClient();

    const stylePrompt = style ? `in a ${style} style` : 'with improved clarity and flow';

    const prompt = `You are an expert Hebrew language editor. Improve and paraphrase this Hebrew text ${stylePrompt}.

Original text: "${text}"

Return a JSON object with improvements:

{
  "original_text": "the original text",
  "improved_text": "the improved, paraphrased version",
  "changes_made": number,
  "improvements": [
    {
      "type": "clarity|flow|wording|structure",
      "original": "original problematic part",
      "improved": "improved version",
      "reason": "why this improves the text"
    }
  ],
  "confidence": 0.0-1.0,
  "style_applied": "description of style used"
}

Guidelines:
- Preserve the original meaning and intent exactly
- Improve clarity, flow, and readability
- For Hebrew text, ensure proper language usage and structure
- Make text more engaging and professional when appropriate
- Don't change factual content or important nuances
- If text is already excellent, make minimal improvements
- Focus on making the text better while staying true to original meaning`;

    const schema = {
      type: 'object',
      properties: {
        original_text: { type: 'string' },
        improved_text: { type: 'string' },
        changes_made: { type: 'number' },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['clarity', 'flow', 'wording', 'structure'] },
              original: { type: 'string' },
              improved: { type: 'string' },
              reason: { type: 'string' }
            },
            required: ['type', 'original', 'improved', 'reason']
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        style_applied: { type: 'string' }
      },
      required: ['original_text', 'improved_text', 'changes_made', 'improvements', 'confidence', 'style_applied']
    };

    const result = await client.chatJson<{
      original_text: string;
      improved_text: string;
      changes_made: number;
      improvements: Array<{
        type: string;
        original: string;
        improved: string;
        reason: string;
      }>;
      confidence: number;
      style_applied: string;
    }>(prompt, schema);

    return NextResponse.json({
      success: true,
      result: result,
      statement_id: statement_id || null
    });

  } catch (error) {
    console.error('Paraphrase error:', error);

    // Provide more specific error messages
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      if (error.message.includes('OPENROUTER_API_KEY')) {
        errorMessage = 'AI service is not configured. Please contact support.';
      } else if (error.message.includes('OpenRouter API error')) {
        errorMessage = 'AI service temporarily unavailable. Please try again later.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'AI service rate limit exceeded. Please try again in a few minutes.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
