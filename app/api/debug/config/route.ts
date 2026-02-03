import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { Schema } from '@/lib/types';
import { requirePermission } from '@/lib/security/permissions';
import { withAudit } from '@/lib/security/audit';
import { adminReadRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';
import { debugDisabledResponse, isDebugEnabled } from '@/lib/monitoring/debug';

export const dynamic = 'force-dynamic';

export const GET = requirePermission('canAccessDebug', withAudit('read', 'debug.config', async (request: NextRequest) => {
    const rateLimited = enforceRateLimit(request, adminReadRateLimit);
    if (rateLimited) return rateLimited;
    if (!isDebugEnabled()) return debugDisabledResponse();
    const configStatus = {
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '(not set)',
        DIRECTUS_URL: process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || '(not set)',
        DIRECTUS_TOKEN_SET: !!(process.env.DIRECTUS_STATIC_TOKEN || process.env.NEXT_PUBLIC_DIRECTUS_TOKEN),
        NODE_ENV: process.env.NODE_ENV,
    };

    let directusConnection = 'unknown';
    let directusError = null;

    try {
        await directus.request(readItems('topics', { limit: 1, fields: ['id'] }));
        directusConnection = 'success';
    } catch (error: any) {
        directusConnection = 'failed';
        directusError = error.message;
    }

    const collections = [
        'authors', 'documents', 'paragraphs', 'statements', 'sources', 'source_links',
        'topics', 'topic_relationships', 'statement_topics', 'translations'
    ];

    const collectionStatuses: Record<string, { status: string; error: string | null }> = {};

    for (const collection of collections) {
        try {
            await directus.request(readItems(collection as keyof Schema, { limit: 1, fields: ['id'] }));
            collectionStatuses[collection] = { status: 'success', error: null };
        } catch (error: any) {
            collectionStatuses[collection] = { status: 'failed', error: error.message || 'Unknown error' };
        }
    }

    return NextResponse.json({
        config: configStatus,
        directus: {
            status: directusConnection,
            error: directusError
        },
        collections: collectionStatuses
    });
}));
