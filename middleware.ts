import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes - no auth required
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/verify',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/about',
    '/topics',
    '/seforim',
    '/explore',
    '/collections',
    '/lookup-demo',
    '/tiptap-demo',
    '/tooltip-demo',
    '/smart-edit'
  ];

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route === pathname) return true;
    if (route.endsWith('/') && pathname.startsWith(route)) return true;
    return false;
  });

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes by access level
  const isEditorRoute = pathname.startsWith('/editor') ||
                        pathname.startsWith('/chain-builder') ||
                        pathname === '/collections/new';
  const isAdminRoute = pathname.startsWith('/admin') ||
                       pathname.startsWith('/analytics');
  const isAuthenticatedRoute = pathname === '/profile';

  if (!isEditorRoute && !isAdminRoute && !isAuthenticatedRoute) {
    return NextResponse.next();
  }

  // Get token from Authorization header or localStorage (via cookie)
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  // Also check for auth_token cookie (set by client)
  const cookieToken = request.cookies.get('auth_token')?.value;
  const finalToken = token || cookieToken;

  if (!finalToken) {
    // Redirect to signin if no token
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  try {
    // Verify JWT token
    const verified = await jwtVerify(finalToken, JWT_SECRET);
    const payload = verified.payload as { userId: string; role: string };

    // Check role-based access
    if (isAdminRoute && payload.role !== 'admin') {
      // Redirect non-admins away from admin pages
      return NextResponse.redirect(new URL('/editor', request.url));
    }

    if (isEditorRoute && !['admin', 'editor'].includes(payload.role)) {
      // Redirect non-editors/non-admins away from editor pages
      return NextResponse.redirect(new URL('/topics', request.url));
    }

    // Authenticated routes just need a valid token (already verified above)

    // Add user info to request headers for use in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    // Invalid token - redirect to signin
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
