export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export function logLevelName(level: LogLevel): string {
  return LogLevel[level] || 'UNKNOWN';
}

export function parseLogLevel(value: string | undefined, fallback: LogLevel): LogLevel {
  if (!value) return fallback;
  const normalized = value.toLowerCase().trim();
  switch (normalized) {
    case 'debug':
      return LogLevel.DEBUG;
    case 'info':
      return LogLevel.INFO;
    case 'warn':
    case 'warning':
      return LogLevel.WARN;
    case 'error':
      return LogLevel.ERROR;
    case 'fatal':
      return LogLevel.FATAL;
    default: {
      const asNumber = Number(normalized);
      if (Number.isFinite(asNumber)) {
        const clamped = Math.min(LogLevel.FATAL, Math.max(LogLevel.DEBUG, asNumber));
        return clamped as LogLevel;
      }
      return fallback;
    }
  }
}
