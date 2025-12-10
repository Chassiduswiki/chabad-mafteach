import { NextRequest, NextResponse } from 'next/server';
import { getTopicMetadata } from '@/lib/api/topics';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const topic = await getTopicMetadata(slug);

        if (!topic) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(topic);
    } catch (error) {
        console.error('Topic metadata fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch topic metadata' },
            { status: 500 }
        );
    }
}
