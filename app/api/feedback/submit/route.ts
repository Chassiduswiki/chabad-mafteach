import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, createItem, aggregate } from '@directus/sdk';

export async function POST(request: NextRequest) {
  try {
    const {
      topicId,
      topicTitle,
      type,
      category,
      message,
      priority,
      section,
      content,
      userAgent,
      timestamp
    } = await request.json();

    // Validate required fields
    if (!topicId || !topicTitle || !type || !category || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length < 10 || message.length > 500) {
      return NextResponse.json(
        { error: 'Message must be between 10 and 500 characters' },
        { status: 400 }
      );
    }

    const directus = createClient();
    
    // Check if topic exists
    const topics = await directus.request(
      readItems('topics', {
        filter: { id: { _eq: topicId } },
        fields: ['id', 'canonical_title', 'status']
      } as any)
    ) as any[];

    if (!topics || topics.length === 0) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Create feedback entry
    const feedbackData = {
      topic_id: topicId,
      topic_title: topicTitle,
      type,
      category,
      message,
      priority,
      section: section || null,
      content_preview: content ? content.substring(0, 200) : null,
      user_agent: userAgent || null,
      status: 'new',
      created_at: timestamp || new Date().toISOString(),
      // Extract useful info from user agent
      is_mobile: userAgent?.includes('Mobile') || userAgent?.includes('Android') || userAgent?.includes('iPhone'),
      browser: extractBrowser(userAgent || ''),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    };

    // Attempt to save to feedback collection
    let savedFeedback;
    try {
      savedFeedback = await directus.request(
        createItem('feedback' as any, feedbackData)
      );
    } catch (error) {
      console.warn('[Feedback] Collection missing or save failed, logging instead:', feedbackData);
      savedFeedback = { id: 'temp-' + Date.now(), ...feedbackData };
    }

    // Update topic with issue count if needed
    let issueCount = 0;
    try {
      const currentIssues = await directus.request(
        aggregate('topic_issues' as any, { 
          filter: { topic_id: { _eq: topicId }, status: { _neq: 'resolved' } },
          aggregate: { count: '*' } 
        })
      ) as any[];
      issueCount = Number(currentIssues?.[0]?.count) || 0;
    } catch (err) {
      console.warn('[Feedback] Could not fetch current issue count');
    }

    return NextResponse.json({
      success: true,
      feedback: savedFeedback,
      message: 'Thank you for your feedback! We\'ll review it soon.',
      issueCount: issueCount + 1
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

function extractBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}
