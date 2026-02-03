#!/usr/bin/env node
/**
 * Audit Hebrew Translations
 *
 * This script:
 * 1. Fetches all Hebrew translations
 * 2. Checks if description content is actually Hebrew or English
 * 3. Identifies translations that need cleanup
 * 4. Optionally fixes them by setting description to null
 */

import fetch from 'node-fetch';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
const DIRECTUS_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || 'qolRjZQj-yoaxKaEnmPQ8HVcn_ngyNDs';

const DRY_RUN = process.argv.includes('--dry-run');
const FIX = process.argv.includes('--fix');

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

/**
 * Check if text is primarily Hebrew
 * Hebrew Unicode range: \u0590-\u05FF (Hebrew letters)
 */
function isHebrew(text) {
  if (!text) return false;

  // Strip HTML tags for analysis
  const cleanText = text.replace(/<[^>]*>/g, '').trim();
  if (!cleanText) return false;

  // Count Hebrew characters
  const hebrewChars = (cleanText.match(/[\u0590-\u05FF]/g) || []).length;
  const latinChars = (cleanText.match(/[a-zA-Z]/g) || []).length;

  // If Hebrew chars outnumber Latin chars, consider it Hebrew
  return hebrewChars > latinChars;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Hebrew Translation Audit');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : FIX ? 'FIX' : 'AUDIT ONLY'}`);
  console.log('');

  // Fetch all Hebrew translations
  console.log('Fetching Hebrew translations...');
  const hebrewResponse = await directusRequest(
    '/items/topic_translations?filter[language_code][_eq]=he&limit=-1&fields=id,topic_id,title,description,translation_quality'
  );
  const hebrewTranslations = hebrewResponse.data;
  console.log(`Found ${hebrewTranslations.length} Hebrew translations\n`);

  // Fetch topic info for reference
  const topicsResponse = await directusRequest('/items/topics?limit=-1&fields=id,canonical_title,slug');
  const topics = topicsResponse.data;
  const topicMap = new Map(topics.map(t => [t.id, t]));

  // Analyze each translation
  const issues = {
    englishInHebrew: [],
    nullDescription: [],
    validHebrew: [],
    missingTitle: []
  };

  for (const translation of hebrewTranslations) {
    const topic = topicMap.get(translation.topic_id);
    const topicName = topic?.canonical_title || `Topic ${translation.topic_id}`;

    // Check title
    const hasHebrewTitle = isHebrew(translation.title);
    if (!translation.title || !hasHebrewTitle) {
      issues.missingTitle.push({
        ...translation,
        topicName,
        reason: !translation.title ? 'No title' : 'Title is not Hebrew'
      });
    }

    // Check description
    if (!translation.description) {
      issues.nullDescription.push({ ...translation, topicName });
    } else if (!isHebrew(translation.description)) {
      issues.englishInHebrew.push({
        ...translation,
        topicName,
        descriptionPreview: translation.description.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
      });
    } else {
      issues.validHebrew.push({ ...translation, topicName });
    }
  }

  // Report findings
  console.log('='.repeat(60));
  console.log('AUDIT RESULTS');
  console.log('='.repeat(60));

  console.log(`\n[VALID] Hebrew descriptions: ${issues.validHebrew.length}`);

  console.log(`\n[ISSUE] English content in Hebrew records: ${issues.englishInHebrew.length}`);
  if (issues.englishInHebrew.length > 0) {
    console.log('-'.repeat(40));
    issues.englishInHebrew.forEach((t, i) => {
      console.log(`  ${i + 1}. ID ${t.id}: ${t.topicName}`);
      console.log(`     Title: ${t.title || '(none)'}`);
      console.log(`     Description: "${t.descriptionPreview}"`);
    });
  }

  console.log(`\n[INFO] Null descriptions: ${issues.nullDescription.length}`);

  console.log(`\n[WARNING] Missing/non-Hebrew titles: ${issues.missingTitle.length}`);
  if (issues.missingTitle.length > 0) {
    issues.missingTitle.forEach((t, i) => {
      console.log(`  ${i + 1}. ID ${t.id}: ${t.topicName} - ${t.reason}`);
    });
  }

  // Fix if requested
  if (FIX && issues.englishInHebrew.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('FIXING ISSUES');
    console.log('='.repeat(60));

    let fixed = 0;
    let failed = 0;

    for (const translation of issues.englishInHebrew) {
      if (DRY_RUN) {
        console.log(`[DRY RUN] Would set description to null for ID ${translation.id} (${translation.topicName})`);
        fixed++;
      } else {
        try {
          await directusRequest(`/items/topic_translations/${translation.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              description: null,
              translation_quality: 'needs_translation'
            })
          });
          console.log(`Fixed ID ${translation.id}: ${translation.topicName}`);
          fixed++;
        } catch (error) {
          console.error(`Failed to fix ID ${translation.id}: ${error.message}`);
          failed++;
        }
      }
    }

    console.log(`\nFixed ${fixed} translations${DRY_RUN ? ' (dry run)' : ''}`);
    if (failed > 0) console.log(`Failed: ${failed}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Hebrew translations: ${hebrewTranslations.length}`);
  console.log(`Valid Hebrew descriptions: ${issues.validHebrew.length}`);
  console.log(`Need cleanup (English in Hebrew): ${issues.englishInHebrew.length}`);
  console.log(`No description: ${issues.nullDescription.length}`);

  if (!FIX && issues.englishInHebrew.length > 0) {
    console.log('\nTo fix issues, run with --fix flag:');
    console.log('  node scripts/audit-hebrew-translations.mjs --fix');
    console.log('\nTo preview changes without making them:');
    console.log('  node scripts/audit-hebrew-translations.mjs --fix --dry-run');
  }
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
