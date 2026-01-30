/**
 * Structured Logging System
 * Replaces console.log with proper logging service
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  component?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      component: context?.component,
      userId: context?.userId,
      requestId: context?.requestId,
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console in development
    if (process.env.NODE_ENV === 'development') {
      this.outputToConsole(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`[${levelName}] ${entry.message}${contextStr}`);
        break;
      case LogLevel.INFO:
        console.info(`[${levelName}] ${entry.message}${contextStr}`);
        break;
      case LogLevel.WARN:
        console.warn(`[${levelName}] ${entry.message}${contextStr}`);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`[${levelName}] ${entry.message}${contextStr}`);
        if (entry.error) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.addLog(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.addLog(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.addLog(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
    this.addLog(entry);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    
    const entry = this.createLogEntry(LogLevel.FATAL, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
    this.addLog(entry);
  }

  // Search-specific logging methods
  logSearch(query: string, mode: string, latency: number, resultCount: number, context?: Record<string, any>): void {
    this.info('Search performed', {
      query,
      mode,
      latency: `${latency}ms`,
      resultCount,
      ...context,
    });
  }

  logSearchError(query: string, mode: string, error: Error, context?: Record<string, any>): void {
    this.error('Search failed', error, {
      query,
      mode,
      ...context,
    });
  }

  logCacheOperation(operation: string, key: string, hit: boolean, context?: Record<string, any>): void {
    this.debug('Cache operation', {
      operation,
      key,
      hit,
      ...context,
    });
  }

  logEmbeddingRequest(text: string, model: string, success: boolean, latency?: number, context?: Record<string, any>): void {
    this.info('Embedding request', {
      textLength: text.length,
      model,
      success,
      latency: latency ? `${latency}ms` : undefined,
      ...context,
    });
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs for analysis
  exportLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Set log level
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, any>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, any>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context),
  fatal: (message: string, error?: Error, context?: Record<string, any>) => logger.fatal(message, error, context),
  search: (query: string, mode: string, latency: number, resultCount: number, context?: Record<string, any>) => 
    logger.logSearch(query, mode, latency, resultCount, context),
  searchError: (query: string, mode: string, error: Error, context?: Record<string, any>) => 
    logger.logSearchError(query, mode, error, context),
  cache: (operation: string, key: string, hit: boolean, context?: Record<string, any>) => 
    logger.logCacheOperation(operation, key, hit, context),
  embedding: (text: string, model: string, success: boolean, latency?: number, context?: Record<string, any>) => 
    logger.logEmbeddingRequest(text, model, success, latency, context),
};
