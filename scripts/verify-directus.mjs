import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const directusToken = process.env.DIRECTUS_STATIC_TOKEN || 'Y2uEb9-2oyj8-DEn5eeJypUw7xUGuR96';

console.log('--- Directus Connectivity Diagnostic ---');
console.log('URL:', directusUrl);
console.log('Token (first 5 chars):', directusToken.substring(0, 5) + '...');

if (!directusUrl) {
    console.error('❌ Error: DIRECTUS_URL not found in environment.');
    process.exit(1);
}

const client = createDirectus(directusUrl)
    .with(staticToken(directusToken))
    .with(rest());

const collectionsToTest = [
    'documents',
    'paragraphs',
    'statements',
    'topics',
    'statement_topics',
    'authors'
];

async function verify() {
    for (const collection of collectionsToTest) {
        try {
            process.stdout.write(`Testing [${collection}]... `);
            const items = await client.request(readItems(collection, { limit: 1 }));
            console.log(`✅ OK (${items.length} items found)`);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('❌ 401 Unauthorized (Invalid Token)');
            } else if (error.response?.status === 403) {
                console.log('❌ 403 Forbidden (Insufficient Permissions)');
            } else {
                console.log(`❌ Error: ${error.message || 'Unknown error'}`);
            }
        }
    }
}

verify().then(() => console.log('--- Diagnostic Complete ---'));
