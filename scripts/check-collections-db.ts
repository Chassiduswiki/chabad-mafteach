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
