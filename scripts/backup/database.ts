import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
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

function getDatabaseUrl(): string {
  return process.env.DATABASE_URL
    || process.env.DIRECTUS_DATABASE_URL
    || process.env.DB_URL
    || '';
}

function parseDbUrl(url: string) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

async function runDumpToFile(command: string, args: string[], outputPath: string, env?: NodeJS.ProcessEnv, compress?: boolean) {
  const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';

  if (!child.stdout) throw new Error('Backup command did not provide output');
  child.stderr?.on('data', chunk => { stderr += chunk.toString(); });

  const writeStream = fs.createWriteStream(outputPath);
  if (compress) {
    const gzip = createGzip({ level: 9 });
    await pipeline(child.stdout, gzip, writeStream);
  } else {
    await pipeline(child.stdout, writeStream);
  }

  const exitCode: number = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    throw new Error(`${command} failed (${exitCode}): ${stderr.trim()}`);
  }
}

async function backupPostgres(url: URL, outputPath: string, compress: boolean) {
  const user = decodeURIComponent(url.username || '');
  const password = decodeURIComponent(url.password || '');
  const host = url.hostname || 'localhost';
  const port = url.port || '5432';
  const dbName = url.pathname.replace(/^\//, '');

  if (!dbName) throw new Error('Postgres database name is missing in DATABASE_URL');

  const env = { ...process.env };
  if (password) env.PGPASSWORD = password;

  const args = ['-h', host, '-p', port, '-U', user || 'postgres', '-F', 'p', dbName];
  await runDumpToFile('pg_dump', args, outputPath, env, compress);
}

async function backupMysql(url: URL, outputPath: string, compress: boolean) {
  const user = decodeURIComponent(url.username || '');
  const password = decodeURIComponent(url.password || '');
  const host = url.hostname || 'localhost';
  const port = url.port || '3306';
  const dbName = url.pathname.replace(/^\//, '');

  if (!dbName) throw new Error('MySQL database name is missing in DATABASE_URL');

  const args = [
    `-h${host}`,
    `-P${port}`,
    `-u${user || 'root'}`,
    '--single-transaction',
    '--routines',
    '--events',
    dbName,
  ];

  if (password) {
    args.splice(3, 0, `--password=${password}`);
  }

  await runDumpToFile('mysqldump', args, outputPath, process.env, compress);
}

async function backupSqlite(url: URL, outputPath: string, compress: boolean) {
  const dbPath = url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;
  const sourcePath = decodeURIComponent(dbPath);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`SQLite database file not found at ${sourcePath}`);
  }

  const readStream = fs.createReadStream(sourcePath);
  const writeStream = fs.createWriteStream(outputPath);
  if (compress) {
    const gzip = createGzip({ level: 9 });
    await pipeline(readStream, gzip, writeStream);
  } else {
    await pipeline(readStream, writeStream);
  }
}

export async function runDatabaseBackup() {
  const backupDir = getBackupDir();
  const backupId = getBackupId('db');
  const targetDir = path.join(backupDir, backupId);
  const compression = getBooleanEnv('BACKUP_DB_COMPRESSION', true);
  const encryption = getBooleanEnv('BACKUP_DB_ENCRYPTION', true);
  const retentionDays = getDefaultRetentionDays('database');

  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    throw new Error('DATABASE_URL (or DIRECTUS_DATABASE_URL) is required for database backups');
  }

  const parsed = parseDbUrl(dbUrl);
  if (!parsed) throw new Error('DATABASE_URL is not a valid URL');

  const baseName = compression ? 'database.sql.gz' : 'database.sql';
  const tempPath = path.join(targetDir, baseName);

  const startedAt = new Date().toISOString();
  recordBackupStart({ id: backupId, type: 'database', startedAt, metadata: { compression, encryption } });

  fs.mkdirSync(targetDir, { recursive: true });

  const protocol = parsed.protocol.replace(':', '').toLowerCase();
  if (protocol.startsWith('postgres')) {
    await backupPostgres(parsed, tempPath, compression);
  } else if (protocol.startsWith('mysql') || protocol.startsWith('mariadb')) {
    await backupMysql(parsed, tempPath, compression);
  } else if (protocol.startsWith('sqlite') || protocol === 'file') {
    await backupSqlite(parsed, tempPath, compression);
  } else {
    throw new Error(`Unsupported database protocol: ${parsed.protocol}`);
  }

  let finalPath = tempPath;
  if (encryption) {
    const encryptedPath = `${tempPath}.enc`;
    await encryptFile(tempPath, encryptedPath);
    fs.unlinkSync(tempPath);
    finalPath = encryptedPath;
  }

  const stats = fs.statSync(finalPath);
  const manifest: BackupManifest = {
    id: backupId,
    type: 'database',
    createdAt: new Date().toISOString(),
    files: [finalPath],
    sizeBytes: stats.size,
    compression,
    encryption,
    metadata: {
      dbProtocol: parsed.protocol,
      retentionDays,
    }
  };

  writeManifest(targetDir, manifest);
  const removed = cleanRetention(backupDir, retentionDays);

  recordBackupResult({
    id: backupId,
    type: 'database',
    status: 'success',
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: undefined,
    sizeBytes: stats.size,
    files: [finalPath],
    message: removed.length ? `Retention cleanup removed ${removed.length} backups.` : undefined,
    metadata: manifest.metadata,
  });

  console.log(`Database backup complete: ${finalPath}`);
}

if (require.main === module) {
  runDatabaseBackup().catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    const backupId = getBackupId('db_failed');
    recordBackupResult({
      id: backupId,
      type: 'database',
      status: 'failed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      message,
    });
    console.error('Database backup failed:', message);
    process.exit(1);
  });
}
