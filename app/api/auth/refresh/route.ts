import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, createAuthToken } from '@/lib/auth';

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

    // Fetch user from Directus to validate they still exist and get current role
    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL;
    const staticToken = process.env.DIRECTUS_STATIC_TOKEN;

    if (!directusUrl || !staticToken) {
      console.error('Directus configuration missing');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const userResponse = await fetch(
      `${directusUrl}/users/${refreshTokenData.userId}?fields=id,email,first_name,last_name,role.name,status`,
      {
        headers: { 'Authorization': `Bearer ${staticToken}` }
      }
    );

    if (!userResponse.ok) {
      console.error('Failed to fetch user from Directus:', userResponse.status);
      return NextResponse.json(
        { error: 'User not found or session expired' },
        { status: 401 }
      );
    }

    const userData = await userResponse.json();
    const directusUser = userData.data;

    // Check if user is active
    if (directusUser.status !== 'active') {
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 401 }
      );
    }

    // Map Directus roles to app roles
    const role = directusUser.role?.name?.toLowerCase().includes('admin') ? 'admin' : 'editor';
    const name = `${directusUser.first_name || ''} ${directusUser.last_name || ''}`.trim() || directusUser.email;

    // Generate new access token
    const newAccessToken = createAuthToken(directusUser.id, role);

    // Return new access token (refresh token remains the same)
    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: directusUser.id,
        email: directusUser.email,
        name,
        role
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
