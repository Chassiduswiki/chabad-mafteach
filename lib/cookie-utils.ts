// Secure cookie utilities for JWT token management
import { NextRequest } from 'next/server';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
}

export function setAuthCookie(token: string, options: CookieOptions = {}): string {
  const {
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'strict',
    maxAge = 24 * 60 * 60, // 24 hours in seconds
    path = '/'
  } = options;

  const cookieValue = [
    `auth_token=${token}`,
    `Path=${path}`,
    `HttpOnly=${httpOnly ? 'true' : 'false'}`,
    `Secure=${secure ? 'true' : 'false'}`,
    `SameSite=${sameSite}`,
    `Max-Age=${maxAge}`
  ].join('; ');

  return cookieValue;
}

export function clearAuthCookie(): string {
  return 'auth_token=; Path=/; HttpOnly=true; Secure=true; SameSite=strict; Max-Age=0';
}

export function getAuthCookieFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get('auth_token')?.value;
}

// For client-side components that need to check auth status
// This creates a server-side readable but client-side safe approach
export function setAuthStatusCookie(isAuthenticated: boolean): string {
  return `auth_status=${isAuthenticated ? 'true' : 'false'}; Path=/; SameSite=strict; Max-Age=${60 * 5}`; // 5 minutes
}

export function getAuthStatusCookie(request: NextRequest): boolean {
  return request.cookies.get('auth_status')?.value === 'true';
}
