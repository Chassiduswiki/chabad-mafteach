import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { params } = await context;

  try {
    const directusUrl = process.env.DIRECTUS_URL;

    if (!directusUrl) {
      return NextResponse.json({ error: 'Directus URL not configured' }, { status: 500 });
    }

    // Reconstruct the path from the slug array
    const resolvedParams = await params;
    const slugArray = resolvedParams.slug || [];
    const slugPath = slugArray.join('/');
    const path = slugPath ? `/${slugPath}` : '';
    const queryString = request.url.split('?')[1] ? '?' + request.url.split('?')[1] : '';

    const fullUrl = `${directusUrl}${path}${queryString}`;

    const directusResponse = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': process.env.DIRECTUS_STATIC_TOKEN || '',
        'Content-Type': 'application/json',
      },
    });


    if (!directusResponse.ok) {
      const errorText = await directusResponse.text();
      return NextResponse.json({
        error: 'Directus API request failed',
        status: directusResponse.status,
        directusUrl: fullUrl,
        details: errorText
      }, { status: directusResponse.status });
    }

    // Handle the response - it might not be JSON
    const contentType = directusResponse.headers.get('content-type');

    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await directusResponse.json();
    } else {
      const text = await directusResponse.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        return NextResponse.json({
          error: 'Invalid response from Directus',
          contentType,
          preview: text.substring(0, 500)
        }, { status: 500 });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Directus proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Directus' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { params } = await context;
  try {
    const directusUrl = process.env.DIRECTUS_URL;

    if (!directusUrl) {
      return NextResponse.json({ error: 'Directus URL not configured' }, { status: 500 });
    }

    // Reconstruct the path from the slug array
    const resolvedParams = await params;
    const slugPath = (resolvedParams.slug || []).join('/');
    const path = slugPath ? `/${slugPath}` : '';
    const queryString = request.url.split('?')[1] ? '?' + request.url.split('?')[1] : '';

    const fullUrl = `${directusUrl}${path}${queryString}`;

    // Get request body
    const body = await request.json();

    const directusResponse = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': process.env.DIRECTUS_STATIC_TOKEN || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!directusResponse.ok) {
      const errorText = await directusResponse.text();
      return NextResponse.json({
        error: 'Directus API request failed',
        status: directusResponse.status,
        directusUrl: fullUrl,
        details: errorText
      }, { status: directusResponse.status });
    }

    const data = await directusResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Directus proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Directus' }, { status: 500 });
  }
}
