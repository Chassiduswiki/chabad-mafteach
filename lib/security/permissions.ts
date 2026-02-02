import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export interface UserPermissions {
  canEditTopics: boolean;
  canManageUsers: boolean;
  canAccessAnalytics: boolean;
  canManageSourceBooks: boolean;
  canViewPerformanceMetrics: boolean;
}

export type PermissionKey = keyof UserPermissions;

const DEFAULT_PERMISSIONS: UserPermissions = {
  canEditTopics: false,
  canManageUsers: false,
  canAccessAnalytics: false,
  canManageSourceBooks: false,
  canViewPerformanceMetrics: false
};

const ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    canEditTopics: true,
    canManageUsers: true,
    canAccessAnalytics: true,
    canManageSourceBooks: true,
    canViewPerformanceMetrics: true
  },
  editor: {
    canEditTopics: true,
    canManageUsers: false,
    canAccessAnalytics: false,
    canManageSourceBooks: true,
    canViewPerformanceMetrics: false
  },
  reviewer: {
    canEditTopics: false,
    canManageUsers: false,
    canAccessAnalytics: false,
    canManageSourceBooks: false,
    canViewPerformanceMetrics: false
  },
  user: { ...DEFAULT_PERMISSIONS }
};

export function getPermissionsForRole(role?: string | null): UserPermissions {
  if (!role) return { ...DEFAULT_PERMISSIONS };
  const normalized = role.toLowerCase();
  return ROLE_PERMISSIONS[normalized] ? { ...ROLE_PERMISSIONS[normalized] } : { ...DEFAULT_PERMISSIONS };
}

export function hasPermission(role: string | undefined | null, permission: PermissionKey): boolean {
  const permissions = getPermissionsForRole(role);
  return Boolean(permissions[permission]);
}

export function requirePermission(
  permission: PermissionKey,
  handler: (request: NextRequest, context: { userId: string; role: string }, ...args: any[]) => Promise<NextResponse>
) {
  return requireAuth(async (request: NextRequest, context: { userId: string; role: string }, ...args: any[]) => {
    if (!hasPermission(context.role, permission)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return handler(request, context, ...args);
  });
}

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  canEditTopics: 'Edit Topics',
  canManageUsers: 'Manage Users',
  canAccessAnalytics: 'Access Analytics',
  canManageSourceBooks: 'Manage Source Books',
  canViewPerformanceMetrics: 'View Performance Metrics'
};
