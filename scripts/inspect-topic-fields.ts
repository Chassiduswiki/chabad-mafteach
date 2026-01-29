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

async function inspectFields() {
    try {
        console.log("Inspecting topic fields...");
        const topics = await directus.request(readItems('topics', { limit: 1 }));
        if (topics.length > 0) {
            console.log("Available fields on topic:", Object.keys(topics[0]));
            console.log("Sample topic metadata:", JSON.stringify(topics[0].metadata, null, 2));
        }
    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

inspectFields();
