import { log } from '@/lib/logger';
import { recordAuditEvent } from '@/lib/security/audit';

export type SecurityEvent = {
  userId?: string;
  action: string;
  resource: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  metadata?: Record<string, any>;
};

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  log.warn('Security event', {
    component: 'security',
    action: event.action,
    resource: event.resource,
    success: event.success,
    userId: event.userId,
    reason: event.reason,
    ...event.metadata,
  });

  await recordAuditEvent({
    userId: event.userId || 'unknown',
    action: event.action,
    resource: event.resource,
    timestamp: new Date().toISOString(),
    ipAddress: event.ipAddress || 'unknown',
    userAgent: event.userAgent || 'unknown',
    success: event.success,
    metadata: {
      reason: event.reason,
      ...event.metadata,
    },
  });
}
