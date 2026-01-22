import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiKey, primaryModel } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Test the API key directly with a simple request to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: primaryModel || 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: 'Test connection - respond with OK' }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json({ 
        error: `API request failed: ${response.status} - ${errorBody}` 
      }, { status: 500 });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      model: primaryModel,
      response: data.choices?.[0]?.message?.content || 'OK',
    });
  } catch (error) {
    console.error('Test connection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
