import { log } from '@/lib/logger';

export type PerformanceContext = {
  route?: string;
  method?: string;
  userId?: string;
  requestId?: string;
  component?: string;
};

export async function withPerformanceLogging<T>(
  label: string,
  fn: () => Promise<T>,
  context?: PerformanceContext
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    log.info('Performance metric', {
      component: 'performance',
      label,
      durationMs,
      ...context,
    });
    return result;
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    log.warn('Performance metric failed', {
      component: 'performance',
      label,
      durationMs,
      error: (error as Error)?.message,
      ...context,
    });
    throw error;
  }
}

export function logDbQuery(
  query: string,
  durationMs: number,
  context?: Record<string, any>
): void {
  log.info('Database query', {
    component: 'database',
    query,
    durationMs,
    ...context,
  });
}
