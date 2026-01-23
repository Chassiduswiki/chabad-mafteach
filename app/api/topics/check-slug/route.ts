import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Check if slug exists in database
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/items/topics?filter[slug][_eq]=${slug}&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.DIRECTUS_ADMIN_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    const available = !data.data || data.data.length === 0;

    // If not available, suggest alternatives
    let alternatives: string[] = [];
    if (!available) {
      alternatives = [
        `${slug}-2`,
        `${slug}-new`,
        `${slug}-concept`,
      ];
    }

    return NextResponse.json({ available, alternatives });
  } catch (error) {
    console.error('Slug check error:', error);
    return NextResponse.json({ error: 'Slug check failed' }, { status: 500 });
  }
}
