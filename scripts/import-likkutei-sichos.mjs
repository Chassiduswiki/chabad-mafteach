#!/usr/bin/env node
/**
 * Import Likkutei Sichos from berel.me/findasicha into Directus sources
 *
 * Creates hierarchical structure:
 *   Likkutei Sichos (root)
 *   ├── חלק א (volume)
 *   │   ├── Sicha 1 (with Chabad.org link)
 *   │   └── ...
 *   ├── חלק ב
 *   └── ...
 *
 * Run: node scripts/import-likkutei-sichos.mjs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN;
const BEREL_URL = 'https://berel.me/findasicha/sichos_data.json';
const AUTHOR_ID = 8; // The Rebbe

if (!DIRECTUS_URL || !TOKEN) {
  console.error('❌ Error: DIRECTUS_URL and DIRECTUS_STATIC_TOKEN must be set');
  process.exit(1);
}

// Hebrew volume number to Arabic number mapping
const hebrewToNumber = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'יא': 11, 'יב': 12, 'יג': 13, 'יד': 14, 'טו': 15, 'טז': 16,
  'יז': 17, 'יח': 18, 'יט': 19, 'כ': 20, 'כא': 21, 'כב': 22, 'כג': 23,
  'כד': 24, 'כה': 25, 'כו': 26, 'כז': 27, 'כח': 28, 'כט': 29, 'ל': 30,
  'לא': 31, 'לב': 32, 'לג': 33, 'לד': 34, 'לה': 35, 'לו': 36, 'לז': 37,
  'לח': 38, 'לט': 39
};

/**
 * Extract volume number from chelek string like "חלק א" or "חלק טז"
 */
function extractVolumeNumber(chelek) {
  const match = chelek.match(/חלק\s+([א-ת]+)/);
  if (match) {
    const hebrewNum = match[1];
    return hebrewToNumber[hebrewNum] || null;
  }
  return null;
}

/**
 * Create a Directus item
 */
async function createItem(collection, data) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/items/${collection}`, {
      method: 'POST',
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

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Failed to create ${collection}:`, error.message);
    return null;
  }
}

/**
 * Check if a source already exists by title
 */
async function findSourceByTitle(title) {
  try {
    const response = await fetch(
      `${DIRECTUS_URL}/items/sources?filter[title][_eq]=${encodeURIComponent(title)}&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      }
    );

    if (!response.ok) return null;

    const result = await response.json();
    return result.data?.[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch sichos data from berel.me
 */
async function fetchSichosData() {
  console.log('📥 Fetching data from berel.me...');
  const response = await fetch(BEREL_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  return response.json();
}

/**
 * Main import function
 */
async function importLikkuteiSichos() {
  console.log('🚀 Starting Likkutei Sichos import\n');

  // 1. Fetch data
  const data = await fetchSichosData();
  console.log(`✅ Fetched ${data.parshiyot.length} parshiyot\n`);

  // 2. Check if root already exists
  let rootSource = await findSourceByTitle('Likkutei Sichos');

  if (rootSource) {
    console.log(`📚 Root source already exists (ID: ${rootSource.id})`);
  } else {
    // Create root source
    rootSource = await createItem('sources', {
      title: 'Likkutei Sichos',
      original_lang: 'he',
      is_external: false,
      author_id: AUTHOR_ID,
      authority_level: 'primary',
      metadata: {
        type: 'sefer_collection',
        description: 'Collection of talks by the Lubavitcher Rebbe',
        import_source: 'berel.me/findasicha'
      }
    });

    if (!rootSource) {
      console.error('❌ Failed to create root source');
      process.exit(1);
    }
    console.log(`📚 Created root: Likkutei Sichos (ID: ${rootSource.id})`);
  }

  // 3. Collect all unique volumes from the data
  const volumeSet = new Set();
  const sichosFlat = [];

  for (const parsha of data.parshiyot) {
    const sichos = data.sichos_by_parsha[parsha] || [];
    for (const sicha of sichos) {
      volumeSet.add(sicha.chelek);
      sichosFlat.push(sicha);
    }
  }

  const volumes = Array.from(volumeSet).sort((a, b) => {
    const numA = extractVolumeNumber(a) || 999;
    const numB = extractVolumeNumber(b) || 999;
    return numA - numB;
  });

  console.log(`\n📖 Found ${volumes.length} volumes, ${sichosFlat.length} sichos total\n`);

  // 4. Create volume sources
  const volumeIdMap = {}; // chelek name -> source ID

  for (const chelek of volumes) {
    const volumeNum = extractVolumeNumber(chelek);
    const volumeTitle = `Likkutei Sichos ${chelek}`;

    let volumeSource = await findSourceByTitle(volumeTitle);

    if (volumeSource) {
      console.log(`  📗 Volume exists: ${chelek} (ID: ${volumeSource.id})`);
      volumeIdMap[chelek] = volumeSource.id;
    } else {
      volumeSource = await createItem('sources', {
        title: volumeTitle,
        original_lang: 'he',
        is_external: false,
        author_id: AUTHOR_ID,
        authority_level: 'primary',
        parent_id: rootSource.id,
        metadata: {
          type: 'volume',
          volume_number: volumeNum,
          chelek_hebrew: chelek,
          import_source: 'berel.me/findasicha'
        }
      });

      if (volumeSource) {
        console.log(`  📗 Created volume: ${chelek} (ID: ${volumeSource.id})`);
        volumeIdMap[chelek] = volumeSource.id;
      } else {
        console.error(`  ❌ Failed to create volume: ${chelek}`);
      }
    }
  }

  // 5. Create individual sicha sources
  console.log('\n📝 Creating individual sichos...\n');

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const sicha of sichosFlat) {
    const volumeId = volumeIdMap[sicha.chelek];
    if (!volumeId) {
      console.error(`  ⚠️ No volume ID for ${sicha.chelek}, skipping sicha`);
      skipped++;
      continue;
    }

    // Build external URL if articleid exists
    const externalUrl = sicha.articleid
      ? `https://www.chabad.org/torah-texts/${sicha.articleid}`
      : null;

    // Check if this sicha already exists
    const existingSource = await findSourceByTitle(sicha.title);
    if (existingSource) {
      skipped++;
      continue;
    }

    const sichaSource = await createItem('sources', {
      title: sicha.title,
      original_lang: sicha.language === 'אידיש' ? 'yi' : 'he',
      is_external: !!externalUrl,
      external_system: externalUrl ? 'chabad.org' : null,
      external_id: sicha.articleid || null,
      external_url: externalUrl,
      author_id: AUTHOR_ID,
      authority_level: 'primary',
      parent_id: volumeId,
      metadata: {
        type: 'sicha',
        parsha: sicha.parsha,
        chelek: sicha.chelek,
        pages: sicha.pages,
        language: sicha.language,
        filename: sicha.filename,
        import_source: 'berel.me/findasicha'
      }
    });

    if (sichaSource) {
      created++;
      if (created % 100 === 0) {
        console.log(`  ✅ Progress: ${created} sichos created...`);
      }
    } else {
      failed++;
    }
  }

  // 6. Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary');
  console.log('='.repeat(50));
  console.log(`  Root source:     Likkutei Sichos (ID: ${rootSource.id})`);
  console.log(`  Volumes created: ${Object.keys(volumeIdMap).length}`);
  console.log(`  Sichos created:  ${created}`);
  console.log(`  Sichos skipped:  ${skipped} (already existed)`);
  console.log(`  Sichos failed:   ${failed}`);
  console.log('='.repeat(50));
  console.log('\n✨ Import complete!');
}

// Run
importLikkuteiSichos().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
