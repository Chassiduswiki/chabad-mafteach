import { NextRequest, NextResponse } from 'next/server';
import { getChainBySlug, updateNode, deleteNode } from '@/lib/api/idea-chains';
import { verifyAuth } from '@/lib/auth';
import type { ContributionType } from '@/lib/idea-chains/types';

const VALID_CONTRIBUTION_TYPES: ContributionType[] = [
    'origin', 'expansion', 'application', 'counterpoint', 'synthesis', 'reframe'
];

/**
 * PATCH /api/idea-chains/[slug]/nodes/[nodeId]
 * Update a node
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; nodeId: string }> }
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

        const { slug, nodeId } = await params;
        const chain = await getChainBySlug(slug);

        if (!chain) {
            return NextResponse.json(
                { error: 'Chain not found' },
                { status: 404 }
            );
        }

        // Verify node belongs to this chain
        const nodeIdNum = parseInt(nodeId, 10);
        const existingNode = chain.nodes.find(n => n.id === nodeIdNum);

        if (!existingNode) {
            return NextResponse.json(
                { error: 'Node not found in this chain' },
                { status: 404 }
            );
        }

        const body = await request.json();

        // Validate contribution_type if provided
        if (body.contribution_type && !VALID_CONTRIBUTION_TYPES.includes(body.contribution_type)) {
            return NextResponse.json(
                { error: 'Invalid contribution_type' },
                { status: 400 }
            );
        }

        // Filter to allowed fields
        const allowedFields = [
            'source_id', 'citation_reference', 'quote_hebrew', 'quote_translated',
            'external_url', 'contribution_type', 'contribution_summary',
            'contribution_summary_hebrew', 'base_idea_summary',
            'approximate_year', 'position', 'is_origin'
        ];

        const cleanedUpdates = Object.fromEntries(
            Object.entries(body).filter(([key]) => allowedFields.includes(key))
        );

        if (Object.keys(cleanedUpdates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        const node = await updateNode(nodeIdNum, cleanedUpdates);

        if (!node) {
            return NextResponse.json(
                { error: 'Failed to update node' },
                { status: 500 }
            );
        }

        return NextResponse.json(node);
    } catch (error) {
        console.error('Error updating node:', error);
        return NextResponse.json(
            { error: 'Failed to update node' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/idea-chains/[slug]/nodes/[nodeId]
 * Delete a node from a chain
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; nodeId: string }> }
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

        const { slug, nodeId } = await params;
        const chain = await getChainBySlug(slug);

        if (!chain) {
            return NextResponse.json(
                { error: 'Chain not found' },
                { status: 404 }
            );
        }

        // Verify node belongs to this chain
        const nodeIdNum = parseInt(nodeId, 10);
        const existingNode = chain.nodes.find(n => n.id === nodeIdNum);

        if (!existingNode) {
            return NextResponse.json(
                { error: 'Node not found in this chain' },
                { status: 404 }
            );
        }

        await deleteNode(nodeIdNum);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting node:', error);
        return NextResponse.json(
            { error: 'Failed to delete node' },
            { status: 500 }
        );
    }
}
