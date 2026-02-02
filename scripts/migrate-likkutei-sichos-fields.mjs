#!/usr/bin/env node
/**
 * Migrate Likkutei Sichos metadata to dedicated fields
 *
 * Extracts from existing data:
 *   - page_number: starting page (from title pattern "ע' X")
 *   - page_count: number of pages (from metadata.pages)
 *   - parsha: Torah portion (from metadata.parsha)
 *
 * Run: node scripts/migrate-likkutei-sichos-fields.mjs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

if (!DIRECTUS_URL || !TOKEN) {
  console.error('❌ Error: DIRECTUS_URL and DIRECTUS_STATIC_TOKEN must be set');
  process.exit(1);
}

/**
 * Extract page number from title like "חא ע' 1 (בראשית)" or "ח״טז ע' 114 (וארא)"
 */
function extractPageNumber(title) {
  // Pattern: ע' followed by digits (Hebrew for "page")
  const match = title.match(/ע['׳]\s*(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Fetch all Likkutei Sichos sichas (external_system = chabad.org)
 */
async function fetchSichos() {
  const allSichos = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const response = await fetch(
      `${DIRECTUS_URL}/items/sources?filter[external_system][_eq]=chabad.org&limit=${limit}&page=${page}`,
      {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const result = await response.json();
    const sichos = result.data || [];

    if (sichos.length === 0) break;

    allSichos.push(...sichos);
    page++;

    if (sichos.length < limit) break;
  }

  return allSichos;
}

/**
 * Update a source with new fields
 */
async function updateSource(id, data) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/items/sources/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return true;
  } catch (error) {
    console.error(`Failed to update source ${id}:`, error.message);
    return false;
  }
}

/**
 * Main migration function
 */
async function migrateSichos() {
  console.log('🚀 Starting Likkutei Sichos field migration\n');

  // 1. Fetch all sichos
  console.log('📥 Fetching sichos...');
  const sichos = await fetchSichos();
  console.log(`✅ Found ${sichos.length} sichos to migrate\n`);

  // 2. Process each sicha
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const parseFailures = [];

  for (const sicha of sichos) {
    const pageNumber = extractPageNumber(sicha.title);
    const pageCount = sicha.metadata?.pages || null;
    const parsha = sicha.metadata?.parsha || null;

    // Track parse failures for review
    if (!pageNumber) {
      parseFailures.push({ id: sicha.id, title: sicha.title });
    }

    // Skip if nothing to update
    if (!pageNumber && !pageCount && !parsha) {
      skipped++;
      continue;
    }

    const updateData = {};
    if (pageNumber) updateData.page_number = pageNumber;
    if (pageCount) updateData.page_count = pageCount;
    if (parsha) updateData.parsha = parsha;

    const success = await updateSource(sicha.id, updateData);

    if (success) {
      updated++;
      if (updated % 100 === 0) {
        console.log(`  ✅ Progress: ${updated} sichos updated...`);
      }
    } else {
      failed++;
    }
  }

  // 3. Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary');
  console.log('='.repeat(50));
  console.log(`  Total sichos:    ${sichos.length}`);
  console.log(`  Updated:         ${updated}`);
  console.log(`  Skipped:         ${skipped}`);
  console.log(`  Failed:          ${failed}`);
  console.log(`  Parse failures:  ${parseFailures.length}`);
  console.log('='.repeat(50));

  // 4. Show parse failures if any
  if (parseFailures.length > 0) {
    console.log('\n⚠️  Could not extract page number from these titles:');
    parseFailures.slice(0, 10).forEach(f => {
      console.log(`    ID ${f.id}: "${f.title}"`);
    });
    if (parseFailures.length > 10) {
      console.log(`    ... and ${parseFailures.length - 10} more`);
    }
  }

  console.log('\n✨ Migration complete!');
}

// Run
migrateSichos().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
