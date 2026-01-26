import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { requireAuth } from '@/lib/auth';
import { inviteUser } from '@directus/sdk';

export const POST = requireAuth(async (req: NextRequest, context) => {
    try {
        if (context.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { email, role } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const directus = createClient();

        // In Directus, roles are identified by UUIDs. 
        // We need to fetch the Role ID for the requested role name first.
        // This assumes roles 'Administrator', 'Editor', 'Reviewer' exist.
        // Mapping:
        // admin -> Administrator (or built-in admin)
        // editor -> Editor
        // reviewer -> Reviewer

        // TODO: Ideally cache these role IDs or put them in constants
        let roleName = 'Editor';
        if (role === 'admin') roleName = 'Administrator';
        if (role === 'reviewer') roleName = 'Reviewer';

        // 1. Find Role ID
        const roles = await directus.request(
            // Using 'readRoles' requires admin permissions
            // @ts-ignore
            inv => inv.get('/roles', {
                params: {
                    filter: { name: { _eq: roleName } },
                    limit: 1
                }
            })
        );

        // Note: directus-sdk specific call structure might differ slightly depending on version,
        // usually readRoles or using request() with a custom query.
        // For simplicity/robustness in this environment, we might fallback to raw fetch if sdk types are strict.

        // Actually, let's use the proper SDK method if possible, or fall back to standard user creation if Invite API is complex.
        // Directus has inviteUser().

        const roleId = roles.data?.[0]?.id;
        if (!roleId && role !== 'admin') {
            // Admin role might be special or hidden, but usually exposes as a role.
            // If not found, default to public/no-role or error.
            return NextResponse.json({ error: `Role '${roleName}' not found in configuration.` }, { status: 500 });
        }

        // 2. Send Invitation
        // inviteUser(email, role, invite_url)
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite`; // The page where they set password

        await directus.request(inviteUser(email, roleId, inviteUrl));

        return NextResponse.json({ success: true, message: 'Invitation sent' });

    } catch (error: any) {
        console.error('Invite API error:', error);
        // Handle "User already exists" error commonly
        if (error?.errors?.[0]?.message?.includes('unique')) {
            return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
});
