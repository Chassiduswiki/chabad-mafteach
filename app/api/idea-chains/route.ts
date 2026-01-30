import { NextRequest, NextResponse } from 'next/server';
import { getChains, createChain, generateSlug } from '@/lib/api/idea-chains';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/idea-chains
 * List all idea chains with optional filters
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || undefined;
        const featured = searchParams.get('featured');
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        // Check auth for draft chains
        const auth = verifyAuth(request);
        const isPrivileged = auth && ['admin', 'editor'].includes(auth.role || '');

        // Non-privileged users can only see published chains
        const effectiveStatus = isPrivileged ? status : 'published';

        const chains = await getChains({
            status: effectiveStatus,
            featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
            limit: Math.min(limit, 100),
            offset,
        });

        return NextResponse.json({ chains });
    } catch (error) {
        console.error('Error fetching idea chains:', error);
        return NextResponse.json(
            { error: 'Failed to fetch idea chains' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/idea-chains
 * Create a new idea chain
 */
export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const auth = verifyAuth(request);
        const isDev = process.env.NODE_ENV === 'development';

        if (!auth && !isDev) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate required fields
        if (!body.title?.trim()) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        // Generate slug if not provided
        const slug = body.slug?.trim() || await generateSlug(body.title);

        const chain = await createChain({
            title: body.title.trim(),
            title_hebrew: body.title_hebrew?.trim() || null,
            slug,
            description: body.description?.trim() || null,
            status: body.status || 'draft',
            is_featured: body.is_featured || false,
        });

        return NextResponse.json(chain, { status: 201 });
    } catch (error: any) {
        console.error('Error creating idea chain:', error);

        // Check for duplicate slug error
        if (error?.message?.includes('unique') || error?.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
            return NextResponse.json(
                { error: 'A chain with this slug already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create idea chain' },
            { status: 500 }
        );
    }
}
