import { NextRequest, NextResponse } from 'next/server';
import { createAuthToken, createRefreshToken, checkAccountLockout, recordFailedLogin, recordSuccessfulLogin } from '@/lib/auth';
import { SECURITY } from '@/lib/constants';
import { setAuthCookie, setAuthStatusCookie } from '@/lib/cookie-utils';

// Simple in-memory rate limiter for Next.js
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = SECURITY.RATE_LIMIT.WINDOW_MS;
  const maxRequests = SECURITY.RATE_LIMIT.MAX_REQUESTS;

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
      const waitTime = Math.ceil(lockoutStatus.lockoutRemaining! / 60);
      return NextResponse.json(
        {
          error: `Account temporarily locked for security. Please try again in ${waitTime} minute${waitTime !== 1 ? 's' : ''}.`,
          lockoutRemaining: lockoutStatus.lockoutRemaining,
          isLocked: true
        },
        { status: 429 }
      );
    }

    // Authenticate with Directus
    try {
      // Step 1: Authenticate against Directus to verify credentials
      const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL;

      if (!directusUrl) {
        console.error('DIRECTUS_URL is not configured');
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }

      const loginResponse = await fetch(`${directusUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!loginResponse.ok) {
        recordFailedLogin(email);
        const errorData = await loginResponse.json().catch(() => ({}));
        console.error('Directus login failed:', errorData);
        
        // Provide more specific error messages
        if (loginResponse.status === 401) {
          return NextResponse.json(
            { error: 'Invalid email or password. Please check your credentials and try again.' },
            { status: 401 }
          );
        } else if (loginResponse.status === 429) {
          return NextResponse.json(
            { error: 'Too many login attempts. Please wait a few minutes before trying again.' },
            { status: 429 }
          );
        } else {
          return NextResponse.json(
            { error: 'Login service unavailable. Please try again later.' },
            { status: 503 }
          );
        }
      }

      const loginData = await loginResponse.json();
      const directusAccessToken = loginData.data?.access_token;

      if (!directusAccessToken) {
        console.error('No access token in Directus response');
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }

      // Step 2: Fetch user details using the authenticated token
      const userDetailsResponse = await fetch(`${directusUrl}/users/me?fields=id,email,first_name,last_name,role.name`, {
        headers: { 'Authorization': `Bearer ${directusAccessToken}` }
      });

      if (!userDetailsResponse.ok) {
        console.error('Failed to fetch user details');
        return NextResponse.json(
          { error: 'Failed to retrieve user information' },
          { status: 401 }
        );
      }

      const userDetails = await userDetailsResponse.json();
      const directusUser = userDetails.data;

      // Map Directus roles to app roles
      const role = directusUser.role?.name?.toLowerCase().includes('admin') ? 'admin' : 'editor';

      // Record successful login (resets lockout counter)
      recordSuccessfulLogin(email);

      // Create our App JWT tokens
      const accessToken = createAuthToken(directusUser.id, role);
      const refreshToken = createRefreshToken(directusUser.id);

      // Set secure HttpOnly cookie with access token
      const authCookie = setAuthCookie(accessToken);
      const statusCookie = setAuthStatusCookie(true);

      // Create response with cookies
      const response = NextResponse.json({
        success: true,
        user: {
          id: directusUser.id,
          email: directusUser.email,
          name: `${directusUser.first_name || ''} ${directusUser.last_name || ''}`.trim() || directusUser.email,
          role: role
        }
      });

      // Set cookies
      response.headers.set('Set-Cookie', authCookie);
      response.headers.append('Set-Cookie', statusCookie);

      return response;
    } catch (directusError) {
      console.error('Directus auth error:', directusError);
      recordFailedLogin(email);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
