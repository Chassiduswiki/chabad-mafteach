import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, createAuthToken } from '@/lib/auth';
import { createClient } from '@/lib/directus';

const directus = createClient();

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify the refresh token
    const refreshTokenData = verifyRefreshToken(refreshToken);
    if (!refreshTokenData || !refreshTokenData.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // For now, validate user exists in our simple user store
    // In production, this would query the user database
    const validUsers: Record<string, { id: string; role: string; name: string; email: string }> = {
      '1': { id: '1', role: 'editor', name: 'Editor User', email: 'editor@chabad.org' },
      '2': { id: '2', role: 'admin', name: 'Admin User', email: 'admin@chabad.org' }
    };

    const user = validUsers[refreshTokenData.userId];
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = createAuthToken(user.id, user.role);

    // Return new access token (refresh token remains the same)
    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
