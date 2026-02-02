import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem, createItem } from '@directus/sdk';
import { requireAdmin } from '@/lib/auth';
import { withAudit } from '@/lib/security/audit';
import { adminReadRateLimit, adminWriteRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';

/**
 * GET /api/admin/maintenance
 * 
 * Logic:
 * Check for a special record in a 'system_status' collection or a global preset.
 * For this implementation, we'll check for a topic with slug 'system-maintenance'.
 */
export const GET = requireAdmin(withAudit('read', 'admin.maintenance', async (req: NextRequest) => {
  const rateLimited = enforceRateLimit(req, adminReadRateLimit);
  if (rateLimited) return rateLimited;

  try {
    const directus = createClient();
    
    // We'll use a specific topic slug 'system-maintenance' to store the status
    // metadata.is_maintenance: boolean
    const topics = await directus.request(readItems('topics', {
      filter: { slug: { _eq: 'system-maintenance' } },
      fields: ['metadata'],
      limit: 1
    })) as any[];

    const isMaintenance = topics[0]?.metadata?.is_maintenance || false;

    return NextResponse.json({ isMaintenance });
  } catch (error) {
    return NextResponse.json({ isMaintenance: false });
  }
}));

/**
 * POST /api/admin/maintenance
 */
export const POST = requireAdmin(withAudit('update', 'admin.maintenance', async (req: NextRequest) => {
  const rateLimited = enforceRateLimit(req, adminWriteRateLimit);
  if (rateLimited) return rateLimited;

  try {
    const { enabled } = await req.json();
    const directus = createClient();

    // Find or create the maintenance topic
    const topics = await directus.request(readItems('topics', {
      filter: { slug: { _eq: 'system-maintenance' } },
      fields: ['id', 'metadata'],
      limit: 1
    })) as any[];

    if (topics.length > 0) {
      // Update existing
      await directus.request(updateItem('topics' as any, topics[0].id, {
        metadata: { ...topics[0].metadata, is_maintenance: enabled }
      }));
    } else {
      // Create new hidden topic for status
      await directus.request(createItem('topics' as any, {
        canonical_title: 'System Maintenance Status',
        slug: 'system-maintenance',
        topic_type: 'concept',
        status: 'archived', // Hide from public
        metadata: { is_maintenance: enabled }
      }));
    }

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error('Maintenance toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}));
