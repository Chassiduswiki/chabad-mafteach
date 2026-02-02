import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { createItem, readItems } from '@directus/sdk';
import { log } from '@/lib/logger';

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  metadata?: Record<string, any>;
}

const AUDIT_COLLECTION = process.env.AUDIT_LOG_COLLECTION || 'audit_logs';

export function getRequestIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function getRequestUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

export async function recordAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const directus = createClient();
    await directus.request(
      // @ts-ignore - Directus SDK typing issue with untyped client
      createItem(AUDIT_COLLECTION, entry)
    );
  } catch (error) {
    log.warn('Audit log write failed', {
      component: 'audit',
      error: (error as Error)?.message,
      fallback: 'logger',
      entry
    });
  }
}

export function withAudit(
  action: string,
  resource: string,
  handler: (request: NextRequest, context: { userId: string; role: string }, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { userId: string; role: string }, ...args: any[]) => {
    let response: NextResponse | undefined;
    let success = false;

    try {
      response = await handler(request, context, ...args);
      success = response.status < 400;
      return response;
    } finally {
      const entry: AuditLogEntry = {
        userId: context.userId,
        action,
        resource,
        timestamp: new Date().toISOString(),
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
        success
      };

      void recordAuditEvent(entry);
    }
  };
}

export async function fetchAuditLogs(limit: number = 50) {
  try {
    const directus = createClient();
    const logs = await directus.request(
      // @ts-ignore - Directus SDK typing issue with untyped client
      readItems(AUDIT_COLLECTION, {
        sort: ['-timestamp'],
        limit
      })
    );
    return Array.isArray(logs) ? logs : [];
  } catch (error) {
    log.warn('Audit log fetch failed', {
      component: 'audit',
      error: (error as Error)?.message,
      fallback: 'empty'
    });
    return [] as AuditLogEntry[];
  }
}
