import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = verifyAuth(req);
    if (!auth || !['admin', 'editor'].includes(auth.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const directus = createClient();

    // Fetch topics with status
    const topics = await directus.request(readItems('topics', {
      fields: ['id', 'status'],
      limit: -1
    }));

    const total = topics.length;
    const published = topics.filter(t => t.status === 'published').length;
    const draft = topics.filter(t => t.status === 'draft').length;
    const archived = topics.filter(t => t.status === 'archived').length;

    // Fetch statements with status
    const statements = await directus.request(readItems('statements', {
      fields: ['id', 'status'],
      limit: -1
    }));

    const totalStatements = statements.length;
    const publishedStatements = statements.filter(s => s.status === 'published').length;

    return NextResponse.json({
      topics: {
        total,
        published,
        draft,
        archived,
        percentage: total > 0 ? (published / total) * 100 : 0
      },
      statements: {
        total: totalStatements,
        published: publishedStatements,
        percentage: totalStatements > 0 ? (publishedStatements / totalStatements) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Content stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
