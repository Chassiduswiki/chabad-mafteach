import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Authentication utilities for API routes
 * Provides JWT token verification and user session management
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token from Authorization header
 */
export function verifyAuth(request: NextRequest): { userId?: string; role?: string } | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

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
  return jwt.sign(
    { userId, role, iat: Date.now() / 1000 },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Middleware function to protect API routes
 * Requires authentication for sensitive operations
 */
export function requireAuth(
  handler: (request: NextRequest, context: { userId: string; role: string }) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
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

    // At this point, auth is validated and has the required properties
    return handler(request, auth as { userId: string; role: string });
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
 * Check if current environment allows unauthenticated access
 * Useful for development or specific deployment configurations
 */
export function isPublicAccessAllowed(): boolean {
  return process.env.ALLOW_PUBLIC_ACCESS === 'true';
}
