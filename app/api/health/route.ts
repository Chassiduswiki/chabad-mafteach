import { NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'failed'; error?: string }> = {};
  let statusCode = 200;

  try {
    const directus = createClient();
    await directus.request(readItems('topics' as any, { limit: 1, fields: ['id'] }));
    checks.directus = { status: 'ok' };
  } catch (error) {
    checks.directus = { status: 'failed', error: error instanceof Error ? error.message : String(error) };
    statusCode = 503;
  }

  return NextResponse.json({
    status: statusCode === 200 ? 'ok' : 'degraded',
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    checks,
  }, { status: statusCode });
}
