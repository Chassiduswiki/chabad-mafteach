import fs from 'fs/promises';
import path from 'path';
import type { LoggingConfig } from '@/lib/logging/config';
import type { LogEntry } from '@/lib/logger';
import { formatLogEntry } from '@/lib/logging/format';

type RotationState = {
  lastRotationKey: string | null;
  lastRetentionCheck: number;
};

const rotationStates = new Map<string, RotationState>();

function getRotationKey(schedule: LoggingConfig['rotation']['schedule']): string {
  if (schedule === 'none') return 'none';
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10);
  if (schedule === 'hourly') {
    const hour = String(now.getUTCHours()).padStart(2, '0');
    return `${datePart}T${hour}`;
  }
  return datePart;
}

async function rotateFiles(filePath: string, maxFiles: number): Promise<void> {
  if (maxFiles <= 0) return;

  for (let i = maxFiles - 1; i >= 1; i -= 1) {
    const src = `${filePath}.${i}`;
    const dest = `${filePath}.${i + 1}`;
    try {
      await fs.rename(src, dest);
    } catch {
      // Ignore missing files
    }
  }

  try {
    await fs.rename(filePath, `${filePath}.1`);
  } catch {
    // Ignore missing file
  }
}

async function cleanupOldFiles(filePath: string, retentionDays: number): Promise<void> {
  if (retentionDays <= 0) return;
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const entries = await fs.readdir(dir).catch(() => [] as string[]);
  const now = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

  await Promise.all(entries.map(async (entry) => {
    if (!entry.startsWith(base)) return;
    const fullPath = path.join(dir, entry);
    try {
      const stat = await fs.stat(fullPath);
      if (now - stat.mtimeMs > maxAgeMs) {
        await fs.unlink(fullPath);
      }
    } catch {
      // Ignore stat/delete errors
    }
  }));
}

async function ensureLogDirectory(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true }).catch(() => undefined);
}

export async function writeLogToFile(entry: LogEntry, config: LoggingConfig): Promise<void> {
  const filePath = config.file.path;
  const state = rotationStates.get(filePath) || { lastRotationKey: null, lastRetentionCheck: 0 };
  const rotationKey = getRotationKey(config.rotation.schedule);
  const formatted = formatLogEntry(entry, config.format) + '\n';

  await ensureLogDirectory(filePath);

  if (state.lastRotationKey && state.lastRotationKey !== rotationKey) {
    await rotateFiles(filePath, config.rotation.maxFiles);
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.size + Buffer.byteLength(formatted) > config.rotation.maxSizeBytes) {
      await rotateFiles(filePath, config.rotation.maxFiles);
    }
  } catch {
    // File does not exist yet; no rotation needed.
  }

  await fs.appendFile(filePath, formatted, 'utf8');

  const now = Date.now();
  if (now - state.lastRetentionCheck > 12 * 60 * 60 * 1000) {
    state.lastRetentionCheck = now;
    await cleanupOldFiles(filePath, config.retention);
  }

  state.lastRotationKey = rotationKey;
  rotationStates.set(filePath, state);
}
