import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  try {
    // Test direct API call without any SDK
    const directusUrl = process.env.DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
    const staticToken = process.env.DIRECTUS_STATIC_TOKEN;
    
    if (!staticToken) {
      return NextResponse.json({ error: 'No Directus token configured' }, { status: 500 });
    }

    const response = await fetch(`${directusUrl}/items/topics?filter[canonical_title][_icontains]=${encodeURIComponent(query)}&limit=5`, {
      headers: {
        'Authorization': `Bearer ${staticToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Directus API error', status: response.status }, { status: 500 });
    }

    const data = await response.json();
    
    return NextResponse.json({
      query,
      results: data.data || [],
      total: data.data?.length || 0
    });

  } catch (error) {
    console.error('Search test error:', error);
    return NextResponse.json({ error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
