import { NextResponse } from 'next/server';

export function isDebugEnabled(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  const flag = process.env.DEBUG_ENDPOINTS_ENABLED || '';
  return ['1', 'true', 'yes', 'on'].includes(flag.toLowerCase());
}

export function debugDisabledResponse() {
  return NextResponse.json({ error: 'Debug endpoints are disabled' }, { status: 404 });
}
