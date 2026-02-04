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
    console.log('[Middleware] No token found, redirecting to signin');
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  try {
    const decoded = jwt.verify(finalToken, JWT_SECRET) as jwt.JwtPayload & { userId: string; role: string };
    const payload = decoded;

    const adminRoutePermissions: Array<{ match: (path: string) => boolean; permission: PermissionKey }> = [
      { match: (path) => path.startsWith('/admin/users'), permission: 'canManageUsers' },
      { match: (path) => path.startsWith('/admin/source-books') || path.startsWith('/admin/books'), permission: 'canManageSourceBooks' },
      { match: (path) => path.startsWith('/admin/topics') || path.startsWith('/admin/content') || path.startsWith('/admin/review-queue'), permission: 'canEditTopics' },
      { match: (path) => path.startsWith('/admin/performance') || path.startsWith('/admin/audit-log'), permission: 'canViewPerformanceMetrics' },
      { match: (path) => path.startsWith('/analytics'), permission: 'canAccessAnalytics' }
    ];

    const requiredPermission = adminRoutePermissions.find(entry => entry.match(pathname))?.permission;

    if (requiredPermission && !hasPermission(payload.role, requiredPermission)) {
      return NextResponse.redirect(new URL('/editor', request.url));
    }

    // Fallback: non-mapped admin routes still require admin role
    if (isAdminRoute && !requiredPermission && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/editor', request.url));
    }

    if (isEditorRoute && !hasPermission(payload.role, 'canEditTopics')) {
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
    // Invalid token - redirect to signin
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Only run middleware on protected routes that need authentication
     * Exclude: api routes, static files, images, favicon, and public routes
     */
    '/admin/:path*',
    '/editor/:path*',
    '/chain-builder/:path*',
    '/collections/new',
    '/profile',
    '/analytics/:path*'
  ],
};
