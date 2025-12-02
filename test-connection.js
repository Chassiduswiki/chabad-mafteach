const { createDirectus, rest, staticToken, readItems } = require('@directus/sdk');

const directus = createDirectus('http://localhost:8055')
    .with(staticToken('chabad_research_static_token_2025'))
    .with(rest());

async function testConnection() {
    try {
        console.log('Testing Directus connection...');

        const topics = await directus.request(readItems('topics', {
            sort: ['name'],
            fields: ['id', 'name', 'name_hebrew', 'slug', 'category', 'definition_short']
        }));

        console.log('✅ Success! Found', topics.length, 'topics:');
        console.log(JSON.stringify(topics, null, 2));
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

testConnection();
