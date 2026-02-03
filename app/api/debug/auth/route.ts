import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/security/permissions';
import { withAudit } from '@/lib/security/audit';
import { adminReadRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';
import { debugDisabledResponse, isDebugEnabled } from '@/lib/monitoring/debug';

export const GET = requirePermission('canAccessDebug', withAudit('read', 'debug.auth', async (request: NextRequest) => {
  const rateLimited = enforceRateLimit(request, adminReadRateLimit);
  if (rateLimited) return rateLimited;
  if (!isDebugEnabled()) return debugDisabledResponse();
  try {
    const auth = verifyAuth(request);
    
    // Get cookie info
    const cookieToken = request.cookies.get('auth_token')?.value;
    const authHeader = request.headers.get('authorization');
    
    return NextResponse.json({
      auth: auth,
      hasCookieToken: !!cookieToken,
      hasAuthHeader: !!authHeader,
      cookieTokenPreview: cookieToken ? cookieToken.substring(0, 8) + '…' : null,
      authHeaderPreview: authHeader ? authHeader.substring(0, 8) + '…' : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}));
