#!/usr/bin/env node
/**
 * Generalized Sefer Import Script
 *
 * Usage:
 *   node scripts/import-sefer/import.mjs <config-name>
 *   node scripts/import-sefer/import.mjs likkutei-sichos
 *   node scripts/import-sefer/import.mjs tanya --dry-run
 *
 * The config file should be in scripts/import-sefer/configs/<config-name>.config.ts
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config({ path: join(__dirname, '../../.env.local') });
dotenv.config({ path: join(__dirname, '../../.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

if (!DIRECTUS_URL || !TOKEN) {
  console.error('❌ Error: DIRECTUS_URL and DIRECTUS_STATIC_TOKEN must be set');
  process.exit(1);
}

// Hebrew numeral conversion
const HEBREW_NUMERALS = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'יא': 11, 'יב': 12, 'יג': 13, 'יד': 14, 'טו': 15, 'טז': 16,
  'יז': 17, 'יח': 18, 'יט': 19, 'כ': 20, 'כא': 21, 'כב': 22, 'כג': 23,
  'כד': 24, 'כה': 25, 'כו': 26, 'כז': 27, 'כח': 28, 'כט': 29, 'ל': 30,
  'לא': 31, 'לב': 32, 'לג': 33, 'לד': 34, 'לה': 35, 'לו': 36, 'לז': 37,
  'לח': 38, 'לט': 39, 'מ': 40, 'מא': 41, 'מב': 42, 'מג': 43, 'מד': 44,
  'מה': 45, 'מו': 46, 'מז': 47, 'מח': 48, 'מט': 49, 'נ': 50
};

function parseHebrewNumeral(text) {
  // Extract Hebrew letters from strings like "חלק א" or "חלק טז"
  const match = text.match(/([א-ת]+)\s*$/);
  if (match) {
    return HEBREW_NUMERALS[match[1]] || 999;
  }
  return 999;
}

// API helpers
async function createItem(collection, data, dryRun = false) {
  if (dryRun) {
    console.log(`  [DRY RUN] Would create ${collection}:`, data.title || data);
    return { id: `dry-run-${Date.now()}` };
  }

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

  return (await response.json()).data;
}

async function findSourceByTitle(title) {
  const response = await fetch(
    `${DIRECTUS_URL}/items/sources?filter[title][_eq]=${encodeURIComponent(title)}&limit=1`,
    { headers: { 'Authorization': `Bearer ${TOKEN}` } }
  );

  if (!response.ok) return null;
  const result = await response.json();
  return result.data?.[0] || null;
}

// Data fetching
async function fetchData(dataSource) {
  switch (dataSource.type) {
    case 'url':
      console.log(`📥 Fetching from ${dataSource.url}...`);
      const response = await fetch(dataSource.url);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      return response.json();

    case 'file':
      console.log(`📂 Loading from ${dataSource.path}...`);
      const content = readFileSync(dataSource.path, 'utf-8');
      return JSON.parse(content);

    case 'inline':
      return dataSource.data;

    default:
      throw new Error(`Unknown data source type: ${dataSource.type}`);
  }
}

// Field value extraction
function extractValue(item, mapping) {
  if (typeof mapping === 'string') {
    return item[mapping];
  }

  if (mapping.static) {
    return mapping.static;
  }

  if (mapping.template) {
    return mapping.template.replace(/\{(\w+)\}/g, (_, key) => item[key] || '');
  }

  if (mapping.extract) {
    const sourceValue = item[mapping.extract.from];
    if (!sourceValue) return null;
    const match = sourceValue.match(new RegExp(mapping.extract.regex));
    return match ? match[1] : null;
  }

  return null;
}

// Main import function
async function importSefer(config) {
  const dryRun = config.options?.dryRun || process.argv.includes('--dry-run');

  console.log('');
  console.log('='.repeat(60));
  console.log(`📚 Importing: ${config.name}`);
  console.log('='.repeat(60));
  if (dryRun) console.log('🔍 DRY RUN MODE - No changes will be made\n');

  // 1. Fetch data
  let data = await fetchData(config.dataSource);
  console.log(`✅ Data loaded\n`);

  // 2. Pre-process if defined
  if (config.transforms?.preProcess) {
    data = config.transforms.preProcess(data);
    console.log(`✅ Data pre-processed: ${Array.isArray(data) ? data.length : 'N/A'} items\n`);
  }

  // Ensure data is an array
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array after pre-processing');
  }

  // 3. Apply filter if defined
  if (config.transforms?.filter) {
    const beforeCount = data.length;
    data = data.filter(config.transforms.filter);
    console.log(`✅ Filtered: ${beforeCount} → ${data.length} items\n`);
  }

  // 4. Create or find root source
  let rootSource = await findSourceByTitle(config.root.title);

  if (rootSource) {
    console.log(`📚 Root exists: ${config.root.title} (ID: ${rootSource.id})`);
  } else {
    rootSource = await createItem('sources', {
      title: config.root.title,
      original_lang: config.root.original_lang,
      is_external: false,
      author_id: config.root.author_id,
      authority_level: config.root.authority_level,
      publication_year: config.root.publication_year,
      metadata: {
        type: 'sefer_collection',
        description: config.root.description,
        title_hebrew: config.root.title_hebrew,
        import_config: config.id,
      }
    }, dryRun);
    console.log(`📚 Created root: ${config.root.title} (ID: ${rootSource.id})`);
  }

  // 5. Group data by middle level (if defined)
  const middleConfig = config.hierarchy.middleLevel;
  const leafConfig = config.hierarchy.leafLevel;

  let middleLevelMap = {}; // groupValue → source ID

  if (middleConfig) {
    // Collect unique middle level values
    const middleValues = [...new Set(data.map(item => item[middleConfig.extract.groupByField]))];

    // Sort middle values
    if (middleConfig.extract.sortType === 'hebrew-numeric') {
      middleValues.sort((a, b) => parseHebrewNumeral(a) - parseHebrewNumeral(b));
    } else if (middleConfig.extract.sortType === 'numeric') {
      middleValues.sort((a, b) => {
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        return numA - numB;
      });
    } else {
      middleValues.sort();
    }

    console.log(`\n📖 Creating ${middleValues.length} ${middleConfig.levelName}s...\n`);

    // Create middle level sources
    for (const value of middleValues) {
      const title = middleConfig.extract.titleTemplate.replace('{value}', value);

      let middleSource = await findSourceByTitle(title);

      if (middleSource) {
        console.log(`  📗 ${middleConfig.levelName} exists: ${value} (ID: ${middleSource.id})`);
        middleLevelMap[value] = middleSource.id;
      } else {
        middleSource = await createItem('sources', {
          title,
          original_lang: config.root.original_lang,
          is_external: false,
          author_id: config.root.author_id,
          authority_level: config.root.authority_level,
          parent_id: rootSource.id,
          metadata: {
            type: middleConfig.levelName.toLowerCase(),
            [middleConfig.extract.groupByField]: value,
            import_config: config.id,
          }
        }, dryRun);
        console.log(`  📗 Created ${middleConfig.levelName}: ${value} (ID: ${middleSource.id})`);
        middleLevelMap[value] = middleSource.id;
      }
    }
  }

  // 6. Create leaf level sources
  console.log(`\n📝 Creating ${data.length} ${leafConfig.levelName}s...\n`);

  let created = 0, skipped = 0, failed = 0;
  const batchSize = config.options?.batchSize || 50;
  const batchDelay = config.options?.batchDelay || 100;

  for (let i = 0; i < data.length; i++) {
    let item = data[i];

    // Apply leaf transform if defined
    if (config.transforms?.transformLeaf) {
      item = config.transforms.transformLeaf(item, {
        middle: middleConfig ? item[middleConfig.extract.groupByField] : undefined,
        root: config.root
      });
    }

    // Extract field values
    const title = extractValue(item, leafConfig.mappings.title);
    const pageNumber = leafConfig.mappings.pageNumber
      ? extractValue(item, leafConfig.mappings.pageNumber)
      : null;
    const pageCount = leafConfig.mappings.pageCount
      ? extractValue(item, leafConfig.mappings.pageCount)
      : null;
    const parsha = leafConfig.mappings.parsha
      ? extractValue(item, leafConfig.mappings.parsha)
      : null;
    const chapterNumber = leafConfig.mappings.chapterNumber
      ? extractValue(item, leafConfig.mappings.chapterNumber)
      : null;
    const language = leafConfig.mappings.language
      ? extractValue(item, leafConfig.mappings.language)
      : config.root.original_lang;

    // Build metadata
    const metadata = { type: leafConfig.levelName.toLowerCase(), import_config: config.id };
    if (leafConfig.mappings.metadata) {
      for (const [key, field] of Object.entries(leafConfig.mappings.metadata)) {
        metadata[key] = item[field];
      }
    }

    // Determine parent
    const parentId = middleConfig
      ? middleLevelMap[item[middleConfig.extract.groupByField]]
      : rootSource.id;

    // Build external URL
    let externalUrl = null;
    let externalSystem = null;
    let externalId = null;

    if (leafConfig.externalUrl) {
      externalId = item[leafConfig.externalUrl.idField];
      if (externalId || !leafConfig.externalUrl.requireId) {
        externalSystem = leafConfig.externalUrl.system;
        externalUrl = externalId
          ? leafConfig.externalUrl.urlTemplate.replace('{id}', externalId)
          : null;
      }
    }

    // Check if exists
    if (config.options?.skipExisting) {
      const existing = await findSourceByTitle(title);
      if (existing) {
        skipped++;
        continue;
      }
    }

    // Create source
    try {
      await createItem('sources', {
        title,
        original_lang: language,
        is_external: !!externalUrl,
        external_system: externalSystem,
        external_id: externalId || null,
        external_url: externalUrl,
        author_id: config.root.author_id,
        authority_level: config.root.authority_level,
        parent_id: parentId,
        page_number: pageNumber ? parseInt(pageNumber) : null,
        page_count: pageCount ? parseInt(pageCount) : null,
        parsha,
        metadata,
      }, dryRun);

      created++;

      if (created % 100 === 0) {
        console.log(`  ✅ Progress: ${created} ${leafConfig.levelName}s created...`);
      }
    } catch (error) {
      console.error(`  ❌ Failed: ${title} - ${error.message}`);
      failed++;
    }

    // Batch delay
    if (i > 0 && i % batchSize === 0 && batchDelay) {
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  }

  // 7. Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`  Config:          ${config.id}`);
  console.log(`  Root:            ${config.root.title} (ID: ${rootSource.id})`);
  if (middleConfig) {
    console.log(`  ${middleConfig.levelName}s:       ${Object.keys(middleLevelMap).length}`);
  }
  console.log(`  ${leafConfig.levelName}s created:  ${created}`);
  console.log(`  ${leafConfig.levelName}s skipped:  ${skipped}`);
  console.log(`  ${leafConfig.levelName}s failed:   ${failed}`);
  if (dryRun) console.log(`  Mode:            DRY RUN`);
  console.log('='.repeat(60));
  console.log('\n✨ Import complete!');
}

// CLI entry point
async function main() {
  const configName = process.argv[2];

  if (!configName) {
    console.error('Usage: node import.mjs <config-name> [--dry-run]');
    console.error('Example: node import.mjs likkutei-sichos');
    process.exit(1);
  }

  // Dynamic import of config
  const configPath = `./configs/${configName}.config.ts`;

  try {
    // Use tsx or ts-node to load TypeScript configs
    // For now, we'll use a simpler approach - convert to JS or use eval
    // In production, you'd use tsx: npx tsx scripts/import-sefer/import.mjs

    // Try loading as JS first (for .mjs configs)
    let config;
    try {
      const module = await import(`./configs/${configName}.config.mjs`);
      config = module.config || module.default;
    } catch {
      // Fall back to requiring the known configs
      if (configName === 'likkutei-sichos') {
        config = (await import('./configs/likkutei-sichos.config.mjs')).default;
      } else {
        throw new Error(`Config not found: ${configName}. Create a .mjs config file.`);
      }
    }

    await importSefer(config);
  } catch (error) {
    console.error(`❌ Error loading config: ${error.message}`);
    console.error('\nMake sure your config file exists and exports a valid config object.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
