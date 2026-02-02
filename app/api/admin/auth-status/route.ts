import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readUsers, readRoles } from '@directus/sdk';
import { requirePermission } from '@/lib/security/permissions';
import { withAudit } from '@/lib/security/audit';
import { adminReadRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';

export const GET = requirePermission('canManageUsers', withAudit('read', 'admin.auth-status', async (request: NextRequest) => {
  const rateLimited = enforceRateLimit(request, adminReadRateLimit);
  if (rateLimited) return rateLimited;

  try {
    const directus = createClient();

    // 2. Fetch Directus Roles
    const roles = await directus.request(readRoles({
      fields: ['id', 'name', 'description'],
    })).catch(err => {
      console.error('Error fetching roles:', err);
      return [];
    });

    // 3. Fetch Directus Users
    const users = await directus.request(readUsers({
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
      },
      aiService: {
        name: 'AI Intelligence Key',
        description: 'OpenRouter API key used for all AI-powered features (generation, translation, analysis).',
        usage: 'AIAssistant, statement breaking, and content enhancement.',
        status: process.env.OPENROUTER_API_KEY ? 'Configured' : 'Missing'
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
}));
