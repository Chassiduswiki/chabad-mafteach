import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';
import { requireEditor } from '@/lib/auth';

const directus = createClient();

export const POST = requireEditor(async (request: NextRequest, context: { userId: string; role: string }) => {
  try {
    console.log('Clearing expired topic locks...');
    
    // Get all topics that have locks
    const topics = await directus.request(readItems('topics', {
      filter: {
        locked_by: { _nnull: true }
      },
      fields: ['id', 'slug', 'locked_by', 'lock_expires'],
      limit: -1
    } as any));

    const now = new Date();
    let clearedCount = 0;
    let activeCount = 0;

    for (const topic of topics as any[]) {
      const expires = topic.lock_expires ? new Date(topic.lock_expires) : null;
      
      if (!expires || expires <= now) {
        console.log(`Clearing expired lock for topic: ${topic.slug} (locked by: ${topic.locked_by})`);
        
        await directus.request(updateItem('topics', topic.id, {
          locked_by: null,
          lock_expires: null
        } as any));
        
        clearedCount++;
      } else {
        activeCount++;
        console.log(`Lock still valid for topic: ${topic.slug} (expires: ${expires.toISOString()})`);
      }
    }

    console.log(`Cleared ${clearedCount} expired locks out of ${topics.length} total locked topics.`);

    return NextResponse.json({ 
      success: true, 
      message: `Cleared ${clearedCount} expired locks. ${activeCount} active locks remain.`,
      clearedCount,
      activeCount,
      totalLocked: topics.length
    });
  } catch (error) {
    console.error('Failed to clear expired locks:', error);
    return NextResponse.json({ error: 'Failed to clear expired locks' }, { status: 500 });
  }
});
