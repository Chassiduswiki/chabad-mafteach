import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/security/permissions';
import { withAudit } from '@/lib/security/audit';
import { adminReadRateLimit, adminWriteRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';
import { getBackupStatus, listBackupManifests, resolveBackupStatePath, resolveBackupStorageDir } from '@/lib/backup/monitoring';
import { runDatabaseBackup } from '@/scripts/backup/database';
import { runAssetBackup } from '@/scripts/backup/assets';
import { runConfigBackup } from '@/scripts/backup/config';

export const runtime = 'nodejs';

export const GET = requirePermission('canManageBackups', withAudit('read', 'admin.backup', async (req: NextRequest) => {
  const rateLimited = enforceRateLimit(req, adminReadRateLimit);
  if (rateLimited) return rateLimited;

  const status = getBackupStatus();
  const manifests = listBackupManifests();

  return NextResponse.json({
    status,
    manifests,
    storageDir: resolveBackupStorageDir(),
    statePath: resolveBackupStatePath(),
  });
}));

export const POST = requirePermission('canManageBackups', withAudit('write', 'admin.backup', async (req: NextRequest) => {
  const rateLimited = enforceRateLimit(req, adminWriteRateLimit);
  if (rateLimited) return rateLimited;

  let payload: { type?: string; action?: string } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const action = payload.action || 'run';
  const type = payload.type || 'database';

  if (action !== 'run') {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }

  if (type === 'database') {
    await runDatabaseBackup();
  } else if (type === 'assets') {
    await runAssetBackup();
  } else if (type === 'config') {
    await runConfigBackup();
  } else if (type === 'all') {
    await runDatabaseBackup();
    await runAssetBackup();
    await runConfigBackup();
  } else {
    return NextResponse.json({ error: 'Unsupported backup type' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, type });
}));
