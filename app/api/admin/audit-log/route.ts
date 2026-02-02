import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { requirePermission } from '@/lib/security/permissions';
import { fetchAuditLogs, withAudit } from '@/lib/security/audit';
import { adminReadRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';

export const GET = requirePermission('canViewPerformanceMetrics', withAudit('read', 'admin.audit-log', async (req: NextRequest) => {
  const rateLimited = enforceRateLimit(req, adminReadRateLimit);
  if (rateLimited) return rateLimited;

  try {
    const directus = createClient();
    
    // Fetch latest activity from Directus
    const activity = await directus.request(readItems('directus_activity' as any, {
      fields: ['id', 'action', 'collection', 'timestamp', 'user.first_name', 'user.last_name'],
      sort: ['-timestamp'],
      limit: 50
    }));

    const auditLogs = await fetchAuditLogs(50);

    return NextResponse.json({ activity, auditLogs });
  } catch (error) {
    console.error('Audit log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}));
