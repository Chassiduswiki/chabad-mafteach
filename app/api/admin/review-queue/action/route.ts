import { NextRequest, NextResponse } from 'next/server';
import { updateItem } from '@directus/sdk';
import { createClient } from '@/lib/directus';
import { requirePermission } from '@/lib/security/permissions';
import { withAudit } from '@/lib/security/audit';
import { adminWriteRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';

/**
 * POST /api/admin/review-queue/action
 * 
 * Performs an action (approve/reject) on a review queue item.
 */
export const POST = requirePermission('canEditTopics', withAudit('update', 'admin.review-queue.action', async (req: NextRequest) => {
  const rateLimited = enforceRateLimit(req, adminWriteRateLimit);
  if (rateLimited) return rateLimited;

  try {
    const { type, id, action } = await req.json();
    
    if (!type || !id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const directus = createClient();
    
    // Determine new status
    const newStatus = action === 'approve' ? 'published' : 'draft';
    
    // Update the item
    // 'type' is either 'topics' or 'statements'
    await directus.request(updateItem(type as any, id, {
      status: newStatus,
      // For topics, we might want to set is_published as well if it's a separate field
      ...(type === 'topics' ? { is_published: action === 'approve' } : {})
    }));

    return NextResponse.json({ success: true, id, newStatus });
  } catch (error) {
    console.error('Review action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}));
