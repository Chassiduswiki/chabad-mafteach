import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { logger } from '@/lib/logger';
import { getLoggingConfig } from '@/lib/logging/config';
import type { LogEntry } from '@/lib/logger';

export type LogQuery = {
  q?: string;
  level?: string;
  component?: string;
  userId?: string;
  requestId?: string;
  start?: string;
  end?: string;
  limit?: number;
  offset?: number;
};

export async function searchLogs(query: LogQuery): Promise<{ logs: LogEntry[]; total: number }> {
  const config = getLoggingConfig();
  if (!config.directus.enabled) {
    const fallback = logger.getRecentLogs(query.limit || 100);
    return { logs: fallback, total: fallback.length };
  }

  const filter: Record<string, any> = {};
  if (query.q) {
    filter.message = { _contains: query.q };
  }
  if (query.level) {
    filter.levelName = { _eq: query.level.toUpperCase() };
  }
  if (query.component) {
    filter.component = { _eq: query.component };
  }
  if (query.userId) {
    filter.userId = { _eq: query.userId };
  }
  if (query.requestId) {
    filter.requestId = { _eq: query.requestId };
  }
  if (query.start || query.end) {
    filter.timestamp = {
      ...(query.start ? { _gte: query.start } : {}),
      ...(query.end ? { _lte: query.end } : {}),
    };
  }

  const directus = createClient();
  const logs = await directus.request(
    // @ts-ignore - Directus SDK typing issue with untyped client
    readItems(config.directus.collection, {
      filter: Object.keys(filter).length ? filter : undefined,
      sort: ['-timestamp'],
      limit: query.limit || 100,
      offset: query.offset || 0,
    })
  );

  const normalized = Array.isArray(logs) ? logs : [];
  return { logs: normalized as LogEntry[], total: normalized.length };
}
