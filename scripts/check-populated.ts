import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const STATIC_TOKEN = 'Y2uEb9-2oyj8-DEn5eeJypUw7xUGuR96';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

async function checkPopulated() {
    try {
        const topics = await directus.request(readItems('topics', {
            fields: ['id', 'canonical_title', 'content_status', 'sources_count'],
            limit: 5
        }));

        console.log("Topic status field check:");
        topics.forEach(t => {
            console.log(`- ${t.canonical_title}: status=${t.content_status}, sources=${t.sources_count}`);
        });
    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

checkPopulated();
