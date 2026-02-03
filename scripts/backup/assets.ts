import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import {
  BackupManifest,
  cleanRetention,
  encryptFile,
  getBackupDir,
  getBackupId,
  getBooleanEnv,
  getDefaultRetentionDays,
  writeManifest,
} from '@/lib/backup/utils';
import { recordBackupResult, recordBackupStart } from '@/lib/backup/monitoring';

function resolveAssetPaths(): string[] {
  const raw = process.env.BACKUP_ASSET_PATHS;
  if (raw) {
    return raw.split(',').map(entry => entry.trim()).filter(Boolean);
  }

  const candidates = [
    'public/uploads',
    'uploads',
    'storage',
    'public/assets',
    'data/uploads',
    'data/assets',
  ];

  return candidates.filter(candidate => fs.existsSync(path.join(process.cwd(), candidate)));
}

async function runTar(paths: string[], outputPath: string, compress: boolean) {
  const cwd = process.cwd();
  const relativePaths = paths.map(p => path.isAbsolute(p) ? path.relative(cwd, p) : p);
  const safePaths = relativePaths.filter(p => !p.startsWith('..') && p !== '');

  if (safePaths.length === 0) {
    throw new Error('No asset paths are inside the project directory. Set BACKUP_ASSET_PATHS with valid paths.');
  }

  const args = compress
    ? ['-czf', outputPath, '-C', cwd, ...safePaths]
    : ['-cf', outputPath, '-C', cwd, ...safePaths];

  const child = spawn('tar', args, { stdio: 'inherit' });
  const exitCode: number = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    throw new Error(`tar failed with exit code ${exitCode}`);
  }
}

export async function runAssetBackup() {
  const backupDir = getBackupDir();
  const backupId = getBackupId('assets');
  const targetDir = path.join(backupDir, backupId);
  const compression = getBooleanEnv('BACKUP_ASSET_COMPRESSION', true);
  const encryption = getBooleanEnv('BACKUP_ASSET_ENCRYPTION', true);
  const retentionDays = getDefaultRetentionDays('assets');
  const assetPaths = resolveAssetPaths();

  if (assetPaths.length === 0) {
    throw new Error('No asset paths found to back up. Configure BACKUP_ASSET_PATHS.');
  }

  const startedAt = new Date().toISOString();
  recordBackupStart({ id: backupId, type: 'assets', startedAt, metadata: { compression, encryption, assetPaths } });

  fs.mkdirSync(targetDir, { recursive: true });
  const baseName = compression ? 'assets.tar.gz' : 'assets.tar';
  const archivePath = path.join(targetDir, baseName);

  await runTar(assetPaths, archivePath, compression);

  let finalPath = archivePath;
  if (encryption) {
    const encryptedPath = `${archivePath}.enc`;
    await encryptFile(archivePath, encryptedPath);
    fs.unlinkSync(archivePath);
    finalPath = encryptedPath;
  }

  const stats = fs.statSync(finalPath);
  const manifest: BackupManifest = {
    id: backupId,
    type: 'assets',
    createdAt: new Date().toISOString(),
    files: [finalPath],
    sizeBytes: stats.size,
    compression,
    encryption,
    metadata: {
      retentionDays,
      assetPaths,
    }
  };

  writeManifest(targetDir, manifest);
  const removed = cleanRetention(backupDir, retentionDays);

  recordBackupResult({
    id: backupId,
    type: 'assets',
    status: 'success',
    startedAt,
    completedAt: new Date().toISOString(),
    sizeBytes: stats.size,
    files: [finalPath],
    message: removed.length ? `Retention cleanup removed ${removed.length} backups.` : undefined,
    metadata: manifest.metadata,
  });

  console.log(`Asset backup complete: ${finalPath}`);
}

if (require.main === module) {
  runAssetBackup().catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    const backupId = getBackupId('assets_failed');
    recordBackupResult({
      id: backupId,
      type: 'assets',
      status: 'failed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      message,
    });
    console.error('Asset backup failed:', message);
    process.exit(1);
  });
}
