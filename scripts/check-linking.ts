import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const STATIC_TOKEN = 'Y2uEb9-2oyj8-DEn5eeJypUw7xUGuR96';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

async function checkLinking() {
    const targetTopics = ['Tzadik', 'Rasha', 'Beinoni'];
    console.log(`Checking linking for: ${targetTopics.join(', ')}`);

    try {
        for (const title of targetTopics) {
            console.log(`\n--- Topic: ${title} ---`);
            const topics = await directus.request(readItems('topics', {
                filter: { canonical_title: { _contains: title } },
                fields: ['id', 'canonical_title', 'slug']
            }));

            if (topics.length === 0) {
                console.log(`❌ Topic not found with title containing "${title}"`);
                continue;
            }

            for (const topic of topics) {
                console.log(`Found Topic ID: ${topic.id}, Slug: ${topic.slug}, Title: ${topic.canonical_title}`);

                const mappings = await directus.request(readItems('statement_topics' as any, {
                    filter: { topic_id: { _eq: topic.id } },
                    fields: ['id', 'statement_id']
                }));

                console.log(`Mappings found: ${mappings.length}`);

                if (mappings.length > 0) {
                    const stmtIds = mappings.map((m: any) => m.statement_id);
                    const stmts = await directus.request(readItems('statements' as any, {
                        filter: { id: { _in: stmtIds } },
                        fields: ['id', 'text']
                    }));

                    stmts.forEach((s: any) => {
                        console.log(` - [${s.id}] ${s.text?.substring(0, 50)}...`);
                    });
                }
            }
        }
    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

checkLinking();
