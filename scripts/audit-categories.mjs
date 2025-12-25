
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
    console.error('Missing DIRECTUS_URL or DIRECTUS_STATIC_TOKEN');
    process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(staticToken(DIRECTUS_TOKEN));

async function audit() {
    try {
        console.log('--- Auditing Topics ---');
        const topics = await directus.request(readItems('topics', {
            fields: ['id', 'canonical_title', 'topic_type'],
            limit: 100
        }));

        const types = {};
        topics.forEach(t => {
            types[t.topic_type] = (types[t.topic_type] || 0) + 1;
        });
        console.log('Topic Types found:', types);
        console.log('Sample Topics:', topics.slice(0, 10).map(t => `${t.canonical_title} (${t.topic_type})`));

        console.log('\n--- Auditing Topic Relationships ---');
        try {
            const rels = await directus.request(readItems('topic_relationships', {
                fields: ['id', 'relation_type', 'parent_topic_id.canonical_title', 'child_topic_id.canonical_title'],
                limit: 20
            }));
            console.log('Sample Relationships:', rels.map(r => `${r.parent_topic_id?.canonical_title} -> ${r.child_topic_id?.canonical_title} (${r.relation_type})`));
        } catch (e) {
            console.log('Could not fetch topic_relationships:', e.message);
        }

        console.log('\n--- Auditing Document Categories ---');
        const docs = await directus.request(readItems('documents', {
            fields: ['id', 'title', 'category', 'doc_type'],
            limit: 100
        }));
        const docCats = {};
        docs.forEach(d => {
            if (d.category) docCats[d.category] = (docCats[d.category] || 0) + 1;
        });
        console.log('Document Categories found (from documents table):', docCats);

    } catch (error) {
        console.error('Audit failed:', error.message);
    }
}

audit();
