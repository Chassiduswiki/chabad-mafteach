#!/usr/bin/env tsx

import { createClient } from '../lib/directus';
import { readItems, updateItem } from '@directus/sdk';

const directus = createClient();

async function clearExpiredLocks() {
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
        console.log(`Lock still valid for topic: ${topic.slug} (expires: ${expires.toISOString()})`);
      }
    }

    console.log(`Cleared ${clearedCount} expired locks out of ${topics.length} total locked topics.`);
  } catch (error) {
    console.error('Failed to clear expired locks:', error);
  }
}

clearExpiredLocks();
