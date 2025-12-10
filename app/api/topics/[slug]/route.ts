import { NextRequest, NextResponse } from 'next/server';
import { getTopicBySlug, updateTopic } from '@/lib/api/topics';
import { requireEditor } from '@/lib/auth';

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

export const PATCH = requireEditor(async (
    request: NextRequest,
    context: { userId: string; role: string },
    params: Promise<{ slug: string }>
) => {
    try {
        const { slug } = await params;
        const updates = await request.json();

        console.log(`User ${context.userId} (${context.role}) updating topic: ${slug}`);

        // Validate required fields
        if (!updates.canonical_title?.trim()) {
            return NextResponse.json(
                { error: 'Canonical title is required' },
                { status: 400 }
            );
        }

        if (!updates.topic_type) {
            return NextResponse.json(
                { error: 'Topic type is required' },
                { status: 400 }
            );
        }

        const updatedTopic = await updateTopic(slug, {
            ...updates,
            updated_by: context.userId,
            updated_at: new Date().toISOString()
        });

        if (!updatedTopic) {
            return NextResponse.json(
                { error: 'Topic not found or update failed' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedTopic);
    } catch (error) {
        console.error('Topic update error:', error);
        return NextResponse.json(
            { error: 'Failed to update topic' },
            { status: 500 }
        );
    }
});
