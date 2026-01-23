/**
 * Migration Script: Topics to Translations
 * 
 * Migrates existing topic data from flat fields to topic_translations table
 * Preserves all content with zero data loss
 */

import { createDirectus, rest, readItems, createItems } from '@directus/sdk';

const directus = createDirectus(process.env.NEXT_PUBLIC_DIRECTUS_URL).with(rest());

async function migrateTopicsToTranslations() {
  console.log('🚀 Starting topic translations migration...\n');

  try {
    // Fetch all topics with their content
    console.log('📥 Fetching all topics...');
    const topics = await directus.request(
      readItems('topics', {
        fields: [
          'id',
          'canonical_title',
          'canonical_title_en',
          'canonical_title_transliteration',
          'name_hebrew',
          'description',
          'description_en',
          'overview',
          'article',
          'definition_positive',
          'definition_negative',
          'practical_takeaways',
          'historical_context',
          'mashal',
          'global_nimshal',
          'charts',
          'original_lang'
        ],
        limit: -1
      })
    );

    console.log(`✅ Found ${topics.length} topics\n`);

    // Check which topics already have translations
    console.log('🔍 Checking existing translations...');
    const existingTranslations = await directus.request(
      readItems('topic_translations', {
        fields: ['topic_id', 'language_code'],
        limit: -1
      })
    );

    const existingSet = new Set(
      existingTranslations.map(t => `${t.topic_id}-${t.language_code}`)
    );

    console.log(`📊 Found ${existingTranslations.length} existing translations\n`);

    // Prepare translation records
    const translationsToCreate = [];
    let skipped = 0;

    for (const topic of topics) {
      // Determine if we should create Hebrew translation
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

      // Determine if we should create English translation
      const hasEnglishContent = 
        topic.canonical_title_en || 
        topic.description_en || 
        topic.original_lang === 'en';
      
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

    // Create translations in batches of 50
    const batchSize = 50;
    let created = 0;
    let errors = 0;

    for (let i = 0; i < translationsToCreate.length; i += batchSize) {
      const batch = translationsToCreate.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(translationsToCreate.length / batchSize);

      try {
        console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} items)...`);
        
        await directus.request(createItems('topic_translations', batch));
        
        created += batch.length;
        console.log(`✅ Batch ${batchNum} complete (${created}/${translationsToCreate.length} total)\n`);
      } catch (error) {
        console.error(`❌ Error in batch ${batchNum}:`, error.message);
        errors += batch.length;
        
        // Try individual items in failed batch
        console.log(`🔄 Retrying batch ${batchNum} items individually...`);
        for (const item of batch) {
          try {
            await directus.request(createItems('topic_translations', item));
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
      console.log('⚠️  Migration completed with some errors. Check logs above.\n');
    }

    // Verification
    console.log('🔍 Running verification...');
    const finalTranslations = await directus.request(
      readItems('topic_translations', {
        aggregate: { count: '*' },
        groupBy: ['language_code']
      })
    );

    console.log('\n📊 Translation counts by language:');
    finalTranslations.forEach(stat => {
      console.log(`  ${stat.language_code}: ${stat.count}`);
    });

    // Check for topics without translations
    const allTranslations = await directus.request(
      readItems('topic_translations', {
        fields: ['topic_id'],
        limit: -1
      })
    );

    const topicsWithTranslations = new Set(allTranslations.map(t => t.topic_id));
    const topicsWithoutTranslations = topics.filter(t => !topicsWithTranslations.has(t.id));

    if (topicsWithoutTranslations.length > 0) {
      console.log(`\n⚠️  Warning: ${topicsWithoutTranslations.length} topics have no translations:`);
      topicsWithoutTranslations.slice(0, 10).forEach(t => {
        console.log(`  - Topic ${t.id}: ${t.canonical_title || t.name_hebrew || 'Unknown'}`);
      });
      if (topicsWithoutTranslations.length > 10) {
        console.log(`  ... and ${topicsWithoutTranslations.length - 10} more`);
      }
    } else {
      console.log('\n✅ All topics have at least one translation!');
    }

    console.log('\n🎉 Migration complete!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateTopicsToTranslations();
