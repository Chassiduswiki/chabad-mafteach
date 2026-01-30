const { createDirectus, rest, staticToken, readItems } = require('@directus/sdk');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Directus client configuration
const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const directusToken = process.env.DIRECTUS_STATIC_TOKEN;

if (!directusToken) {
    throw new Error('DIRECTUS_STATIC_TOKEN environment variable is not set. Please configure .env file.');
}

if (!directusUrl) {
    throw new Error('DIRECTUS_URL environment variable is not set. Please configure .env file.');
}

const directus = createDirectus(directusUrl)
    .with(staticToken(directusToken))
    .with(rest());

/**
 * Legacy Field Verification Script
 *
 * Verifies that data from legacy topic fields has been correctly migrated to topic_translations.
 */

const LEGACY_FIELDS = [
    'canonical_title',
    'description',
    'overview',
    'article',
    'definition_positive',
    'definition_negative',
    'practical_takeaways',
    'historical_context',
    'mashal',
    'global_nimshal',
    'charts'
];

async function verifyMigration() {
    console.log('🔍 Starting migration verification...\n');

    try {
        // Fetch all topics with legacy fields
        const topics = await directus.request(readItems('topics', {
            fields: ['id', 'slug', 'default_language', ...LEGACY_FIELDS],
            limit: -1
        }));

        console.log(`Debug: Found ${topics.length} topics.`);

        // Fetch all translations
        const translations = await directus.request(readItems('topic_translations', {
            fields: ['*'],
            limit: -1
        }));

        console.log(`Debug: Found ${translations.length} translations.`);

        let missingTranslations = 0;
        let mismatchCount = 0;
        let safeToDelete = true;

        for (const topic of topics) {
            const defaultLang = topic.default_language || 'en'; // Assuming 'en' or 'he' based on data, but usually 'en' for check

            // Find translation for this topic
            // We want to check if there is AT LEAST one translation that contains the data, 
            // usually the one matching the content.
            // For this check, we'll look for *any* translation that matches the legacy data.

            const topicTranslations = translations.filter(t => t.topic_id === topic.id);

            if (topicTranslations.length === 0) {
                console.log(`❌ Topic ${topic.slug} (ID: ${topic.id}) has NO translations.`);
                missingTranslations++;
                safeToDelete = false;
                continue;
            }

            // Check if legacy data exists in the translations
            // We'll assume the primary translation (english usually) should hold the legacy data if it was in english
            // But legacy data might be mixed.

            // Let's verify specific fields
            for (const field of LEGACY_FIELDS) {
                const legacyValue = topic[field];

                // If legacy value is empty/null, we don't care
                if (!legacyValue) continue;

                // Check if ANY of the topic's translations contain this value
                // We use a loose comparison or check if it's contained
                const matchFound = topicTranslations.some(t => {
                    const translationValue = t[field];
                    return translationValue === legacyValue;
                });

                if (!matchFound) {
                    // Try to be more specific: if it's english text, check english translation
                    // This is a simple exact match check.

                    // Helper for short log
                    const valPreview = typeof legacyValue === 'string' ? legacyValue.substring(0, 50) + '...' : 'Complex Data';
                    console.log(`⚠️  Mismatch for Topic ${topic.slug}: Legacy field '${field}' value not found in exact form in any translation.`);
                    // console.log(`   Legacy Value: ${valPreview}`);
                    mismatchCount++;
                    // We won't set safeToDelete = false immediately for content diffs as they might have been edited,
                    // but we should flag it. 
                    // However, strict verification requires they match or we accept it.
                }
            }
        }

        console.log('\n📊 Verification Summary:');
        console.log(`Total Topics: ${topics.length}`);
        console.log(`Topics missing translations: ${missingTranslations}`);
        console.log(`Field data mismatches: ${mismatchCount}`);

        if (missingTranslations === 0 && mismatchCount === 0) {
            console.log('\n✅ VERIFICATION PASSED: All legacy data appears to be safely migrated.');
            console.log('You can proceed with dropping legacy fields.');
        } else {
            console.log('\n❌ VERIFICATION FAILED or WARNINGS FOUND.');
            console.log('Please review mismatches before dropping fields.');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    verifyMigration();
}

module.exports = { verifyMigration };
