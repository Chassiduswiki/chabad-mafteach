import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';
import { requireEditor } from '@/lib/auth';

const directus = createClient();

/**
 * API for Topic Page Locking & Session Management
 * 
 * Logic:
 * 1. GET: Check current lock status
 * 2. POST: Acquire/Renew lock
 * 3. DELETE: Release lock
 */

export const GET = requireEditor(async (request: NextRequest, context: { userId: string; role: string }, { params }: { params: Promise<{ slug: string }> }) => {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    
    // Fetch topic to check current metadata
    const topic = await directus.request(readItems('topics', {
      filter: { slug: { _eq: slug } },
      fields: ['id', 'locked_by', 'lock_expires'],
      limit: 1
    } as any));

    if (!topic || (topic as any[]).length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const t = (topic as any[])[0];
    const now = new Date();
    const expires = t.lock_expires ? new Date(t.lock_expires) : null;
    
    const isLocked = expires && expires > now && t.locked_by !== context.userId;

    return NextResponse.json({
      isLocked,
      lockedBy: t.locked_by,
      expiresAt: t.lock_expires,
      isOwner: t.locked_by === context.userId
    });
  } catch (error) {
    console.error('Lock status check failed:', error);
    return NextResponse.json({ error: 'Failed to check lock status' }, { status: 500 });
  }
});

export const POST = requireEditor(async (request: NextRequest, context: { userId: string; role: string }, { params }: { params: Promise<{ slug: string }> }) => {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const lockDuration = 5 * 60 * 1000; // 5 minutes
    const expiresAt = new Date(Date.now() + lockDuration).toISOString();

    // Find topic ID first
    const topic = await directus.request(readItems('topics', {
      filter: { slug: { _eq: slug } },
      fields: ['id', 'locked_by', 'lock_expires'],
      limit: 1
    } as any));

    if (!topic || (topic as any[]).length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const t = (topic as any[])[0];
    const now = new Date();
    const currentExpires = t.lock_expires ? new Date(t.lock_expires) : null;

    // Check if someone else has a valid lock
    if (currentExpires && currentExpires > now && t.locked_by && t.locked_by !== context.userId) {
      return NextResponse.json({ 
        error: 'Topic is currently being edited by another user',
        lockedBy: t.locked_by 
      }, { status: 409 });
    }

    // Acquire or renew lock
    await directus.request(updateItem('topics', t.id, {
      locked_by: context.userId,
      lock_expires: expiresAt
    } as any));

    return NextResponse.json({ 
      success: true, 
      expiresAt,
      message: 'Lock acquired/renewed' 
    });
  } catch (error) {
    console.error('Lock acquisition failed:', error);
    return NextResponse.json({ error: 'Failed to acquire lock' }, { status: 500 });
  }
});

export const DELETE = requireEditor(async (request: NextRequest, context: { userId: string; role: string }, { params }: { params: Promise<{ slug: string }> }) => {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    const topic = await directus.request(readItems('topics', {
      filter: { slug: { _eq: slug } },
      fields: ['id', 'locked_by'],
      limit: 1
    } as any));

    if (!topic || (topic as any[]).length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const t = (topic as any[])[0];

    // Only allow owner to release lock (or it expires naturally)
    if (t.locked_by === context.userId) {
      await directus.request(updateItem('topics', t.id, {
        locked_by: null,
        lock_expires: null
      } as any));
    }

    return NextResponse.json({ success: true, message: 'Lock released' });
  } catch (error) {
    console.error('Lock release failed:', error);
    return NextResponse.json({ error: 'Failed to release lock' }, { status: 500 });
  }
});
