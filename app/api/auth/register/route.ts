import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readUsers, createUsers } from '@directus/sdk';
import { registerRateLimit } from '@/lib/rate-limit';
import { sendEmail, createVerificationEmail } from '@/lib/email-service';
import { validateRegistrationData, createValidationError } from '@/lib/input-validation';
import crypto from 'crypto';

// Generate verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    // Apply rate limiting
    const rateLimitResult = registerRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createValidationError(rateLimitResult.error!),
        { status: 429 }
      );
    }

    // Comprehensive input validation
    const validation = validateRegistrationData({
      firstName,
      lastName,
      email,
      password
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join('. ') },
        { status: 400 }
      );
    }

    const { firstName: sanitizedFirstName, lastName: sanitizedLastName, email: sanitizedEmail } = validation.sanitized!;

    const directus = createClient();

    // Check if user already exists
    try {
      const existingUsers = await directus.request(
        readUsers({
          filter: { email: { _eq: sanitizedEmail } },
          limit: 1
        })
      );
      
      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json(
          createValidationError('User with this email already exists'),
          { status: 409 }
        );
      }
    } catch (error) {
      // User doesn't exist, continue with registration
    }

    // Create new user
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = await directus.request(
      createUsers([{
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        email: sanitizedEmail,
        password: password,
        status: 'unverified', // Directus user status
        token: verificationToken, // Store verification token
        // Note: Directus doesn't have token expiration field by default
        // We'll handle expiration logic in verification endpoint
      }])
    );

    const userId = Array.isArray(newUser) ? newUser[0]?.id : null;

    // Send verification email
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify?token=${verificationToken}&email=${sanitizedEmail}`;
    const emailContent = createVerificationEmail(sanitizedEmail, verificationLink);
    
    const emailResult = await sendEmail(emailContent);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Continue anyway - user can request resend
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      userId: userId
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific Directus errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
      if (error.message.includes('password')) {
        return NextResponse.json(
          { error: 'Invalid password format' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
