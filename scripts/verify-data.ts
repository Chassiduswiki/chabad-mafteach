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

async function verify() {
    console.log("--- Starting Data Verification ---");

    try {
        // 1. Check connection
        console.log("Checking connection to Directus...");
        const topics = await directus.request(readItems('topics', { limit: 1 }));
        console.log("✅ Connection successful. Found topics:", topics.length);

        // 1.1 Check documents
        console.log("Checking documents access...");
        const docs = await directus.request(readItems('documents' as any, { limit: 1 }));
        console.log("✅ Documents access successful. Found documents:", docs.length);

        // 2. Check statement_topics
        console.log("\nChecking statement_topics for orphans...");
        const statementTopics = await directus.request(readItems('statement_topics' as any, {
            fields: ['id', 'statement_id', 'topic_id'],
            limit: -1
        }));
        console.log(`Found ${statementTopics.length} total statement_topics.`);

        // 3. Check for specific orphans
        const orphans = statementTopics.filter((st: any) => !st.statement_id || !st.topic_id);
        if (orphans.length > 0) {
            console.log(`❌ Found ${orphans.length} orphaned statement_topics (missing IDs):`);
            console.log(JSON.stringify(orphans, null, 2));
        } else {
            console.log("✅ No statement_topics with missing IDs found.");
        }

        // 4. Verify parent existence for a sample
        if (statementTopics.length > 0) {
            console.log("\nVerifying parent existence for sample statement_topics...");
            const sample = statementTopics.slice(0, 5);
            for (const st of sample) {
                try {
                    const stmt = await directus.request(readItems('statements' as any, {
                        filter: { id: { _eq: st.statement_id } },
                        limit: 1
                    }));
                    const topic = await directus.request(readItems('topics', {
                        filter: { id: { _eq: st.topic_id } },
                        limit: 1
                    }));

                    const stmtOk = stmt && stmt.length > 0;
                    const topicOk = topic && topic.length > 0;

                    console.log(`Mapping ${st.id}: Statement ${st.statement_id} (${stmtOk ? '✅' : '❌'}), Topic ${st.topic_id} (${topicOk ? '✅' : '❌'})`);
                } catch (e: any) {
                    console.error(`Error verifying parents for mapping ${st.id}:`, e.message);
                }
            }
        }

    } catch (error: any) {
        console.error("\n❌ Verification failed:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        }
    }

    console.log("\n--- Verification Complete ---");
}

verify();
