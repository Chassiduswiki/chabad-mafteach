import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// Umami API proxy - forwards requests to Umami instance
export const POST = requireAuth(async (request: NextRequest, context) => {
  try {
    const umamiHost = process.env.UMAMI_HOST || 'http://localhost:3000';
    const url = new URL(request.url, umamiHost);
    
    // Forward the request to Umami
    const response = await fetch(url.toString(), {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
      },
      body: request.body,
    });

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Umami proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy to Umami' },
      { status: 500 }
    );
  }
});

export const GET = POST;
