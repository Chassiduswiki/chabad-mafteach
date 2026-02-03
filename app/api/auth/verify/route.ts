import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readUsers, updateUsers } from '@directus/sdk';
import { verifyRateLimit } from '@/lib/rate-limit';
import { createErrorResponse, ERROR_CODES } from '@/lib/error-handling';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = verifyRateLimit(request);
    if (!rateLimitResult.success) {
      return createErrorResponse(
        rateLimitResult.error!,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429
      );
    }

    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      );
    }

    const directus = createClient();

    // Find user with matching token and email
    const users = await directus.request(
      readUsers({
        filter: {
          _and: [
            { email: { _eq: email } },
            { token: { _eq: token } },
            { status: { _eq: 'unverified' } }
          ]
        },
        limit: 1
      })
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400 }
      );
    }

    const user = users[0];

    // Update user status to active and clear token
    await directus.request(
      updateUsers(user.id, {
        status: 'active',
        token: null // Clear verification token
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
