import { createDirectus, rest, readItems } from '@directus/sdk';

const directus = createDirectus('https://directus-production-20db.up.railway.app').with(rest());

async function test() {
    const collections = ['topics', 'documents', 'content_blocks', 'statements'];

    for (const collection of collections) {
        try {
            console.log(`Testing collection: ${collection}...`);
            const results = await directus.request(readItems(collection as any, { limit: 1 }));
            console.log(`✅ ${collection} success: found ${results.length} items.`);
        } catch (error: any) {
            console.error(`❌ ${collection} failed:`, error.message);
            if (error.response) {
                console.error(`Status: ${error.response.status}`);
            }
        }
    }
}

test();
