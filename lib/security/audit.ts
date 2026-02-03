import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { createItem, readItems } from '@directus/sdk';
import { log } from '@/lib/logger';

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
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

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'apiKey', 'authorization', 'cookie'];

function redactSensitiveFields(value: any): any {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveFields);
  }
  if (value && typeof value === 'object') {
    const redacted: Record<string, any> = {};
    Object.entries(value).forEach(([key, val]) => {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        redacted[key] = '[redacted]';
      } else {
        redacted[key] = redactSensitiveFields(val);
      }
    });
    return redacted;
  }
  if (typeof value === 'string' && value.length > 2000) {
    return `${value.slice(0, 2000)}…`;
  }
  return value;
}

async function extractAuditChanges(request: NextRequest): Promise<Record<string, any> | undefined> {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  try {
    const cloned = request.clone();
    const body = await cloned.json();
    return redactSensitiveFields(body);
  } catch {
    return undefined;
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
    const changes = await extractAuditChanges(request);

    try {
      response = await handler(request, context, ...args);
      success = response.status < 400;
      return response;
    } finally {
      const entry: AuditLogEntry = {
        userId: context.userId,
        action,
        resource,
        changes,
        timestamp: new Date().toISOString(),
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
        success,
        metadata: {
          method: request.method,
          path: request.nextUrl?.pathname,
        }
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
