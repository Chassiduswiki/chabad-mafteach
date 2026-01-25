import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';
import { normalizeSlug, isValidSlug, isValidSlugLength } from '@/lib/utils/slug-utils';

export async function POST(request: NextRequest) {
  try {
    const { topicId, fieldId, value } = await request.json();

    // Validate input
    if (!topicId || !fieldId) {
      return NextResponse.json(
        { error: 'Topic ID and Field ID are required' },
        { status: 400 }
      );
    }

    // Validate field is editable
    const editableFields = [
      'canonical_title',
      'canonical_title_en', 
      'canonical_title_transliteration',
      'slug',
      'description',
      'definition_positive',
      'definition_negative',
      'overview',
      'article',
      'practical_takeaways',
      'historical_context',
      'mashal',
      'global_nimshal',
      'charts',
      'topic_type',
      'content_status',
      'status_label',
      'badge_color'
    ];

    if (!editableFields.includes(fieldId)) {
      return NextResponse.json(
        { error: 'Field is not editable' },
        { status: 400 }
      );
    }

    const directus = createClient();
    
    // Check if topic exists
    const topics = await directus.request(
      readItems('topics', {
        filter: { id: { _eq: topicId } },
        fields: ['id', 'slug']
      })
    ) as any[];

    if (!topics || topics.length === 0) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    let processedValue = value;

    // Special handling for slug
    if (fieldId === 'slug') {
      processedValue = normalizeSlug(value);
      if (!isValidSlug(processedValue)) {
        return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
      }
      if (!isValidSlugLength(processedValue)) {
        return NextResponse.json({ error: 'Slug too short' }, { status: 400 });
      }
    }

    // Update the field
    const updateData = { [fieldId]: processedValue };
    
    const updatedTopic = await directus.request(
      updateItem('topics', topicId, updateData)
    );

    // Background citation extraction for content fields
    const contentFields = [
      'description', 'overview', 'article', 
      'definition_positive', 'definition_negative', 
      'practical_takeaways', 'historical_context', 
      'mashal', 'global_nimshal'
    ];

    if (contentFields.includes(fieldId) && typeof processedValue === 'string') {
      const protocol = request.nextUrl.protocol;
      const host = request.nextUrl.host;
      const extractUrl = `${protocol}//${host}/api/citations/extract`;
      
      fetch(extractUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: processedValue,
          topicId: topicId
        })
      }).catch(err => console.error('Quick edit background extraction failed:', err));
    }

    return NextResponse.json({
      success: true,
      topic: updatedTopic,
      field: fieldId,
      value: processedValue,
      message: 'Field updated successfully'
    });

  } catch (error) {
    console.error('Quick edit error:', error);
    return NextResponse.json(
      { error: 'Failed to update field' },
      { status: 500 }
    );
  }
}
