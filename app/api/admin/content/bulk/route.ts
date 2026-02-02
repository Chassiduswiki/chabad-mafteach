import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { updateItem } from '@directus/sdk';
import { requirePermission } from '@/lib/security/permissions';
import { withAudit } from '@/lib/security/audit';
import { adminWriteRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';

/**
 * PATCH /api/admin/content/bulk
 * 
 * Generic bulk update for any collection (topics, statements, etc.)
 * Restricted to admins and editors.
 */
export const PATCH = requirePermission('canEditTopics', withAudit('update', 'admin.content.bulk', async (request: NextRequest) => {
  const rateLimited = enforceRateLimit(request, adminWriteRateLimit);
  if (rateLimited) return rateLimited;

  try {
    const { type, ids, updates } = await request.json();

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0 || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allowedTypes = new Set(['topics', 'statements']);
    if (!allowedTypes.has(type)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const directus = createClient();
    const results = [];
    const errors = [];

    // Process updates
    for (const id of ids) {
      try {
        const updated = await directus.request(updateItem(type as any, id, updates));
        results.push({ id, status: 'success' });
      } catch (error: any) {
        console.error(`Bulk update error for ${type} ${id}:`, error);
        errors.push({ id, status: 'error', message: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error: any) {
    console.error('Bulk update route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}));
