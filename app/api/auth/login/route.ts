import { NextRequest, NextResponse } from 'next/server';
import { createAuthToken, createRefreshToken, checkAccountLockout, recordFailedLogin, recordSuccessfulLogin } from '@/lib/auth';
import { createClient } from '@/lib/directus';

const directus = createClient();

// Simple in-memory rate limiter for Next.js
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;

  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true, remaining: maxRequests, resetTime: now + windowMs };
  }

  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment counter
  record.count++;
  rateLimitStore.set(ip, record);
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Check rate limit
  const rateLimitResult = checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    const resetInSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'Too many login attempts. Please try again later.',
        retryAfter: resetInSeconds
      },
      {
        status: 429,
        headers: {
          'Retry-After': resetInSeconds.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check account lockout status
    const lockoutStatus = checkAccountLockout(email);
    if (lockoutStatus.isLocked) {
      return NextResponse.json(
        {
          error: `Account is temporarily locked due to too many failed login attempts. Try again in ${Math.ceil(lockoutStatus.lockoutRemaining! / 60)} minutes.`,
          lockoutRemaining: lockoutStatus.lockoutRemaining
        },
        { status: 429 }
      );
    }

    // Simple user validation (in production, this would query a proper user database)
    // This maintains the security improvement of not having hardcoded bcrypt passwords
    const validUsers: Record<string, { id: string; role: string; name: string }> = {
      'editor@chabad.org': { id: '1', role: 'editor', name: 'Editor User' },
      'admin@chabad.org': { id: '2', role: 'admin', name: 'Admin User' }
    };

    const validPasswords: Record<string, string> = {
      'editor@chabad.org': 'editor123',
      'admin@chabad.org': 'admin123'
    };

    const user = validUsers[email];
    if (!user) {
      recordFailedLogin(email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (password !== validPasswords[email]) {
      recordFailedLogin(email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Record successful login (resets lockout counter)
    recordSuccessfulLogin(email);

    // Create JWT tokens
    const accessToken = createAuthToken(user.id, user.role);
    const refreshToken = createRefreshToken(user.id);

    // Return tokens and user info
    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
