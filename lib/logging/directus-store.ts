import { createClient } from '@/lib/directus';
import type { LoggingConfig } from '@/lib/logging/config';
import type { LogEntry } from '@/lib/logger';
import { logLevelName } from '@/lib/logging/levels';
import { createItem, deleteItems } from '@directus/sdk';

const cleanupState = {
  lastCleanupAt: 0,
};

export async function writeLogToDirectus(entry: LogEntry, config: LoggingConfig): Promise<void> {
  try {
    const directus = createClient();
    const payload = {
      timestamp: entry.timestamp,
      level: entry.level,
      levelName: logLevelName(entry.level),
      message: entry.message,
      context: entry.context || null,
      userId: entry.userId || null,
      requestId: entry.requestId || null,
      component: entry.component || null,
      error: entry.error || null,
    };

    await directus.request(
      // @ts-ignore - Directus SDK typing issue with untyped client
      createItem(config.directus.collection, payload)
    );
  } catch (error) {
    // Avoid recursive logging; fall back to console.
    console.warn('[Logging] Directus log write failed:', (error as Error)?.message);
  }

  void cleanupDirectusRetention(config);
}

async function cleanupDirectusRetention(config: LoggingConfig): Promise<void> {
  const retentionDays = config.retention;
  if (retentionDays <= 0) return;

  const now = Date.now();
  if (now - cleanupState.lastCleanupAt < 12 * 60 * 60 * 1000) return;

  cleanupState.lastCleanupAt = now;
  const cutoff = new Date(now - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const directus = createClient();
    await directus.request(
      // @ts-ignore - Directus SDK typing issue with untyped client
      deleteItems(config.directus.collection, {
        filter: {
          timestamp: { _lt: cutoff },
        },
      })
    );
  } catch (error) {
    console.warn('[Logging] Directus retention cleanup failed:', (error as Error)?.message);
  }
}
