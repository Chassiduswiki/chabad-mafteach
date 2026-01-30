import { NextRequest, NextResponse } from 'next/server';
import { getChainBySlug, deleteLink } from '@/lib/api/idea-chains';
import { verifyAuth } from '@/lib/auth';

/**
 * DELETE /api/idea-chains/[slug]/links/[linkId]
 * Delete a link between nodes
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; linkId: string }> }
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

        const { slug, linkId } = await params;
        const chain = await getChainBySlug(slug);

        if (!chain) {
            return NextResponse.json(
                { error: 'Chain not found' },
                { status: 404 }
            );
        }

        // Verify link belongs to this chain
        const linkIdNum = parseInt(linkId, 10);
        const existingLink = chain.links.find(l => l.id === linkIdNum);

        if (!existingLink) {
            return NextResponse.json(
                { error: 'Link not found in this chain' },
                { status: 404 }
            );
        }

        await deleteLink(linkIdNum);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting link:', error);
        return NextResponse.json(
            { error: 'Failed to delete link' },
            { status: 500 }
        );
    }
}
