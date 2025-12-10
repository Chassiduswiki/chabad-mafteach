import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { createItem, readItems } from '@directus/sdk';
import { getOpenRouterClient } from '@/lib/openrouter-client';
import { requireEditor } from '@/lib/auth';

export const POST = requireEditor(async (request: NextRequest, context) => {
  try {
    const { paragraph_id, document_id } = await request.json();

    if (!paragraph_id) {
      return NextResponse.json({ error: 'paragraph_id is required' }, { status: 400 });
    }

    console.log(`User ${context.userId} (${context.role}) breaking paragraph: ${paragraph_id}`);

    // Get paragraph content from Directus
    const paragraph = await directus.request(
      readItems('paragraphs', {
        filter: { id: { _eq: paragraph_id } },
        fields: ['id', 'text', 'doc_id']
      })
    );

    if (!paragraph || paragraph.length === 0) {
      return NextResponse.json({ error: 'Paragraph not found' }, { status: 404 });
    }

    const paragraphText = paragraph[0].text;
    if (!paragraphText) {
      return NextResponse.json({ error: 'Paragraph has no text content' }, { status: 400 });
    }

    // Use OpenRouter to break into statements
    const client = getOpenRouterClient();

    const prompt = `Analyze this Hebrew/English text and break it into logical statements. Each statement should be a complete thought or teaching.

Text: "${paragraphText}"

Return a JSON object with:
{
  "statements": [
    {
      "text": "The statement text",
      "order": 1
    }
  ]
}

Guidelines:
- Preserve original Hebrew text exactly
- Split on natural breaks (periods, new thoughts)
- Keep related ideas together when they form one complete teaching
- Number statements sequentially starting from 1
- Remove excessive whitespace but preserve paragraph structure where meaningful`;

    const schema = {
      type: 'object',
      properties: {
        statements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              order: { type: 'number' }
            },
            required: ['text', 'order']
          }
        }
      },
      required: ['statements']
    };

    const result = await client.chatJson<{ statements: { text: string; order: number }[] }>(
      prompt,
      schema
    );

    // Create statements in Directus
    const createdStatements = [];
    for (const stmt of result.statements) {
      const statement = await directus.request(
        createItem('statements', {
          paragraph_id: paragraph_id,
          text: stmt.text,
          order_key: stmt.order.toString(),
          metadata: {
            created_by_ai: true,
            ai_model: 'deepseek/deepseek-r1',
            document_id: document_id || paragraph[0].doc_id,
            created_by: context.userId
          }
        })
      );
      createdStatements.push(statement);
    }

    return NextResponse.json({
      success: true,
      statements_created: createdStatements.length,
      statements: createdStatements
    });

  } catch (error) {
    console.error('Statement breaking error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
