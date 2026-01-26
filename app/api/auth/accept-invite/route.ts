import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { acceptUserInvite } from '@directus/sdk';

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
        }

        const directus = createClient();

        // Directus SDK: acceptUserInvite(token, password)
        await directus.request(acceptUserInvite(token, password));

        return NextResponse.json({ success: true, message: 'Invite accepted' });

    } catch (error: any) {
        console.error('Accept invite error:', error);
        // Common Directus errors
        if (error?.errors?.[0]?.message === 'Invalid token.') {
            return NextResponse.json({ error: 'This invitation link is invalid or has expired.' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to accept invitation' }, { status: 500 });
    }
}
