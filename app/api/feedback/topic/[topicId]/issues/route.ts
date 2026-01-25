import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;

    // Validate topicId
    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    const directus = createClient();
    
    // Check if topic exists
    const topics = await directus.request(
      readItems('topics', {
        filter: { id: { _eq: topicId } },
        fields: ['id', 'canonical_title']
      } as any)
    ) as any[];

    if (!topics || topics.length === 0) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Try to fetch issues from feedback collection
    let issues: any[] = [];
    try {
      issues = await directus.request(
        readItems('feedback' as any, {
          filter: { 
            topic_id: { _eq: topicId },
            status: { _neq: 'resolved' }
          },
          sort: ['-created_at'],
          limit: 50
        })
      ) as any[];
    } catch (error) {
      // If feedback collection doesn't exist, return empty array
      console.log('Feedback collection not found, returning empty issues');
      issues = [];
    }

    return NextResponse.json({
      success: true,
      topicId,
      topicTitle: topics[0]?.canonical_title || 'Unknown Topic',
      issues: issues,
      total: issues.length
    });

  } catch (error) {
    console.error('Failed to fetch topic issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}
