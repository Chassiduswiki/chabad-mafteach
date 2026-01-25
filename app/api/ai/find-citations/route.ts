import { NextRequest, NextResponse } from 'next/server';
import { aiAssistant } from '@/lib/ai/ai-assistant';

export async function POST(req: NextRequest) {
  try {
    const { query, context } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    const citations = await aiAssistant.findCitations(query, context || '');

    return NextResponse.json({ success: true, citations });
  } catch (error) {
    console.error('Citation finding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to find citations', details: errorMessage },
      { status: 500 }
    );
  }
}
