import * as Sentry from '@sentry/nextjs';
import { log } from '@/lib/logger';

export function trackError(error: Error, context?: Record<string, any>) {
  try {
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }
        Sentry.captureException(error);
      });
    }
  } catch (trackingError) {
    log.warn('Failed to send error to monitoring', {
      component: 'monitoring',
      error: (trackingError as Error).message,
    });
  }
}
