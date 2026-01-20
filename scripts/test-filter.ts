import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const STATIC_TOKEN = 'Y2uEb9-2oyj8-DEn5eeJypUw7xUGuR96';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

async function testFilter() {
    try {
        console.log("Testing filter: topics with statement_topics...");

        // Try filtering by relationship existence
        const topics = await directus.request(readItems('topics', {
            filter: {
                statement_topics: {
                    id: { _nnull: true }
                }
            } as any,
            fields: ['id', 'canonical_title'],
            limit: 5
        }));

        console.log(`Found ${topics.length} topics with content.`);
        topics.forEach(t => console.log(`- ${t.canonical_title}`));

    } catch (error: any) {
        console.error("Filter test failed:", error.message);
        if (error.response) {
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testFilter();
