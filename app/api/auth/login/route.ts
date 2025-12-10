import { NextRequest, NextResponse } from 'next/server';
import { createAuthToken } from '@/lib/auth';
import { compare } from 'bcryptjs';

// Demo users (in production, these would come from a database)
const users = [
  {
    id: '1',
    email: 'editor@chabad.org',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fYzYXxGK', // 'editor123'
    role: 'editor',
    name: 'Editor User'
  },
  {
    id: '2',
    email: 'admin@chabad.org',
    password: '$2b$12$cpClpCWgDD4BsphRdRxAN.894tRJXGjaHzi09gj2MSw.Z/Z7eqvNK', // 'admin123'
    role: 'admin',
    name: 'Admin User'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = users.find(u => u.email === email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = createAuthToken(user.id, user.role);

    // Return token and user info
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
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
