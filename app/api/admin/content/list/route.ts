import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/admin/content/list
 * 
 * Lists content (topics or statements) with filtering and pagination for the Content Manager.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = verifyAuth(req);
    if (!auth || !['admin', 'editor'].includes(auth.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'topics';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const directus = createClient();

    const query: any = {
      limit,
      offset,
      sort: ['-date_updated'],
      fields: type === 'topics' 
        ? ['id', 'canonical_title', 'slug', 'status', 'date_updated', 'topic_type']
        : ['id', 'text', 'status', 'date_updated'],
    };

    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = { _eq: status };
    }
    
    if (search) {
      if (type === 'topics') {
        filter.canonical_title = { _icontains: search };
      } else {
        filter.text = { _icontains: search };
      }
    }

    if (Object.keys(filter).length > 0) {
      query.filter = filter;
    }

    // Get items and total count
    const [items, totalCount] = await Promise.all([
      directus.request(readItems(type as any, query)),
      directus.request(readItems(type as any, { 
        filter,
        aggregate: { count: '*' } 
      } as any))
    ]);

    const total = parseInt((totalCount as any)[0].count);

    return NextResponse.json({
      items,
      total,
      hasMore: offset + items.length < total
    });
  } catch (error) {
    console.error('Content list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
