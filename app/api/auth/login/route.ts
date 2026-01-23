import { NextRequest, NextResponse } from 'next/server';
import { createAuthToken, createRefreshToken, checkAccountLockout, recordFailedLogin, recordSuccessfulLogin } from '@/lib/auth';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

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

    // Authenticate with Directus
    try {
      // Directus doesn't allow standard SDK login easily with just email/password via REST for our purposes
      // (it returns a session cookie or complex JWT).
      // Instead, we'll verify the user exists in Directus and use our own JWT for the app session.
      // This bridges Directus users with our Next.js auth system.
      
      const users = await directus.request(readItems('directus_users' as any, {
        filter: { email: { _eq: email } },
        fields: ['id', 'email', 'first_name', 'last_name', 'role.name'],
        limit: 1
      }));

      const user = users && users.length > 0 ? users[0] : null;

      // In a real production app, we would use Directus's login endpoint to verify the password.
      // For now, to solve the user's login issue, we'll match the email and check a placeholder password
      // or implement the Directus login flow if the Directus SDK supports it easily here.
      
      // Let's implement actual Directus login to be secure
      const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL;
      const loginResponse = await fetch(`${directusUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!loginResponse.ok) {
        recordFailedLogin(email);
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const loginData = await loginResponse.json();
      const directusAccessToken = loginData.data.access_token;

      // Now we have a valid Directus user. Let's get their details to create our app token.
      const userDetailsResponse = await fetch(`${directusUrl}/users/me?fields=id,email,first_name,last_name,role.name`, {
        headers: { 'Authorization': `Bearer ${directusAccessToken}` }
      });
      const userDetails = await userDetailsResponse.json();
      const directusUser = userDetails.data;

      // Map Directus roles to app roles
      const role = directusUser.role?.name?.toLowerCase().includes('admin') ? 'admin' : 'editor';

      // Record successful login (resets lockout counter)
      recordSuccessfulLogin(email);

      // Create our App JWT tokens
      const accessToken = createAuthToken(directusUser.id, role);
      const refreshToken = createRefreshToken(directusUser.id);

      // Return tokens and user info
      return NextResponse.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: directusUser.id,
          email: directusUser.email,
          name: `${directusUser.first_name || ''} ${directusUser.last_name || ''}`.trim() || directusUser.email,
          role: role
        }
      });
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
