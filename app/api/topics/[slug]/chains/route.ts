import { NextRequest, NextResponse } from 'next/server';
import { getChainsForTopic, linkChainToTopic, unlinkChainFromTopic, getChainById } from '@/lib/api/idea-chains';
import { verifyAuth } from '@/lib/auth';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * Get topic ID from slug
 */
async function getTopicIdBySlug(slug: string): Promise<number | null> {
    const directus = createClient();
    const normalizedSlug = slug.toLowerCase();

    const topics = await directus.request(
        readItems('topics' as any, {
            filter: { slug: { _eq: normalizedSlug } },
            fields: ['id'],
            limit: 1,
        } as any)
    ) as { id: number }[];

    return topics?.[0]?.id || null;
}

/**
 * GET /api/topics/[slug]/chains
 * Get all idea chains linked to a topic
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const topicId = await getTopicIdBySlug(slug);

        if (!topicId) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        const chains = await getChainsForTopic(topicId);

        // Filter to published chains for non-privileged users
        const auth = verifyAuth(request);
        const isPrivileged = auth && ['admin', 'editor'].includes(auth.role || '');

        const filteredChains = isPrivileged
            ? chains
            : chains.filter(c => c.status === 'published');

        return NextResponse.json({ chains: filteredChains });
    } catch (error) {
        console.error('Error fetching chains for topic:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chains' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/topics/[slug]/chains
 * Link a chain to a topic
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const auth = verifyAuth(request);
        const isDev = process.env.NODE_ENV === 'development';

        if (!auth && !isDev) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { slug } = await params;
        const topicId = await getTopicIdBySlug(slug);

        if (!topicId) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        const body = await request.json();

        if (!body.chain_id) {
            return NextResponse.json(
                { error: 'chain_id is required' },
                { status: 400 }
            );
        }

        // Verify chain exists
        const chain = await getChainById(body.chain_id);
        if (!chain) {
            return NextResponse.json(
                { error: 'Chain not found' },
                { status: 404 }
            );
        }

        const link = await linkChainToTopic(
            body.chain_id,
            topicId,
            body.display_context || null,
            body.order_index
        );

        return NextResponse.json(link, { status: 201 });
    } catch (error: any) {
        console.error('Error linking chain to topic:', error);

        // Check for duplicate
        if (error?.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
            return NextResponse.json(
                { error: 'This chain is already linked to this topic' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to link chain to topic' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/topics/[slug]/chains?chain_id=123
 * Unlink a chain from a topic
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const auth = verifyAuth(request);
        const isDev = process.env.NODE_ENV === 'development';

        if (!auth && !isDev) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const chainId = searchParams.get('chain_id');

        if (!chainId) {
            return NextResponse.json(
                { error: 'chain_id query parameter is required' },
                { status: 400 }
            );
        }

        const topicId = await getTopicIdBySlug(slug);

        if (!topicId) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        const deleted = await unlinkChainFromTopic(parseInt(chainId, 10), topicId);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Link not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unlinking chain from topic:', error);
        return NextResponse.json(
            { error: 'Failed to unlink chain from topic' },
            { status: 500 }
        );
    }
}
