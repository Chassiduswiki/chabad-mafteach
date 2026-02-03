import { NextRequest, NextResponse } from 'next/server';
import { createRateLimit } from '@/lib/rate-limit';

export const adminWriteRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  message: 'Too many admin write actions. Please slow down.'
});

export const adminReadRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  message: 'Too many admin requests. Please slow down.'
});

export function enforceRateLimit(
  request: NextRequest,
  limiter: (request: Request) => { success: boolean; error?: string }
): NextResponse | null {
  const result = limiter(request);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Too many requests' },
      { status: 429 }
    );
  }

  return null;
}
