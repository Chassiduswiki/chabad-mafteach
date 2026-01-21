import { NextRequest, NextResponse } from 'next/server';
import { getTopicBySlug, updateTopic } from '@/lib/api/topics';
import { verifyAuth } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const data = await getTopicBySlug(slug);

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
        const allowedFields = [
            'canonical_title', 'canonical_title_en', 'canonical_title_transliteration',
            'name_hebrew', 'slug', 'topic_type', 'description', 'description_en',
            'practical_takeaways', 'historical_context', 'content_status',
            'status_label', 'badge_color', 'mashal', 'global_nimshal', 'charts',
            'metadata', 'original_lang', 'sources_count', 'documents_count',
            'display_config'
        ];

        // Filter to only allowed fields and remove empty strings (except canonical_title)
        const cleanedUpdates = Object.fromEntries(
            Object.entries(updates)
                .filter(([key, v]) => allowedFields.includes(key) && (v !== '' || key === 'canonical_title'))
        );

        console.log('Cleaned updates:', Object.keys(cleanedUpdates));

        const updatedTopic = await updateTopic(slug, cleanedUpdates);

        if (!updatedTopic) {
            return NextResponse.json(
                { error: 'Topic not found or update failed' },
                { status: 404 }
            );
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

