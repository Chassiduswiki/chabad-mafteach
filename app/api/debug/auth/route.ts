import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    
    // Get cookie info
    const cookieToken = request.cookies.get('auth_token')?.value;
    const authHeader = request.headers.get('authorization');
    
    return NextResponse.json({
      auth: auth,
      hasCookieToken: !!cookieToken,
      hasAuthHeader: !!authHeader,
      cookieTokenPreview: cookieToken ? cookieToken.substring(0, 50) + '...' : null,
      authHeaderPreview: authHeader ? authHeader.substring(0, 50) + '...' : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
