import { NextRequest, NextResponse } from 'next/server';
import { getTopicBySlug, updateTopic } from '@/lib/api/topics';
import { verifyAuth } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        
        // Get language from query params (default to 'en')
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || 'en';

        const data = await getTopicBySlug(slug, lang);

        if (!data) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Topic fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch topic' },
            { status: 500 }
        );
    }
}

// PATCH - Update topic (auth optional in development)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const updates = await request.json();

        // Check auth - allow bypass in development
        const auth = verifyAuth(request);
        const isDev = process.env.NODE_ENV === 'development';
        
        if (!auth && !isDev) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const userId = auth?.userId || 'dev-user';
        const role = auth?.role || 'editor';
        
        console.log(`User ${userId} (${role}) updating topic: ${slug}`);

        // Validate required fields only if explicitly being set to empty
        // Allow partial updates without requiring all fields
        if ('canonical_title' in updates && !updates.canonical_title?.trim()) {
            return NextResponse.json(
                { error: 'Canonical title cannot be empty' },
                { status: 400 }
            );
        }

        // Only include fields that exist in the topics table schema
        // Note: Translation fields (description, overview, etc.) should be updated via translations API
        const allowedFields = [
            'slug', 'topic_type', 'default_language',
            'content_status', 'status_label', 'badge_color',
            'metadata', 'sources_count', 'documents_count',
            'display_config'
        ];
        
        // Legacy fields still supported for backward compatibility during migration
        const legacyFields = [
            'canonical_title', 'canonical_title_en', 'canonical_title_transliteration',
            'name_hebrew', 'description', 'description_en',
            'practical_takeaways', 'historical_context', 'mashal', 'global_nimshal', 'charts',
            'original_lang'
        ];
        
        const allAllowedFields = [...allowedFields, ...legacyFields];

        // Filter to only allowed fields and remove empty strings
        // Filter to only allowed fields and preserve HTML content (which may look empty but contain tags)
        console.log('Raw updates received by API:', Object.keys(updates));

        const cleanedUpdates = Object.fromEntries(
            Object.entries(updates)
                .filter(([key, v]) => {
                    if (!allAllowedFields.includes(key)) return false;
                    // Keep non-empty values and HTML content (which contains tags like <p></p>)
                    return v !== '' || (typeof v === 'string' && v.includes('<'));
                })
        );

        console.log('Cleaned updates being sent to Directus:', cleanedUpdates);

        const updatedTopic = await updateTopic(slug, cleanedUpdates);

        if (!updatedTopic) {
            return NextResponse.json(
                { error: 'Topic not found or update failed' },
                { status: 404 }
            );
        }

        // Trigger citation extraction if content fields were updated
        const contentFields = [
            'description', 'overview', 'article', 
            'definition_positive', 'definition_negative', 
            'practical_takeaways', 'historical_context', 
            'mashal', 'global_nimshal'
        ];
        
        const hasContentUpdates = Object.keys(cleanedUpdates).some(key => contentFields.includes(key));
        
        if (hasContentUpdates) {
            try {
                // We combine all content to extract citations in one go
                const combinedContent = contentFields
                    .map(field => cleanedUpdates[field] || '')
                    .filter(Boolean)
                    .join(' ');
                
                if (combinedContent) {
                    // Call the extract API internally or implement logic
                    // For now, we'll use a fetch to the internal API to keep it decoupled
                    const protocol = request.nextUrl.protocol;
                    const host = request.nextUrl.host;
                    const extractUrl = `${protocol}//${host}/api/citations/extract`;
                    
                    fetch(extractUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            content: combinedContent,
                            topicId: updatedTopic.id
                        })
                    }).then(res => {
                        if (!res.ok) console.error(`Citation extraction failed for topic ${updatedTopic.id}: HTTP ${res.status}`);
                    }).catch(err => console.error('Background citation extraction failed:', err));
                }
            } catch (extractError) {
                console.error('Failed to trigger citation extraction:', extractError);
            }
        }

        return NextResponse.json(updatedTopic);
    } catch (error: any) {
        console.error('Topic update error:', error);
        console.error('Error details:', {
            message: error?.message,
            errors: error?.errors,
            response: error?.response?.data
        });
        return NextResponse.json(
            { 
                error: error?.message || 'Failed to update topic',
                details: error?.errors || error?.response?.data
            },
            { status: 500 }
        );
    }
}

