import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify admin access
    const auth = verifyAuth(request);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const directus = createClient();

    // 2. Fetch Directus Roles
    // We use 'as any' because core collections are restricted in some SDK versions but we have admin token
    const roles = await directus.request(readItems('directus_roles' as any, {
      fields: ['id', 'name', 'description'],
    })).catch(err => {
      console.error('Error fetching roles:', err);
      return [];
    });

    // 3. Fetch Directus Users
    const users = await directus.request(readItems('directus_users' as any, {
      fields: ['id', 'email', 'first_name', 'last_name', 'role.name', 'token'],
    })).catch(err => {
      console.error('Error fetching users:', err);
      return [];
    });

    // 4. Calculate Token Breakdown
    const tokenBreakdown = {
      appJwt: {
        name: 'App JWT Token',
        description: 'Used for stateless frontend-to-backend communication. Generated upon login via /auth/signin.',
        usage: 'All editor and admin operations in the Next.js app.',
        expiration: '24 Hours',
        mechanism: 'Signed with JWT_SECRET',
        activeUsers: users.length // Users who CAN generate this token
      },
      directusStatic: {
        name: 'Directus Static Token',
        description: 'Persistent tokens assigned to specific users in Directus. Used for backend-to-Directus or third-party integrations.',
        usage: 'Server-side data fetching, system integrations, and now accepted by verifyAuth for admin bypass.',
        usersWithToken: (users as any[]).filter(u => u.token).map(u => ({
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          role: u.role?.name || 'No Role'
        }))
      },
      systemSecret: {
        name: 'System Master Secret (Env)',
        description: 'The DIRECTUS_STATIC_TOKEN defined in environment variables.',
        usage: 'Primary key for all server-side administrative Directus operations.',
        status: process.env.DIRECTUS_STATIC_TOKEN ? 'Configured' : 'Missing'
      }
    };

    return NextResponse.json({
      success: true,
      roles,
      users: (users as any[]).map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        role: u.role?.name,
        hasStaticToken: !!u.token
      })),
      tokenBreakdown
    });

  } catch (error: any) {
    console.error('Auth status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authentication status' },
      { status: 500 }
    );
  }
}
