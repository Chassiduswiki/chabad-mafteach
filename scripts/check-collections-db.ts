import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const STATIC_TOKEN = 'Y2uEb9-2oyj8-DEn5eeJypUw7xUGuR96';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

async function checkCollections() {
    try {
        console.log("Checking for collection-related tables...");
        // This is a bit of a hack since we don't have schema access easily, 
        // we'll try to read from common names
        const tablesToTry = ['collections', 'topic_collections', 'user_collections'];

        for (const table of tablesToTry) {
            try {
                const items = await directus.request(readItems(table as any, { limit: 1 }));
                console.log(`✅ Table '${table}' exists. Found ${items.length} items.`);
            } catch (e: any) {
                console.log(`❌ Table '${table}' does not exist or access denied.`);
            }
        }
    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

checkCollections();
