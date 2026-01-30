import { NextRequest, NextResponse } from 'next/server';
import { getChainBySlug, getChainNodes, createNode } from '@/lib/api/idea-chains';
import { verifyAuth } from '@/lib/auth';
import type { ContributionType } from '@/lib/idea-chains/types';

const VALID_CONTRIBUTION_TYPES: ContributionType[] = [
    'origin', 'expansion', 'application', 'counterpoint', 'synthesis', 'reframe'
];

/**
 * GET /api/idea-chains/[slug]/nodes
 * Get all nodes for a chain
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const chain = await getChainBySlug(slug);

        if (!chain) {
            return NextResponse.json(
                { error: 'Chain not found' },
                { status: 404 }
            );
        }

        // Check auth for unpublished chains
        if (chain.status !== 'published') {
            const auth = verifyAuth(request);
            const isDev = process.env.NODE_ENV === 'development';
            const isPrivileged = auth && ['admin', 'editor'].includes(auth.role || '');

            if (!isPrivileged && !isDev) {
                return NextResponse.json(
                    { error: 'Chain not found' },
                    { status: 404 }
                );
            }
        }

        const nodes = await getChainNodes(chain.id);
        return NextResponse.json({ nodes });
    } catch (error) {
        console.error('Error fetching nodes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch nodes' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/idea-chains/[slug]/nodes
 * Add a node to a chain
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
        if (!body.contribution_type || !VALID_CONTRIBUTION_TYPES.includes(body.contribution_type)) {
            return NextResponse.json(
                { error: 'Valid contribution_type is required' },
                { status: 400 }
            );
        }

        if (!body.contribution_summary?.trim()) {
            return NextResponse.json(
                { error: 'contribution_summary is required' },
                { status: 400 }
            );
        }

        const node = await createNode(chain.id, {
            source_id: body.source_id || null,
            citation_reference: body.citation_reference || null,
            quote_hebrew: body.quote_hebrew || null,
            quote_translated: body.quote_translated || null,
            external_url: body.external_url || null,
            contribution_type: body.contribution_type,
            contribution_summary: body.contribution_summary.trim(),
            contribution_summary_hebrew: body.contribution_summary_hebrew || null,
            base_idea_summary: body.base_idea_summary || null,
            approximate_year: body.approximate_year || null,
            position: body.position,
            is_origin: body.is_origin || false,
            parent_node_ids: body.parent_node_ids || [],
        });

        return NextResponse.json(node, { status: 201 });
    } catch (error) {
        console.error('Error creating node:', error);
        return NextResponse.json(
            { error: 'Failed to create node' },
            { status: 500 }
        );
    }
}
