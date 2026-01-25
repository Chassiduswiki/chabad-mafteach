import { NextRequest, NextResponse } from 'next/server';
import { aiAssistant } from '@/lib/ai/ai-assistant';

export async function POST(req: NextRequest) {
  try {
    const { content, existing_relationships } = await req.json();

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ 
        predictions: [], 
        message: 'Not enough content to predict relationships' 
      });
    }

    const predictions = await aiAssistant.predictRelationships(content, existing_relationships);

    return NextResponse.json({ success: true, predictions });
  } catch (error) {
    console.error('Relationship prediction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to predict relationships', 
      details: errorMessage 
    }, { status: 500 });
  }
}
