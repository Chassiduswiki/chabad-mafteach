import { createDirectus, rest, readItems } from '@directus/sdk';

const directus = createDirectus('https://directus-production-20db.up.railway.app').with(rest());

async function test() {
    try {
        console.log("Checking content_blocks fields...");
        const blocks = await directus.request(readItems('content_blocks' as any, { limit: 1 }));
        if (blocks.length > 0) {
            console.log("Sample content_block:", JSON.stringify(blocks[0], null, 2));
        } else {
            console.log("No content_blocks found.");
        }

        console.log("\nChecking documents fields...");
        const docs = await directus.request(readItems('documents' as any, { limit: 1 }));
        if (docs.length > 0) {
            console.log("Sample document:", JSON.stringify(docs[0], null, 2));
        } else {
            console.log("No documents found.");
        }
    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

test();
