import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

if (!DIRECTUS_URL || !STATIC_TOKEN) {
    console.error('❌ Error: DIRECTUS_URL and DIRECTUS_STATIC_TOKEN must be set in environment.');
    process.exit(1);
}

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
