import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const STATIC_TOKEN = 'Y2uEb9-2oyj8-DEn5eeJypUw7xUGuR96';

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
