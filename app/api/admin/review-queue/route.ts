import { NextRequest, NextResponse } from 'next/server';
import { readItems } from '@directus/sdk';
import { createClient } from '@/lib/directus';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Verify admin/editor authorization
    const auth = verifyAuth(req);
    if (!auth || !['admin', 'editor'].includes(auth.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const directus = createClient();

    // Fetch items that need review
    // 1. Topics in 'draft' or 'reviewed' status
    // 2. Statements in 'draft' or 'reviewed' status
    const [draftTopics, draftStatements] = await Promise.all([
      directus.request(readItems('topics', {
        filter: { status: { _in: ['draft', 'reviewed'] } },
        fields: ['id', 'canonical_title', 'slug', 'status', 'date_updated'],
        sort: ['-date_updated'],
        limit: 10
      })),
      directus.request(readItems('statements', {
        filter: { status: { _in: ['draft', 'reviewed'] } },
        fields: ['id', 'text', 'status', 'date_updated'],
        sort: ['-date_updated'],
        limit: 10
      }))
    ]);

    return NextResponse.json({
      topics: draftTopics,
      statements: draftStatements,
      summary: {
        totalPending: draftTopics.length + draftStatements.length
      }
    });
  } catch (error) {
    console.error('Review queue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
