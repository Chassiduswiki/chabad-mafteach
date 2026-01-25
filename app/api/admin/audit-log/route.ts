import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = verifyAuth(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const directus = createClient();
    
    // Fetch latest activity from Directus
    const activity = await directus.request(readItems('directus_activity' as any, {
      fields: ['id', 'action', 'collection', 'timestamp', 'user.first_name', 'user.last_name'],
      sort: ['-timestamp'],
      limit: 50
    }));

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Audit log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
