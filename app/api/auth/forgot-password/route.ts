import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readUsers, updateUsers } from '@directus/sdk';
import { validateEmail, createValidationError } from '@/lib/input-validation';
import { sendEmail, createPasswordResetEmail } from '@/lib/email-service';
import crypto from 'crypto';

// Generate password reset token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        createValidationError('Email is required'),
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        createValidationError(emailValidation.error!),
        { status: 400 }
      );
    }

    const directus = createClient();

    // Find user with matching email
    const users = await directus.request(
      readUsers({
        filter: { email: { _eq: emailValidation.sanitized } },
        limit: 1
      })
    );

    // Always return success to prevent email enumeration attacks
    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.'
      });
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();

    // Update user with reset token
    await directus.request(
      updateUsers(user.id, {
        token: resetToken // Store reset token in the token field
      })
    );

    // Send password reset email
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}&email=${emailValidation.sanitized || ''}`;
    const emailContent = createPasswordResetEmail(emailValidation.sanitized || '', resetLink);
    
    const emailResult = await sendEmail(emailContent);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Continue anyway - don't reveal if user exists or not
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      createValidationError('Failed to process request'),
      { status: 500 }
    );
  }
}
