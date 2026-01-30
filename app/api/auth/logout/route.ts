import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, setAuthStatusCookie } from '@/lib/cookie-utils';

export async function POST(request: NextRequest) {
  // Create response
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );

  // Clear the auth token cookie
  const clearCookie = clearAuthCookie();
  const statusCookie = setAuthStatusCookie(false);

  response.headers.set('Set-Cookie', clearCookie);
  response.headers.append('Set-Cookie', statusCookie);

  return response;
}
