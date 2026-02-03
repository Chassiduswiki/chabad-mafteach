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

function resolveConfigPaths(): string[] {
  const raw = process.env.BACKUP_CONFIG_PATHS;
  if (raw) {
    return raw.split(',').map(entry => entry.trim()).filter(Boolean);
  }

  const candidates = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.staging',
    'next.config.ts',
    'next.config.js',
    'docker-compose.yml',
    'docker-compose.override.yml',
    'docker-compose.prod.yml',
    'directus.config.js',
    'config',
  ];

  return candidates.filter(candidate => fs.existsSync(path.join(process.cwd(), candidate)));
}

async function runTar(paths: string[], outputPath: string, compress: boolean) {
  const cwd = process.cwd();
  const relativePaths = paths.map(p => path.isAbsolute(p) ? path.relative(cwd, p) : p);
  const safePaths = relativePaths.filter(p => !p.startsWith('..') && p !== '');

  if (safePaths.length === 0) {
    throw new Error('No configuration paths are inside the project directory. Set BACKUP_CONFIG_PATHS.');
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

export async function runConfigBackup() {
  const backupDir = getBackupDir();
  const backupId = getBackupId('config');
  const targetDir = path.join(backupDir, backupId);
  const compression = getBooleanEnv('BACKUP_CONFIG_COMPRESSION', true);
  const encryption = getBooleanEnv('BACKUP_CONFIG_ENCRYPTION', true);
  const retentionDays = getDefaultRetentionDays('config');
  const configPaths = resolveConfigPaths();

  if (configPaths.length === 0) {
    throw new Error('No configuration paths found to back up. Configure BACKUP_CONFIG_PATHS.');
  }

  const startedAt = new Date().toISOString();
  recordBackupStart({ id: backupId, type: 'config', startedAt, metadata: { compression, encryption, configPaths } });

  fs.mkdirSync(targetDir, { recursive: true });
  const baseName = compression ? 'config.tar.gz' : 'config.tar';
  const archivePath = path.join(targetDir, baseName);

  await runTar(configPaths, archivePath, compression);

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
    type: 'config',
    createdAt: new Date().toISOString(),
    files: [finalPath],
    sizeBytes: stats.size,
    compression,
    encryption,
    metadata: {
      retentionDays,
      configPaths,
    }
  };

  writeManifest(targetDir, manifest);
  const removed = cleanRetention(backupDir, retentionDays);

  recordBackupResult({
    id: backupId,
    type: 'config',
    status: 'success',
    startedAt,
    completedAt: new Date().toISOString(),
    sizeBytes: stats.size,
    files: [finalPath],
    message: removed.length ? `Retention cleanup removed ${removed.length} backups.` : undefined,
    metadata: manifest.metadata,
  });

  console.log(`Config backup complete: ${finalPath}`);
}

if (require.main === module) {
  runConfigBackup().catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    const backupId = getBackupId('config_failed');
    recordBackupResult({
      id: backupId,
      type: 'config',
      status: 'failed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      message,
    });
    console.error('Config backup failed:', message);
    process.exit(1);
  });
}
