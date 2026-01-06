
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const DIRECTUS_TOKEN = 'qolRjZQj-yoaxKaEnmPQ8HVcn_ngyNDs'; // From .env.local

const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(staticToken(DIRECTUS_TOKEN));

async function verify() {
    try {
        console.log('--- Verifying Directus Connection ---');
        const health = await directus.request(readItems('topics', { limit: 1 }));
        console.log('✅ Connection successful. Found topics:', health.length);

        console.log('\n--- Checking for Orphaned statement_topics ---');
        const stRecords = await directus.request(readItems('statement_topics', {
            fields: ['id', 'statement_id', 'topic_id'],
            limit: -1
        }));

        console.log(`Total statement_topics records: ${stRecords.length}`);

        const statements = await directus.request(readItems('statements', {
            fields: ['id'],
            limit: -1
        }));
        const stmtIds = new Set(statements.map(s => s.id));

        const topics = await directus.request(readItems('topics', {
            fields: ['id'],
            limit: -1
        }));
        const topicIds = new Set(topics.map(t => t.id));

        const orphans = stRecords.filter(st => !stmtIds.has(st.statement_id) || !topicIds.has(st.topic_id));

        if (orphans.length > 0) {
            console.log(`❌ Found ${orphans.length} orphaned statement_topics records!`);
            orphans.slice(0, 5).forEach(o => {
                const reason = !stmtIds.has(o.statement_id) ? 'Missing Statement' : 'Missing Topic';
                console.log(`  - ID: ${o.id}, Statement: ${o.statement_id}, Topic: ${o.topic_id} (${reason})`);
            });
        } else {
            console.log('✅ No orphaned statement_topics found.');
        }

        console.log('\n--- Checking Major Topics Content ---');
        const majorSlugs = ['tzadik', 'rasha', 'beinoni'];
        for (const slug of majorSlugs) {
            const topic = await directus.request(readItems('topics', {
                filter: { slug: { _eq: slug } },
                fields: ['id', 'canonical_title']
            }));

            if (topic.length > 0) {
                const t = topic[0];
                const count = stRecords.filter(st => st.topic_id === t.id).length;
                console.log(`Topic: ${t.canonical_title} (${slug}) - Sources: ${count}`);
            } else {
                console.log(`Topic: ${slug} - NOT FOUND`);
            }
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

verify();
