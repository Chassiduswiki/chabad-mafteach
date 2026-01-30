import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readUsers, updateUsers } from '@directus/sdk';
import { validateToken, validateEmail, validatePassword, createValidationError } from '@/lib/input-validation';

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        createValidationError('Token, email, and password are required'),
        { status: 400 }
      );
    }

    // Validate inputs
    const tokenValidation = validateToken(token);
    if (!tokenValidation.isValid) {
      return NextResponse.json(
        createValidationError('Invalid token format'),
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        createValidationError('Invalid email format'),
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        createValidationError(passwordValidation.error!),
        { status: 400 }
      );
    }

    const directus = createClient();

    // Find user with matching token and email
    const users = await directus.request(
      readUsers({
        filter: {
          _and: [
            { email: { _eq: emailValidation.sanitized } },
            { token: { _eq: tokenValidation.sanitized } },
            { status: { _eq: 'active' } }
          ]
        },
        limit: 1
      })
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        createValidationError('Invalid or expired reset link'),
        { status: 400 }
      );
    }

    const user = users[0];

    // Update user password and clear token
    await directus.request(
      updateUsers([user.id], {
        password: password,
        token: null // Clear the reset token
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      createValidationError('Password reset failed'),
      { status: 500 }
    );
  }
}
