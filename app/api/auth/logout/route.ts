import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Clear the auth token cookie
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );

  // Clear the auth_token cookie
  response.cookies.set('auth_token', '', {
    path: '/',
    maxAge: 0,
    httpOnly: false,
    sameSite: 'strict',
  });

  return response;
}
