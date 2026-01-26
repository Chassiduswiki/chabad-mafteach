import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { updateItem, readSingleton } from '@directus/sdk';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    // Check auth from multiple sources
    const auth = verifyAuth(request);
    const isDev = process.env.NODE_ENV === 'development';
    
    // Also check for role set by middleware (x-user-role header)
    const middlewareRole = request.headers.get('x-user-role');
    
    // Determine role: from JWT auth, middleware header, or dev fallback
    const role = auth?.role || middlewareRole || (isDev ? 'admin' : null);
    
    console.log('[site-settings/update] Auth check:', { 
      hasAuth: !!auth, 
      middlewareRole, 
      finalRole: role, 
      isDev 
    });
    
    if (!role) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    
    // Strip read-only fields that shouldn't be sent to Directus
    const { id, ...updateData } = body;
    
    // Validate we have something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }
    
    const directus = createClient();
    
    // First get the singleton to find its ID
    const current = await directus.request(readSingleton('site_settings'));
    const singletonId = (current as any)?.id;
    
    if (!singletonId) {
      return NextResponse.json({ error: 'Site settings not found' }, { status: 404 });
    }
    
    // Update using updateItem with the singleton's ID
    console.log('[site-settings/update] Updating ID:', singletonId, 'with:', Object.keys(updateData));
    const updated = await directus.request(updateItem('site_settings', singletonId, updateData));
    
    console.log('[site-settings/update] Success');
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[site-settings/update] Error:', error);
    
    // Extract meaningful error message
    let message = 'Failed to update site settings';
    if (error.errors && Array.isArray(error.errors) && error.errors[0]?.message) {
      message = error.errors[0].message;
    } else if (error.message) {
      message = error.message;
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
