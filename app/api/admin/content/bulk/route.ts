import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { updateItem } from '@directus/sdk';
import { verifyAuth } from '@/lib/auth';

/**
 * PATCH /api/admin/content/bulk
 * 
 * Generic bulk update for any collection (topics, statements, etc.)
 * Restricted to admins and editors.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth || !['admin', 'editor'].includes(auth.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { type, ids, updates } = await request.json();

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0 || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const directus = createClient();
    const results = [];
    const errors = [];

    // Process updates
    for (const id of ids) {
      try {
        const updated = await directus.request(updateItem(type as any, id, updates));
        results.push({ id, status: 'success' });
      } catch (error: any) {
        console.error(`Bulk update error for ${type} ${id}:`, error);
        errors.push({ id, status: 'error', message: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error: any) {
    console.error('Bulk update route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
