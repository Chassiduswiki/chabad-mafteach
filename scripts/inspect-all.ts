import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const directusToken = process.env.DIRECTUS_STATIC_TOKEN;

if (!directusUrl || !directusToken) {
    console.error('❌ Error: DIRECTUS_URL or DIRECTUS_STATIC_TOKEN not found.');
    process.exit(1);
}

const client = createDirectus(directusUrl)
    .with(staticToken(directusToken))
    .with(rest());

async function inspect() {
    console.log('--- Directus Targeted Introspection ---');
    console.log('Target URL:', directusUrl);

    const collectionsToProbe = [
        'topics',
        'topic_translations',
        'documents',
        'paragraphs',
        'statements',
        'statement_topics',
        'authors',
        'content_blocks',
        'topic_categories',
        'categories',
        'sefarim',
        'books'
    ];

    for (const name of collectionsToProbe) {
        console.log(`\n--- Collection: [${name}] ---`);
        try {
            // Try to get count and sample item
            const items = await client.request(readItems(name as any, {
                limit: 1
            }));

            if (items && items.length > 0) {
                console.log(`✅ Status: Accessible`);
                console.log(`Sample Data:`, JSON.stringify(items[0], null, 2));
            } else {
                console.log(`✅ Status: Accessible (Empty)`);
            }

            // Try to get total count
            try {
                // Get count using limit -1 approach
                const countResult = await client.request(readItems(name as any, {
                    limit: -1,
                    fields: ['id']
                })) as any;
                console.log(`Total Records: ${countResult?.length ?? 'unknown'}`);
            } catch (countErr: any) {
                console.log(`Count Error: ${countErr.message}`);
            }

        } catch (err: any) {
            if (err.response?.status === 403) {
                console.log(`❌ Status: Forbidden (403)`);
            } else if (err.response?.status === 404) {
                console.log(`❌ Status: Not Found (404)`);
            } else {
                console.log(`❌ Status: Error - ${err.message}`);
            }
        }
    }
}

inspect().then(() => console.log('\n--- Introspection Complete ---'));
