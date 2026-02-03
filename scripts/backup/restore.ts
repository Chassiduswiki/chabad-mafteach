import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import {
  decryptFile,
  getBackupDir,
} from '@/lib/backup/utils';
import { recordBackupResult, recordBackupStart } from '@/lib/backup/monitoring';

let lastRestoreType: string | null = null;

function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        options[key] = next;
        i += 1;
      } else {
        options[key] = true;
      }
    }
  }
  return options;
}

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

async function streamFileToCommand(filePath: string, command: string, args: string[], env?: NodeJS.ProcessEnv, gunzip?: boolean) {
  const child = spawn(command, args, { env, stdio: ['pipe', 'inherit', 'inherit'] });
  if (!child.stdin) throw new Error(`${command} did not expose stdin`);

  const input = fs.createReadStream(filePath);
  if (gunzip) {
    const unzip = createGunzip();
    await pipeline(input, unzip, child.stdin);
  } else {
    await pipeline(input, child.stdin);
  }

  const exitCode: number = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    throw new Error(`${command} failed with exit code ${exitCode}`);
  }
}

async function restoreDatabase(backupPath: string) {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) throw new Error('DATABASE_URL is required for restore');
  const parsed = parseDbUrl(dbUrl);
  if (!parsed) throw new Error('DATABASE_URL is invalid');

  const protocol = parsed.protocol.replace(':', '').toLowerCase();
  const gunzip = backupPath.endsWith('.gz');

  if (protocol.startsWith('postgres')) {
    const user = decodeURIComponent(parsed.username || '');
    const password = decodeURIComponent(parsed.password || '');
    const host = parsed.hostname || 'localhost';
    const port = parsed.port || '5432';
    const dbName = parsed.pathname.replace(/^\//, '');

    const env = { ...process.env };
    if (password) env.PGPASSWORD = password;

    const args = ['-h', host, '-p', port, '-U', user || 'postgres', dbName];
    await streamFileToCommand(backupPath, 'psql', args, env, gunzip);
    return;
  }

  if (protocol.startsWith('mysql') || protocol.startsWith('mariadb')) {
    const user = decodeURIComponent(parsed.username || '');
    const password = decodeURIComponent(parsed.password || '');
    const host = parsed.hostname || 'localhost';
    const port = parsed.port || '3306';
    const dbName = parsed.pathname.replace(/^\//, '');

    const args = [
      `-h${host}`,
      `-P${port}`,
      `-u${user || 'root'}`,
      dbName,
    ];

    if (password) {
      args.splice(3, 0, `--password=${password}`);
    }

    await streamFileToCommand(backupPath, 'mysql', args, process.env, gunzip);
    return;
  }

  if (protocol.startsWith('sqlite') || protocol === 'file') {
    const dbPath = parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`;
    const targetPath = decodeURIComponent(dbPath);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`SQLite target path not found: ${targetPath}`);
    }

    if (gunzip) {
      const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'restore-'));
      const tempPath = path.join(tempDir, 'db.sqlite');
      const unzip = createGunzip();
      await pipeline(fs.createReadStream(backupPath), unzip, fs.createWriteStream(tempPath));
      await fs.promises.copyFile(tempPath, targetPath);
      return;
    }

    await fs.promises.copyFile(backupPath, targetPath);
    return;
  }

  throw new Error(`Unsupported database protocol: ${parsed.protocol}`);
}

async function restoreArchive(backupPath: string, targetDir: string) {
  const gunzip = backupPath.endsWith('.gz');
  const args = gunzip
    ? ['-xzf', backupPath, '-C', targetDir]
    : ['-xf', backupPath, '-C', targetDir];

  const child = spawn('tar', args, { stdio: 'inherit' });
  const exitCode: number = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    throw new Error(`tar failed with exit code ${exitCode}`);
  }
}

async function resolveBackupPath(idOrPath: string) {
  const directPath = path.isAbsolute(idOrPath)
    ? idOrPath
    : path.join(getBackupDir(), idOrPath);

  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) return directPath;
  if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
    const manifestPath = path.join(directPath, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as { files?: string[] };
      if (manifest.files?.length) return manifest.files[0];
    }
  }

  const fallback = path.join(getBackupDir(), idOrPath, 'manifest.json');
  if (fs.existsSync(fallback)) {
    const manifest = JSON.parse(fs.readFileSync(fallback, 'utf-8')) as { files?: string[] };
    if (manifest.files?.length) return manifest.files[0];
  }

  throw new Error('Backup file could not be resolved. Provide --id or --file.');
}

export async function runRestore() {
  const args = parseArgs();
  const type = (args.type as string | undefined) || '';
  lastRestoreType = type || null;
  const id = (args.id as string | undefined) || (args.file as string | undefined) || '';

  if (!type || !id) {
    console.log('Usage: node scripts/backup/restore.ts --type <database|assets|config> --id <backupId>');
    console.log('       node scripts/backup/restore.ts --type <database|assets|config> --file <backupPath>');
    process.exit(1);
  }

  const backupPath = await resolveBackupPath(id);
  const startedAt = new Date().toISOString();
  const restoreId = `restore_${Date.now()}`;
  recordBackupStart({ id: restoreId, type: type as any, startedAt, metadata: { backupPath } });

  let workingPath = backupPath;
  let tempDir: string | null = null;

  if (backupPath.endsWith('.enc')) {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'backup-decrypt-'));
    workingPath = path.join(tempDir, path.basename(backupPath).replace(/\.enc$/, ''));
    await decryptFile(backupPath, workingPath);
  }

  if (type === 'database') {
    await restoreDatabase(workingPath);
  } else if (type === 'assets') {
    const targetDir = (args.target as string | undefined) || process.cwd();
    await restoreArchive(workingPath, targetDir);
  } else if (type === 'config') {
    const targetDir = (args.target as string | undefined) || process.cwd();
    await restoreArchive(workingPath, targetDir);
  } else {
    throw new Error(`Unknown restore type: ${type}`);
  }

  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  recordBackupResult({
    id: restoreId,
    type: type as any,
    status: 'success',
    startedAt,
    completedAt: new Date().toISOString(),
    message: `Restore complete for ${type}.`,
    metadata: { backupPath },
  });

  console.log(`Restore complete for ${type}`);
}

if (require.main === module) {
  runRestore().catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    recordBackupResult({
      id: `restore_failed_${Date.now()}`,
      type: (lastRestoreType as any) || 'database',
      status: 'failed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      message,
    });
    console.error('Restore failed:', message);
    process.exit(1);
  });
}
