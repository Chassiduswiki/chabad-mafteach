import { NextRequest, NextResponse } from 'next/server';
import { getChainBySlug, createLink } from '@/lib/api/idea-chains';
import { verifyAuth } from '@/lib/auth';
import type { RelationshipType } from '@/lib/idea-chains/types';

const VALID_RELATIONSHIP_TYPES: RelationshipType[] = [
    'cites', 'builds_upon', 'synthesizes_with', 'reframes_via'
];

/**
 * POST /api/idea-chains/[slug]/links
 * Create a link between two nodes
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
        const chain = await getChainBySlug(slug);

        if (!chain) {
            return NextResponse.json(
                { error: 'Chain not found' },
                { status: 404 }
            );
        }

        const body = await request.json();

        // Validate required fields
        if (!body.parent_node_id || !body.child_node_id) {
            return NextResponse.json(
                { error: 'parent_node_id and child_node_id are required' },
                { status: 400 }
            );
        }

        // Validate relationship_type if provided
        if (body.relationship_type && !VALID_RELATIONSHIP_TYPES.includes(body.relationship_type)) {
            return NextResponse.json(
                { error: 'Invalid relationship_type' },
                { status: 400 }
            );
        }

        // Verify both nodes belong to this chain
        const nodeIds = chain.nodes.map(n => n.id);
        if (!nodeIds.includes(body.parent_node_id) || !nodeIds.includes(body.child_node_id)) {
            return NextResponse.json(
                { error: 'Both nodes must belong to this chain' },
                { status: 400 }
            );
        }

        // Prevent self-links
        if (body.parent_node_id === body.child_node_id) {
            return NextResponse.json(
                { error: 'A node cannot link to itself' },
                { status: 400 }
            );
        }

        // Check for duplicate link
        const existingLink = chain.links.find(
            l => l.parent_node_id === body.parent_node_id && l.child_node_id === body.child_node_id
        );

        if (existingLink) {
            return NextResponse.json(
                { error: 'This link already exists' },
                { status: 409 }
            );
        }

        const link = await createLink({
            parent_node_id: body.parent_node_id,
            child_node_id: body.child_node_id,
            relationship_type: body.relationship_type || 'builds_upon',
            relationship_note: body.relationship_note || null,
        });

        return NextResponse.json(link, { status: 201 });
    } catch (error) {
        console.error('Error creating link:', error);
        return NextResponse.json(
            { error: 'Failed to create link' },
            { status: 500 }
        );
    }
}
