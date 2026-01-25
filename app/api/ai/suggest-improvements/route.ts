import { NextRequest, NextResponse } from 'next/server';
import { aiAssistant } from '@/lib/ai/ai-assistant';

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ 
        suggestions: [], 
        message: 'Not enough content to generate suggestions' 
      });
    }

    const suggestions = await aiAssistant.suggestImprovements(content);

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error('Suggestion generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to generate suggestions', 
      details: errorMessage 
    }, { status: 500 });
  }
}
