import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readUsers, updateUsers } from '@directus/sdk';
import { verifyRateLimit } from '@/lib/rate-limit';
import { sendEmail, createResendVerificationEmail } from '@/lib/email-service';
import crypto from 'crypto';

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = verifyRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const directus = createClient();

    // Find unverified user
    const users = await directus.request(
      readUsers({
        filter: {
          _and: [
            { email: { _eq: email } },
            { status: { _eq: 'unverified' } }
          ]
        },
        limit: 1
      })
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found or already verified' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Generate new verification token
    const newToken = generateVerificationToken();

    // Update user with new token
    await directus.request(
      updateUsers(user.id, {
        token: newToken
      })
    );

    // Send new verification email
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify?token=${newToken}&email=${email}`;
    const emailContent = createResendVerificationEmail(email, verificationLink);
    
    const emailResult = await sendEmail(emailContent);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
