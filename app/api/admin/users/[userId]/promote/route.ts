import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { requireAuth } from '@/lib/auth';
import { readUsers, updateUsers, readRoles } from '@directus/sdk';

export const POST = requireAuth(async (req: NextRequest, context) => {
    try {
        if (context.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId } = context;
        const { role } = await req.json();

        if (!role || !['user', 'editor'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const directus = createClient();

        // Get the target user
        const users = await directus.request(
            readUsers({
                filter: { id: { _eq: userId } },
                limit: 1
            })
        );

        if (!users || users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const targetUser = users[0];

        // Prevent modifying admin users
        if (targetUser.role?.name === 'admin') {
            return NextResponse.json({ error: 'Cannot modify admin users' }, { status: 403 });
        }

        // Get the role ID for the target role
        const roles = await directus.request(
            readRoles({
                filter: { name: { _eq: role } },
                limit: 1
            })
        );

        if (!roles || roles.length === 0) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }

        const targetRoleId = roles[0].id;

        // Update user's role
        await directus.request(
            updateUsers([userId], {
                role: targetRoleId
            })
        );

        return NextResponse.json({
            success: true,
            message: `User ${role === 'editor' ? 'promoted to' : 'demoted to'} ${role}`
        });

    } catch (error: any) {
        console.error('Role promotion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});
