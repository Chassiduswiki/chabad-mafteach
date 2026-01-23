#!/usr/bin/env node
/**
 * Fix English Translations
 * Copies description_en from topics to English translations
 */

import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const DIRECTUS_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || 'qolRjZQj-yoaxKaEnmPQ8HVcn_ngyNDs';

async function directusRequest(endpoint, options = {}) {
  const url = `${DIRECTUS_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Directus API error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function main() {
  console.log('🔧 Fixing English translations...\n');

  // Fetch all topics with descriptions
  const topicsResponse = await directusRequest('/items/topics?limit=-1&fields=id,description,description_en');
  const topics = topicsResponse.data;

  // Fetch all English translations
  const translationsResponse = await directusRequest('/items/topic_translations?filter[language_code][_eq]=en&limit=-1&fields=id,topic_id,description');
  const translations = translationsResponse.data;

  let updated = 0;
  let skipped = 0;

  for (const translation of translations) {
    const topic = topics.find(t => t.id === translation.topic_id);
    if (!topic) continue;

    const correctDescription = topic.description_en || topic.description;
    
    // Only update if description is missing or different
    if (!translation.description || translation.description !== correctDescription) {
      try {
        await directusRequest(`/items/topic_translations/${translation.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ description: correctDescription })
        });
        console.log(`✅ Updated topic ${translation.topic_id} (ID: ${translation.id})`);
        updated++;
      } catch (error) {
        console.error(`❌ Failed to update ${translation.id}:`, error.message);
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Updated ${updated} English translations`);
  console.log(`⏭️  Skipped ${skipped} (already correct)\n`);
}

main().catch(console.error);
