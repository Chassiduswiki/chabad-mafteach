import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readUsers } from '@directus/sdk';
import { validateToken, validateEmail, createValidationError } from '@/lib/input-validation';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        createValidationError('Token and email are required'),
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

    return NextResponse.json({
      success: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      createValidationError('Token validation failed'),
      { status: 500 }
    );
  }
}
