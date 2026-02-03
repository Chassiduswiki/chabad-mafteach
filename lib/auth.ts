import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { SECURITY } from '@/lib/constants';

/**
 * Authentication utilities for API routes
 * Provides JWT token verification and user session management
 */

// JWT Secret for token signing and verification
// Use a fallback during build time to avoid "JWT_SECRET required" errors
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: JWT_SECRET is not set in production environment!');
}

/**
 * Verify JWT token from Authorization header
 */
// Verify JWT token from Authorization header or Cookie
export function verifyAuth(request: NextRequest): { userId?: string; role?: string } | null {
  try {
    // 1. Trust middleware headers if present (middleware runs before this)
    const mwUserId = request.headers.get('x-user-id');
    const mwRole = request.headers.get('x-user-role');

    if (mwUserId && mwRole) {
      return { userId: mwUserId, role: mwRole };
    }

    // 2. Check Authorization Header
    const authHeader = request.headers.get('authorization');
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // 3. Fallback to Cookie
      const cookie = request.cookies.get('auth_token');
      if (cookie) {
        token = cookie.value;
      }
    }

    if (!token) {
      return null;
    }

    // Check if it's the Directus Static Token (used as a master key)
    const staticToken = process.env.DIRECTUS_STATIC_TOKEN;
    if (staticToken && token === staticToken) {
      return {
        userId: 'admin-static',
        role: 'admin'
      };
    }

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { userId: string; role: string };

    if (!decoded.userId || !decoded.role) {
      return null;
    }

    return {
      userId: decoded.userId,
      role: decoded.role
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

/**
 * Create JWT token for user
 */
export function createAuthToken(userId: string, role: string = 'user'): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { userId, role, iat: Date.now() / 1000 },
    JWT_SECRET,
    { expiresIn: SECURITY.JWT.ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Middleware function to protect API routes
 * Requires authentication for sensitive operations
 */
export function requireAuth(
  handler: (request: NextRequest, context: { userId: string; role: string }, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const auth = verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has required permissions for write operations
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (!auth.role || !['editor', 'admin'].includes(auth.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    return handler(request, auth as { userId: string; role: string }, ...args);
  };
}

/**
 * Middleware for content creation operations (ingest, statements)
 * Requires editor or admin role
 */
export function requireEditor(
  handler: (request: NextRequest, context: { userId: string; role: string }, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const auth = verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!auth.role || !['editor', 'admin'].includes(auth.role)) {
      return NextResponse.json(
        { error: 'Editor permissions required' },
        { status: 403 }
      );
    }

    return handler(request, auth as { userId: string; role: string }, ...args);
  };
}

/**
 * Middleware for admin-only operations
 */
export function requireAdmin(
  handler: (request: NextRequest, context: { userId: string; role: string }, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const auth = verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!auth.role || auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin permissions required' },
        { status: 403 }
      );
    }

    return handler(request, auth as { userId: string; role: string }, ...args);
  };
}

/**
 * Check if current environment allows unauthenticated access
 * Useful for development or specific deployment configurations
 */
export function isPublicAccessAllowed(): boolean {
  return process.env.ALLOW_PUBLIC_ACCESS === 'true';
}

/**
 * Validate password complexity requirements
 * @param password - The password to validate
 * @returns Object with validation result and error message if invalid
 */
export function validatePasswordComplexity(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  return { isValid: true };
}

/**
 * Account lockout tracking for failed login attempts
 */
const accountLockoutStore = new Map<string, { attempts: number; lockoutUntil: number; lastAttempt: number }>();

export function checkAccountLockout(email: string): { isLocked: boolean; lockoutRemaining?: number; attemptsRemaining?: number } {
  // Skip lockout in development
  if (process.env.NODE_ENV === 'development') {
    return { isLocked: false };
  }

  const now = Date.now();
  const maxAttempts = SECURITY.ACCOUNT_LOCKOUT.MAX_ATTEMPTS;
  const lockoutDuration = SECURITY.ACCOUNT_LOCKOUT.DURATION_MS;

  const record = accountLockoutStore.get(email);

  if (!record) {
    return { isLocked: false, attemptsRemaining: maxAttempts };
  }

  // Check if lockout period has expired
  if (record.lockoutUntil && now > record.lockoutUntil) {
    accountLockoutStore.delete(email);
    return { isLocked: false, attemptsRemaining: maxAttempts };
  }

  if (record.lockoutUntil && record.lockoutUntil > now) {
    const remaining = Math.ceil((record.lockoutUntil - now) / 1000);
    return { isLocked: true, lockoutRemaining: remaining };
  }

  const attemptsRemaining = maxAttempts - record.attempts;
  return { isLocked: false, attemptsRemaining: Math.max(0, attemptsRemaining) };
}

export function recordFailedLogin(email: string): void {
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  const now = Date.now();
  const maxAttempts = SECURITY.ACCOUNT_LOCKOUT.MAX_ATTEMPTS;
  const lockoutDuration = SECURITY.ACCOUNT_LOCKOUT.DURATION_MS;

  const record = accountLockoutStore.get(email) || { attempts: 0, lockoutUntil: 0, lastAttempt: 0 };

  record.attempts++;
  record.lastAttempt = now;

  if (record.attempts >= maxAttempts) {
    record.lockoutUntil = now + lockoutDuration;
  }

  accountLockoutStore.set(email, record);
}

export function recordSuccessfulLogin(email: string): void {
  // Reset lockout on successful login
  accountLockoutStore.delete(email);
}

/**
 * Generate refresh token for long-term authentication
 * Refresh tokens have longer expiration (7 days) and are used to get new access tokens
 */
export function createRefreshToken(userId: string): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: SECURITY.JWT.REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { userId?: string } | null {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { userId: string; type: string };

    if (decoded.type !== 'refresh' || !decoded.userId) {
      return null;
    }

    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}
