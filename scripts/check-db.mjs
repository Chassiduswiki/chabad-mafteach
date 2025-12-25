
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(staticToken(DIRECTUS_TOKEN));

async function check() {
    try {
        console.log('Checking statement_topics...');
        const st = await directus.request(readItems('statement_topics', {
            fields: ['id', 'topic_id', 'statement_id'],
            limit: 50
        }));
        console.log(`Found ${st.length} links.`);
        if (st.length > 0) {
            console.log('Sample links:', st);
            const topicIds = [...new Set(st.map(s => s.topic_id))];
            const topics = await directus.request(readItems('topics', {
                filter: { id: { _in: topicIds } },
                fields: ['id', 'slug', 'canonical_title']
            }));
            console.log('Topics with links:', topics.map(t => `${t.canonical_title} (${t.slug})`));
        } else {
            console.log('No statement_topics found. Let me check if ANY exist.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

check();
