import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const directusUrl = process.env.DIRECTUS_URL;

    if (!directusUrl) {
      return NextResponse.json({ error: 'Directus URL not configured' }, { status: 500 });
    }

    // Get the path after /api/directus-proxy/
    const path = url.pathname.replace('/api/directus-proxy', '');
    const queryString = url.search;

    const fullUrl = `${directusUrl}${path}${queryString}`;

    // Forward the request to Directus
    const directusResponse = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await directusResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Directus proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Directus' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const directusUrl = process.env.DIRECTUS_URL;

    if (!directusUrl) {
      return NextResponse.json({ error: 'Directus URL not configured' }, { status: 500 });
    }

    // Get the path after /api/directus-proxy/
    const path = url.pathname.replace('/api/directus-proxy', '');
    const queryString = url.search;

    const fullUrl = `${directusUrl}${path}${queryString}`;

    // Get request body
    const body = await request.json();

    // Forward the request to Directus
    const directusResponse = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await directusResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Directus proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Directus' }, { status: 500 });
  }
}
