const { createDirectus, rest, staticToken, readItems } = require('@directus/sdk');

const directusUrl = 'http://localhost:8055';
const directusToken = 'chabad_research_static_token_2025';

const directus = createDirectus(directusUrl)
    .with(staticToken(directusToken))
    .with(rest());

async function verify() {
    console.log('Verifying static token:', directusToken);
    try {
        const topics = await directus.request(readItems('topics', {
            limit: 1,
            fields: ['id', 'name']
        }));
        console.log('✅ Success! Found topics:', topics.length);
        console.log(topics[0]);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.errors) {
            console.error('Directus Errors:', JSON.stringify(error.errors, null, 2));
        }
    }
}

verify();
