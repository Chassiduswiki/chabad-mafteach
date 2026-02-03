import { logLevelName } from '@/lib/logging/levels';
import type { LogEntry } from '@/lib/logger';

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}

export function formatLogEntry(entry: LogEntry, format: 'json' | 'text'): string {
  if (format === 'json') {
    return safeStringify(entry);
  }

  const level = logLevelName(entry.level);
  const contextStr = entry.context ? ` ${safeStringify(entry.context)}` : '';
  const errorStr = entry.error ? ` ${safeStringify(entry.error)}` : '';
  return `[${entry.timestamp}] [${level}] ${entry.message}${contextStr}${errorStr}`;
}
