const BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'hAliuULIb4VaOpIkNa7vOFIRzMmYWPOl';

async function checkTopicsCollectionFields() {
    console.log('🔍 Checking topics collection fields...');

    try {
        // Try to fetch a topic to see what fields are available
        const res = await fetch(`${BASE_URL}/items/topics?limit=1&fields=*`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        if (!res.ok) {
            const err = await res.json();
            console.error('❌ Failed to fetch topics:', err);
            return;
        }

        const data = await res.json();
        if (data.data && data.data.length > 0) {
            const topic = data.data[0];
            console.log('✅ Topics collection accessible');
            console.log('📋 Available fields:', Object.keys(topic));

            // Check for our new fields
            const expectedFields = [
                'canonical_title_en',
                'canonical_title_transliteration',
                'description_en'
            ];

            console.log('\n🔍 Checking for new bilingual fields:');
            expectedFields.forEach(field => {
                if (topic.hasOwnProperty(field)) {
                    const value = topic[field];
                    console.log(`✅ ${field}: ${value ? `"${value}"` : 'empty'}`);
                } else {
                    console.log(`❌ ${field}: missing`);
                }
            });

            console.log('\n📊 Current topic sample:');
            console.log(`- Hebrew: "${topic.canonical_title}"`);
            console.log(`- English: "${topic.canonical_title_en || 'not set'}"`);
            console.log(`- Transliteration: "${topic.canonical_title_transliteration || 'not set'}"`);
        } else {
            console.log('⚠️ No topics found in collection');
        }

    } catch (e) {
        console.error('Error checking collection:', e);
    }
}

async function testBilingualAPI() {
    console.log('\n🧪 Testing bilingual API response...');

    try {
        const res = await fetch(`${BASE_URL}/api/topics?mode=discovery`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        if (!res.ok) {
            console.error('❌ API test failed:', res.status, res.statusText);
            return;
        }

        const data = await res.json();
        console.log('✅ API responding');

        if (data.recentTopics && data.recentTopics.length > 0) {
            const topic = data.recentTopics[0];
            console.log('📋 API Response sample:');
            console.log(`- Display Name: "${topic.name}"`);
            console.log(`- Hebrew: "${topic.name_hebrew}"`);
            console.log(`- Category: "${topic.category}"`);

            // Check if bilingual logic is working
            if (topic.name !== topic.name_hebrew) {
                console.log('✅ Bilingual display working!');
            } else {
                console.log('⚠️ Still showing Hebrew (English fields may be empty)');
            }
        }

    } catch (e) {
        console.error('API test error:', e);
    }
}

// Run checks
async function runVerification() {
    await checkTopicsCollectionFields();
    await testBilingualAPI();
    console.log('\n🎯 Next: If fields are missing, add them in Directus admin first.');
    console.log('📖 See: .windsurf/localization_assessment/add_english_fields_guide.md');
}

runVerification().catch(console.error);
