const BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'hAliuULIb4VaOpIkNa7vOFIRzMmYWPOl';

// Sample translations for existing Hebrew topics
const sampleTranslations = [
    {
        entity_type: 'topic',
        entity_id: 1, // Tzadik
        field_name: 'canonical_title',
        target_lang: 'en',
        translated_text: 'Righteous Person',
        translation_quality: 'human_verified'
    },
    {
        entity_type: 'topic',
        entity_id: 2, // Rasha
        field_name: 'canonical_title',
        target_lang: 'en',
        translated_text: 'Wicked Person',
        translation_quality: 'human_verified'
    },
    {
        entity_type: 'topic',
        entity_id: 3, // Beinoni
        field_name: 'canonical_title',
        target_lang: 'en',
        translated_text: 'Intermediate Person',
        translation_quality: 'human_verified'
    }
];

async function addTranslation(translation) {
    console.log(`Adding translation for ${translation.entity_type} ${translation.entity_id} (${translation.target_lang})...`);

    try {
        const res = await fetch(`${BASE_URL}/items/translations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify(translation)
        });

        if (!res.ok) {
            const err = await res.json();
            console.error(`❌ Failed to add translation:`, JSON.stringify(err, null, 2));
            return false;
        } else {
            console.log(`✅ Translation added: ${translation.translated_text}`);
            return true;
        }
    } catch (e) {
        console.error('Error adding translation:', e);
        return false;
    }
}

async function checkTranslationsTable() {
    console.log('🔍 Checking if translations table exists...');

    try {
        const res = await fetch(`${BASE_URL}/items/translations?limit=1`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        if (!res.ok) {
            const err = await res.json();
            if (err.errors?.[0]?.message?.includes('does not exist')) {
                console.log('❌ Translations table does not exist yet.');
                console.log('📋 Please create it first using the manual setup instructions in:');
                console.log('   .windsurf/localization_assessment/translations_table_setup.md');
                return false;
            } else {
                console.error('❌ Permission error:', err);
                return false;
            }
        } else {
            console.log('✅ Translations table exists!');
            return true;
        }
    } catch (e) {
        console.error('Error checking translations table:', e);
        return false;
    }
}

async function addSampleTranslations() {
    console.log('🚀 Adding sample translations...');

    // First check if table exists
    if (!await checkTranslationsTable()) {
        return;
    }

    // Add each translation
    let successCount = 0;
    for (const translation of sampleTranslations) {
        if (await addTranslation(translation)) {
            successCount++;
        }
    }

    console.log(`\n📊 Results: ${successCount}/${sampleTranslations.length} translations added successfully`);

    if (successCount > 0) {
        console.log('\n📋 Next steps:');
        console.log('1. Update the topics API to fetch translations');
        console.log('2. Test bilingual display in the frontend');
    }
}

// Run the script
addSampleTranslations().catch(console.error);
