import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { hasPermission, type PermissionKey } from '@/lib/security/permissions';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

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

  console.log('Middleware - Route check:', { pathname, isEditorRoute, isAdminRoute, isAuthenticatedRoute });

  if (!isEditorRoute && !isAdminRoute && !isAuthenticatedRoute) {
    console.log('Middleware - Public route, allowing access');
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
    const decoded = jwt.verify(finalToken, JWT_SECRET) as jwt.JwtPayload & { userId: string; role: string };
    const payload = decoded;

    console.log('Middleware - Token verified successfully:', { userId: payload.userId, role: payload.role, pathname });

    const adminRoutePermissions: Array<{ match: (path: string) => boolean; permission: PermissionKey }> = [
      { match: (path) => path.startsWith('/admin/users'), permission: 'canManageUsers' },
      { match: (path) => path.startsWith('/admin/source-books') || path.startsWith('/admin/books'), permission: 'canManageSourceBooks' },
      { match: (path) => path.startsWith('/admin/topics') || path.startsWith('/admin/content') || path.startsWith('/admin/review-queue'), permission: 'canEditTopics' },
      { match: (path) => path.startsWith('/admin/performance') || path.startsWith('/admin/audit-log'), permission: 'canViewPerformanceMetrics' },
      { match: (path) => path.startsWith('/analytics'), permission: 'canAccessAnalytics' }
    ];

    const requiredPermission = adminRoutePermissions.find(entry => entry.match(pathname))?.permission;

    if (requiredPermission && !hasPermission(payload.role, requiredPermission)) {
      console.log('Middleware - Permission access denied:', { pathname, userRole: payload.role, requiredPermission });
      return NextResponse.redirect(new URL('/editor', request.url));
    }

    // Fallback: non-mapped admin routes still require admin role
    if (isAdminRoute && !requiredPermission && payload.role !== 'admin') {
      console.log('Middleware - Admin access denied:', { pathname, userRole: payload.role, requiredRole: 'admin' });
      return NextResponse.redirect(new URL('/editor', request.url));
    }

    if (isEditorRoute && !hasPermission(payload.role, 'canEditTopics')) {
      console.log('Middleware - Editor access denied:', { pathname, userRole: payload.role, requiredPermission: 'canEditTopics' });
      return NextResponse.redirect(new URL('/topics', request.url));
    }

    console.log('Middleware - Access granted for:', { pathname, userRole: payload.role });

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
    console.error('Middleware - Token verification failed:', error);
    console.log('Middleware - Redirecting to signin');
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
