import path from 'path';
import { LogLevel, parseLogLevel } from '@/lib/logging/levels';

export interface LoggingConfig {
  level: LogLevel;
  rotation: {
    maxSize: string;
    maxSizeBytes: number;
    maxFiles: number;
    schedule: 'daily' | 'hourly' | 'none';
  };
  retention: number;
  format: 'json' | 'text';
  console: {
    enabled: boolean;
  };
  file: {
    enabled: boolean;
    path: string;
  };
  directus: {
    enabled: boolean;
    collection: string;
  };
}

const DEFAULT_ROTATION = {
  maxSize: '10mb',
  maxFiles: 7,
  schedule: 'daily' as const,
};

const DEFAULT_RETENTION_DAYS = 14;

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parseSize(value: string | undefined, fallback: string): { label: string; bytes: number } {
  const input = (value || fallback).toLowerCase().trim();
  const match = input.match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)?$/);
  if (!match) {
    return { label: fallback, bytes: sizeToBytes(fallback) };
  }
  const amount = Number(match[1]);
  const unit = match[2] || 'b';
  const multiplier = unit === 'gb' ? 1024 ** 3 : unit === 'mb' ? 1024 ** 2 : unit === 'kb' ? 1024 : 1;
  return { label: `${amount}${unit}`, bytes: Math.max(0, Math.round(amount * multiplier)) };
}

function sizeToBytes(label: string): number {
  return parseSize(label, '1mb').bytes;
}

export function getLoggingConfig(): LoggingConfig {
  const isProd = process.env.NODE_ENV === 'production';
  const level = parseLogLevel(process.env.LOG_LEVEL, isProd ? LogLevel.INFO : LogLevel.DEBUG);
  const format = process.env.LOG_FORMAT === 'text' ? 'text' : 'json';
  const rotationSize = parseSize(process.env.LOG_ROTATION_MAX_SIZE, DEFAULT_ROTATION.maxSize);
  const rotationMaxFiles = Number(process.env.LOG_ROTATION_MAX_FILES || DEFAULT_ROTATION.maxFiles);
  const rotationScheduleRaw = (process.env.LOG_ROTATION_SCHEDULE || DEFAULT_ROTATION.schedule).toLowerCase();
  const rotationSchedule = rotationScheduleRaw === 'hourly' ? 'hourly' : rotationScheduleRaw === 'none' ? 'none' : 'daily';
  const retentionDays = Number(process.env.LOG_RETENTION_DAYS || DEFAULT_RETENTION_DAYS);

  const fileEnabled = parseBool(process.env.LOG_TO_FILE, isProd);
  const filePath = process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs', 'app.log');

  const directusEnabled = parseBool(process.env.LOG_TO_DIRECTUS, isProd);
  const directusCollection = process.env.LOG_COLLECTION || 'app_logs';

  const consoleEnabled = parseBool(process.env.LOG_TO_CONSOLE, !isProd);

  return {
    level,
    rotation: {
      maxSize: rotationSize.label,
      maxSizeBytes: rotationSize.bytes,
      maxFiles: Number.isFinite(rotationMaxFiles) ? Math.max(1, rotationMaxFiles) : DEFAULT_ROTATION.maxFiles,
      schedule: rotationSchedule,
    },
    retention: Number.isFinite(retentionDays) ? Math.max(1, retentionDays) : DEFAULT_RETENTION_DAYS,
    format,
    console: {
      enabled: consoleEnabled,
    },
    file: {
      enabled: fileEnabled,
      path: filePath,
    },
    directus: {
      enabled: directusEnabled,
      collection: directusCollection,
    },
  };
}
