import { createDirectus, rest, readItems } from '@directus/sdk';

const directus = createDirectus('https://directus-production-20db.up.railway.app').with(rest());

async function test() {
    try {
        console.log("Checking statements fields...");
        const stmts = await directus.request(readItems('statements' as any, { limit: 1 }));
        if (stmts.length > 0) {
            console.log("Sample statement:", JSON.stringify(stmts[0], null, 2));
        } else {
            console.log("No statements found.");
        }
    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

test();
