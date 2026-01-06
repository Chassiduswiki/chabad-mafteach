import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const STATIC_TOKEN = 'Y2uEb9-2oyj8-DEn5eeJypUw7xUGuR96';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

async function checkFaith() {
    console.log("Checking Faith topic...");

    try {
        const topics = await directus.request(readItems('topics', {
            filter: { canonical_title: { _contains: 'אמונה' } },
            fields: ['id', 'canonical_title']
        }));

        if (topics.length === 0) {
            console.log("❌ Faith topic not found.");
            return;
        }

        const faithTopic = topics[0];
        console.log(`Found Faith Topic ID: ${faithTopic.id}`);

        const mappings = await directus.request(readItems('statement_topics' as any, {
            filter: { topic_id: { _eq: faithTopic.id } },
            fields: ['statement_id']
        }));

        console.log(`Faith topic has ${mappings.length} mappings.`);

        if (mappings.length > 0) {
            const stmtIds = mappings.map((m: any) => m.statement_id);
            const stmts = await directus.request(readItems('statements' as any, {
                filter: { id: { _in: stmtIds } },
                fields: ['id', 'text']
            }));

            console.log("\nStatements in Faith topic:");
            stmts.forEach((s: any) => {
                console.log(` - [${s.id}] ${s.text?.substring(0, 50)}...`);
            });
        }
    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

checkFaith();
