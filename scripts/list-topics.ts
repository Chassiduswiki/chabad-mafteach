import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const STATIC_TOKEN = 'Y2uEb9-2oyj8-DEn5eeJypUw7xUGuR96';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

async function listTopics() {
    try {
        const topics = await directus.request(readItems('topics', {
            fields: ['id', 'canonical_title', 'slug', 'topic_type'],
            limit: -1
        }));

        console.log(`Found ${topics.length} topics:`);
        topics.forEach(t => {
            console.log(`- [${t.id}] ${t.canonical_title} (${t.slug}) [${t.topic_type}]`);
        });
    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

listTopics();
