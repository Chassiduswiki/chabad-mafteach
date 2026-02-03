import { NextRequest, NextResponse } from 'next/server';
import { getChainBySlug, updateChain, deleteChain } from '@/lib/api/idea-chains';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/idea-chains/[slug]
 * Get a single chain with all nodes and links
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

        return NextResponse.json(chain);
    } catch (error) {
        console.error('Error fetching idea chain:', error);
        return NextResponse.json(
            { error: 'Failed to fetch idea chain' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/idea-chains/[slug]
 * Update a chain's metadata
 */
export async function PATCH(
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
        const updates = await request.json();

        // Validate updates
        const allowedFields = ['title', 'title_hebrew', 'description', 'status', 'is_featured'];
        const cleanedUpdates = Object.fromEntries(
            Object.entries(updates).filter(([key]) => allowedFields.includes(key))
        );

        if (Object.keys(cleanedUpdates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        const chain = await updateChain(slug, cleanedUpdates);

        if (!chain) {
            return NextResponse.json(
                { error: 'Chain not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(chain);
    } catch (error) {
        console.error('Error updating idea chain:', error);
        return NextResponse.json(
            { error: 'Failed to update idea chain' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/idea-chains/[slug]
 * Delete a chain (admin only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const auth = verifyAuth(request);
        const isDev = process.env.NODE_ENV === 'development';

        // Require admin role for deletion
        if (!isDev && (!auth || auth.role !== 'admin')) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const { slug } = await params;
        const deleted = await deleteChain(slug);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Chain not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting idea chain:', error);
        return NextResponse.json(
            { error: 'Failed to delete idea chain' },
            { status: 500 }
        );
    }
}
