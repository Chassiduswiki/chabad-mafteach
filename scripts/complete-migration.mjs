/**
 * Complete Topic Translation Migration
 * Migrates all remaining topics to topic_translations table
 */

import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const DIRECTUS_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error('❌ Error: DIRECTUS_ADMIN_TOKEN environment variable not set');
  console.log('Please set your admin token:');
  console.log('export DIRECTUS_ADMIN_TOKEN="your-token-here"');
  process.exit(1);
}

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
  console.log('🚀 Starting complete topic translation migration...\n');

  try {
    // Fetch all topics
    console.log('📥 Fetching all topics...');
    const topicsResponse = await directusRequest('/items/topics?limit=-1&fields=id,canonical_title,canonical_title_en,canonical_title_transliteration,name_hebrew,description,description_en,overview,article,definition_positive,definition_negative,practical_takeaways,historical_context,mashal,global_nimshal,charts,original_lang');
    const topics = topicsResponse.data;
    console.log(`✅ Found ${topics.length} topics\n`);

    // Fetch existing translations
    console.log('🔍 Checking existing translations...');
    const translationsResponse = await directusRequest('/items/topic_translations?limit=-1&fields=topic_id,language_code');
    const existingTranslations = translationsResponse.data;
    const existingSet = new Set(existingTranslations.map(t => `${t.topic_id}-${t.language_code}`));
    console.log(`📊 Found ${existingTranslations.length} existing translations\n`);

    // Prepare translations
    const translationsToCreate = [];
    let skipped = 0;

    for (const topic of topics) {
      // Hebrew translation
      const hasHebrewContent = topic.name_hebrew || topic.original_lang === 'he';
      const hebrewKey = `${topic.id}-he`;
      
      if (hasHebrewContent && !existingSet.has(hebrewKey)) {
        translationsToCreate.push({
          topic_id: topic.id,
          language_code: 'he',
          title: topic.name_hebrew || topic.canonical_title || 'ללא שם',
          transliteration: topic.canonical_title_transliteration || null,
          description: topic.description,
          overview: topic.overview,
          article: topic.article,
          definition_positive: topic.definition_positive,
          definition_negative: topic.definition_negative,
          practical_takeaways: topic.practical_takeaways,
          historical_context: topic.historical_context,
          mashal: topic.mashal,
          global_nimshal: topic.global_nimshal,
          charts: topic.charts,
          is_machine_translated: false,
          translation_quality: 'draft'
        });
      } else if (existingSet.has(hebrewKey)) {
        skipped++;
      }

      // English translation
      const hasEnglishContent = topic.canonical_title_en || topic.description_en || topic.original_lang === 'en';
      const englishKey = `${topic.id}-en`;
      
      if (hasEnglishContent && !existingSet.has(englishKey)) {
        translationsToCreate.push({
          topic_id: topic.id,
          language_code: 'en',
          title: topic.canonical_title_en || topic.canonical_title || 'Untitled',
          transliteration: topic.canonical_title_transliteration || null,
          description: topic.description_en || topic.description,
          overview: topic.overview,
          article: topic.article,
          definition_positive: topic.definition_positive,
          definition_negative: topic.definition_negative,
          practical_takeaways: topic.practical_takeaways,
          historical_context: topic.historical_context,
          mashal: topic.mashal,
          global_nimshal: topic.global_nimshal,
          charts: topic.charts,
          is_machine_translated: false,
          translation_quality: 'draft'
        });
      } else if (existingSet.has(englishKey)) {
        skipped++;
      }
    }

    console.log(`📝 Prepared ${translationsToCreate.length} new translations`);
    console.log(`⏭️  Skipped ${skipped} existing translations\n`);

    if (translationsToCreate.length === 0) {
      console.log('✅ All topics already migrated!\n');
      return;
    }

    // Create translations in batches
    const batchSize = 100;
    let created = 0;
    let errors = 0;

    for (let i = 0; i < translationsToCreate.length; i += batchSize) {
      const batch = translationsToCreate.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(translationsToCreate.length / batchSize);

      try {
        console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} items)...`);
        
        await directusRequest('/items/topic_translations', {
          method: 'POST',
          body: JSON.stringify(batch)
        });
        
        created += batch.length;
        console.log(`✅ Batch ${batchNum} complete (${created}/${translationsToCreate.length} total)\n`);
      } catch (error) {
        console.error(`❌ Error in batch ${batchNum}:`, error.message);
        errors += batch.length;
        
        // Try individual items
        console.log(`🔄 Retrying batch ${batchNum} items individually...`);
        for (const item of batch) {
          try {
            await directusRequest('/items/topic_translations', {
              method: 'POST',
              body: JSON.stringify(item)
            });
            created++;
            errors--;
          } catch (itemError) {
            console.error(`  ❌ Failed topic ${item.topic_id} (${item.language_code}):`, itemError.message);
          }
        }
        console.log();
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total topics: ${topics.length}`);
    console.log(`Translations created: ${created}`);
    console.log(`Translations skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log('='.repeat(50) + '\n');

    if (errors === 0) {
      console.log('✅ Migration completed successfully!\n');
    } else {
      console.log('⚠️  Migration completed with some errors.\n');
    }

    // Verification
    console.log('🔍 Running verification...');
    const finalResponse = await directusRequest('/items/topic_translations?aggregate[count]=*&groupBy[]=language_code');
    
    console.log('\n📊 Translation counts by language:');
    finalResponse.data.forEach(stat => {
      console.log(`  ${stat.language_code}: ${stat.count}`);
    });

    console.log('\n🎉 Migration complete!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
