import { createClient } from '../lib/directus.js';
import { readItems } from '@directus/sdk';

const directus = createClient();

async function checkCitations() {
    try {
        console.log('Fetching statement_topics...');
        const st = await directus.request(readItems('statement_topics', {
            fields: ['topic_id', 'statement_id'],
            limit: 10
        }));
        console.log('Sample statement_topics:', JSON.stringify(st, null, 2));

        if (st.length > 0) {
            const topicIds = st.map(s => s.topic_id);
            const topics = await directus.request(readItems('topics', {
                filter: { id: { _in: topicIds } },
                fields: ['id', 'slug', 'canonical_title']
            }));
            console.log('Topics with citations:', JSON.stringify(topics, null, 2));
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

checkCitations();
