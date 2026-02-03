import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { ENCRYPTION_ALGORITHM, ENCRYPTION_IV_LENGTH, ENCRYPTION_TAG_LENGTH, getEncryptionKey } from '@/lib/security/encryption';

export type BackupType = 'database' | 'assets' | 'config';

export interface BackupOptions {
  compression: boolean;
  encryption: boolean;
  retentionDays: number;
  backupDir: string;
  type: BackupType;
}

export interface BackupManifest {
  id: string;
  type: BackupType;
  createdAt: string;
  files: string[];
  sizeBytes: number;
  compression: boolean;
  encryption: boolean;
  metadata?: Record<string, any>;
}

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getBackupDir(): string {
  return process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
}

export function getBackupId(prefix: string): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const random = crypto.randomBytes(3).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
}

export function getDefaultRetentionDays(type: BackupType): number {
  const envKey = type === 'database' ? 'BACKUP_DB_RETENTION_DAYS'
    : type === 'assets' ? 'BACKUP_ASSET_RETENTION_DAYS'
    : 'BACKUP_CONFIG_RETENTION_DAYS';
  const raw = process.env[envKey];
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return type === 'database' ? 30 : 90;
}

export function getBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

export async function encryptFile(inputPath: string, outputPath: string): Promise<void> {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  ensureDir(path.dirname(outputPath));

  const input = createReadStream(inputPath);
  const output = createWriteStream(outputPath);
  output.write(iv);

  await pipeline(input, cipher, output);
  const tag = cipher.getAuthTag();
  await fs.promises.appendFile(outputPath, tag);
}

export async function decryptFile(inputPath: string, outputPath: string): Promise<void> {
  const stats = await fs.promises.stat(inputPath);
  if (stats.size <= ENCRYPTION_IV_LENGTH + ENCRYPTION_TAG_LENGTH) {
    throw new Error('Encrypted file is too small to be valid');
  }

  const fd = await fs.promises.open(inputPath, 'r');
  const iv = Buffer.alloc(ENCRYPTION_IV_LENGTH);
  const tag = Buffer.alloc(ENCRYPTION_TAG_LENGTH);
  await fd.read(iv, 0, ENCRYPTION_IV_LENGTH, 0);
  await fd.read(tag, 0, ENCRYPTION_TAG_LENGTH, stats.size - ENCRYPTION_TAG_LENGTH);
  await fd.close();

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const input = createReadStream(inputPath, {
    start: ENCRYPTION_IV_LENGTH,
    end: stats.size - ENCRYPTION_TAG_LENGTH - 1,
  });
  const output = createWriteStream(outputPath);
  await pipeline(input, decipher, output);
}

export function writeManifest(dir: string, manifest: BackupManifest): void {
  ensureDir(dir);
  const manifestPath = path.join(dir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

export function cleanRetention(backupDir: string, retentionDays: number): string[] {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  if (!fs.existsSync(backupDir)) return [];

  const removed: string[] = [];
  for (const entry of fs.readdirSync(backupDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dirPath = path.join(backupDir, entry.name);
    try {
      const manifestPath = path.join(dirPath, 'manifest.json');
      const stat = fs.statSync(manifestPath);
      if (stat.mtime.getTime() < cutoff) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        removed.push(dirPath);
      }
    } catch {
      // ignore
    }
  }

  return removed;
}
