import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/security/permissions';
import { withAudit } from '@/lib/security/audit';
import { adminReadRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';
import { collectSystemMetrics } from '@/lib/monitoring/metrics';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { trackError } from '@/lib/monitoring/error-tracking';

export const runtime = 'nodejs';

async function checkDirectus() {
  const directus = createClient();
  try {
    await directus.request(readItems('topics' as any, { limit: 1, fields: ['id'] }));
    return { status: 'ok' as const };
  } catch (error) {
    return { status: 'failed' as const, error: error instanceof Error ? error.message : String(error) };
  }
}

export const GET = requirePermission('canViewMonitoring', withAudit('read', 'admin.monitoring', async (req: NextRequest) => {
  const rateLimited = enforceRateLimit(req, adminReadRateLimit);
  if (rateLimited) return rateLimited;

  try {
    const [metrics, directus] = await Promise.all([
      collectSystemMetrics(),
      checkDirectus(),
    ]);

    const alerts: Array<{ type: 'warning' | 'critical'; message: string }> = [];
    if (metrics.cpu.loadPercent >= 90) {
      alerts.push({ type: 'critical', message: 'CPU load is above 90%.' });
    } else if (metrics.cpu.loadPercent >= 80) {
      alerts.push({ type: 'warning', message: 'CPU load is above 80%.' });
    }

    if (metrics.memory.usagePercent >= 90) {
      alerts.push({ type: 'critical', message: 'Memory usage is above 90%.' });
    } else if (metrics.memory.usagePercent >= 80) {
      alerts.push({ type: 'warning', message: 'Memory usage is above 80%.' });
    }

    if (metrics.disk.usagePercent !== null) {
      if (metrics.disk.usagePercent >= 90) {
        alerts.push({ type: 'critical', message: 'Disk usage is above 90%.' });
      } else if (metrics.disk.usagePercent >= 80) {
        alerts.push({ type: 'warning', message: 'Disk usage is above 80%.' });
      }
    }

    if (metrics.errors.total > 0) {
      alerts.push({ type: 'warning', message: `Detected ${metrics.errors.total} errors in last ${metrics.errors.windowMinutes} minutes.` });
    }

    if (directus.status === 'failed') {
      alerts.push({ type: 'critical', message: 'Directus connectivity check failed.' });
    }

    return NextResponse.json({
      metrics,
      checks: {
        directus,
      },
      alerts,
    });
  } catch (error) {
    trackError(error as Error, { route: 'admin.monitoring' });
    return NextResponse.json({ error: 'Failed to collect monitoring metrics' }, { status: 500 });
  }
}));
