import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { requireAuth } from '@/lib/auth';
import { readItems } from '@directus/sdk';

export const GET = requireAuth(async (req: NextRequest, context) => {
    try {
        if (context.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const directus = createClient();

        // Fetch users from directus_users system collection
        const users = await directus.request(
            // @ts-ignore - readItems usually works on system collections if configured or using explicit generic
            readItems('directus_users', {
                fields: ['id', 'first_name', 'last_name', 'email', 'status', 'last_access', 'role.name'],
                sort: ['-last_access'],
                limit: 50
            })
        );

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});
