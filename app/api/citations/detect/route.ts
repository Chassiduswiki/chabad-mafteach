import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterClient } from '@/lib/openrouter-client';

export async function POST(request: NextRequest) {
  try {
    const { text, statement_id } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // Use OpenRouter to detect citations
    const client = getOpenRouterClient();

    const prompt = `Analyze this Hebrew/English text for citations to Jewish sources. Look for common citation patterns used in seforim (Jewish books).

Text to analyze: "${text}"

Common citation patterns include:
- Talmud references: "ברכות דף כג ע״א" (Berachot 23a)
- Shulchan Aruch: "שו״ע או״ח סי׳ רמ״ג" (Shulchan Aruch Orach Chaim 483)
- Tanya: "תניא אגרת התשובה פרק ב׳" (Tanya, Iggeret HaTeshuva, Chapter 2)
- Midrash: "בראשית רבה פרשה א׳" (Bereishit Rabbah, Parsha 1)
- Other patterns: book names, chapter numbers, verse numbers

Return a JSON object with detected citations:
{
  "citations": [
    {
      "text": "The exact citation text found",
      "type": "talmud|shulchan_aruch|tanya|midrash|other",
      "book": "Book name if identifiable",
      "reference": "Standardized reference format",
      "confidence": 0.9
    }
  ]
}

Guidelines:
- Only include citations you're confident about (confidence > 0.7)
- Extract the exact text as it appears
- Identify the citation type when possible
- Provide standardized reference when possible
- Return empty array if no citations found`;

    const schema = {
      type: 'object',
      properties: {
        citations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              type: { type: 'string' },
              book: { type: 'string' },
              reference: { type: 'string' },
              confidence: { type: 'number' }
            },
            required: ['text', 'confidence']
          }
        }
      },
      required: ['citations']
    };

    const result = await client.chatJson<{
      citations: {
        text: string;
        type?: string;
        book?: string;
        reference?: string;
        confidence: number;
      }[]
    }>(prompt, schema);

    // TODO: In the future, we could create source_links entries in Directus
    // For now, just return the detected citations

    return NextResponse.json({
      success: true,
      text_analyzed: text,
      citations_found: result.citations.length,
      citations: result.citations
    });

  } catch (error) {
    console.error('Citation detection error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
