import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { updateItem } from '@directus/sdk';
import { getOpenRouterClient } from '@/lib/openrouter-client';

export async function POST(request: NextRequest) {
  try {
    const { text, statement_id } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // Use OpenRouter to correct OCR errors
    const client = getOpenRouterClient();

    const prompt = `This text appears to have OCR (Optical Character Recognition) errors from scanning a Hebrew book. Please correct any obvious mistakes while preserving the original meaning and Hebrew text structure.

Original text: "${text}"

Common OCR errors in Hebrew text include:
- Misrecognized Hebrew letters (especially similar looking ones like ב/כ, ד/ר, ו/ה)
- Mixed up letter order in words
- Incorrect punctuation or spacing
- Numbers mistaken for letters or vice versa

Please return a JSON object with the corrected text:
{
  "corrected_text": "The corrected version",
  "confidence": 0.8,
  "changes_made": ["list of specific corrections"]
}

Only make corrections you're confident about. If the text looks correct, return it as-is with high confidence.`;

    const schema = {
      type: 'object',
      properties: {
        corrected_text: { type: 'string' },
        confidence: { type: 'number' },
        changes_made: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['corrected_text', 'confidence', 'changes_made']
    };

    const result = await client.chatJson<{
      corrected_text: string;
      confidence: number;
      changes_made: string[]
    }>(prompt, schema);

    // If statement_id provided, update the statement in Directus
    if (statement_id) {
      await directus.request(
        updateItem('statements', statement_id, {
          text: result.corrected_text,
          metadata: {
            ocr_corrected: true,
            ocr_confidence: result.confidence,
            ocr_changes: result.changes_made,
            ai_model: 'deepseek/deepseek-r1'
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      original_text: text,
      corrected_text: result.corrected_text,
      confidence: result.confidence,
      changes_made: result.changes_made
    });

  } catch (error) {
    console.error('OCR correction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
