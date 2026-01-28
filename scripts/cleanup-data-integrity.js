const { createDirectus, rest, staticToken, readItems, deleteItems } = require('@directus/sdk');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Directus client configuration
const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const directusToken = process.env.DIRECTUS_STATIC_TOKEN;

if (!directusToken) {
    throw new Error('DIRECTUS_STATIC_TOKEN environment variable is not set. Please configure .env file.');
}

if (!directusUrl) {
    throw new Error('DIRECTUS_URL environment variable is not set. Please configure .env file.');
}

const directus = createDirectus(directusUrl)
    .with(staticToken(directusToken))
    .with(rest());

/**
 * Data Integrity Cleanup Script
 *
 * Fixes orphaned records in statement_topics table that reference non-existent statements.
 * This script should be run after database migrations or when data corruption is detected.
 */

async function cleanupOrphanedStatementTopics() {
    console.log('🔍 Checking for orphaned statement_topics records...');

    try {
        // Get all statement_topics
        const statementTopics = await directus.request(readItems('statement_topics', {
            fields: ['id', 'statement_id', 'topic_id']
        }));

        // Get all valid statement IDs
        const statements = await directus.request(readItems('statements', {
            fields: ['*'],
            limit: -1
        }));

        const validStatementIds = new Set(statements.map(s => s.id));

        console.log(`Debug: Total statementTopics: ${statementTopics.length}`);
        console.log(`Debug: Total validStatementIds: ${validStatementIds.size}`);
        if (statementTopics.length > 0) console.log(`Debug: First statementTopic statement_id: ${statementTopics[0].statement_id}`);
        if (statements.length > 0) console.log(`Debug: First valid statement id: ${statements[0].id}`);

        // Find orphaned records
        const orphanedRecords = statementTopics.filter(st => {
            const exists = validStatementIds.has(st.statement_id);
            if (!exists) console.log(`Debug: Found orphan statement_id: ${st.statement_id}`);
            return !exists;
        });

        if (orphanedRecords.length === 0) {
            console.log('✅ No orphaned records found.');
            return;
        }

        console.log(`🚨 Found ${orphanedRecords.length} orphaned records:`);
        orphanedRecords.forEach(record => {
            console.log(`  - ID ${record.id}: statement_id ${record.statement_id} (non-existent)`);
        });

        // Delete orphaned records
        console.log('🗑️ Deleting orphaned records...');
        const orphanedIds = orphanedRecords.map(r => r.id);

        await directus.request(deleteItems('statement_topics', orphanedIds));

        console.log(`✅ Successfully deleted ${orphanedIds.length} orphaned records.`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    }
}

async function validateDataIntegrity() {
    console.log('🔍 Validating data integrity...');

    try {
        // Check statement_topics references
        const statementTopics = await directus.request(readItems('statement_topics', {
            fields: ['id', 'statement_id', 'topic_id']
        }));

        const topics = await directus.request(readItems('topics', {
            fields: ['id']
        }));

        const statements = await directus.request(readItems('statements', {
            fields: ['*'],
            limit: -1
        }));

        const validTopicIds = new Set(topics.map(t => t.id));
        const validStatementIds = new Set(statements.map(s => s.id));

        let issues = 0;

        // Check for invalid topic references
        const invalidTopicRefs = statementTopics.filter(st => !validTopicIds.has(st.topic_id));
        if (invalidTopicRefs.length > 0) {
            console.log(`🚨 Found ${invalidTopicRefs.length} statement_topics with invalid topic_id references`);
            issues++;
        }

        // Check for invalid statement references
        const invalidStatementRefs = statementTopics.filter(st => !validStatementIds.has(st.statement_id));
        if (invalidStatementRefs.length > 0) {
            console.log(`🚨 Found ${invalidStatementRefs.length} statement_topics with invalid statement_id references`);
            if (invalidStatementRefs.length > 0) {
                console.log(`Debug: First few invalid statement_ids: ${invalidStatementRefs.slice(0, 3).map(r => r.statement_id).join(', ')}`);
            }
            issues++;
        }

        // Check statements without valid paragraphs
        const statementsWithInvalidParagraphs = statements.filter(s => !s.paragraph_id);
        if (statementsWithInvalidParagraphs.length > 0) {
            console.log(`⚠️ Found ${statementsWithInvalidParagraphs.length} statements without paragraph_id`);
        }

        if (issues === 0) {
            console.log('✅ Data integrity validation passed.');
        } else {
            console.log(`🚨 Found ${issues} data integrity issues.`);
        }

        return issues === 0;

    } catch (error) {
        console.error('❌ Error during validation:', error);
        throw error;
    }
}

// Main execution
async function main() {
    console.log('🛠️ Starting data integrity cleanup...\n');

    try {
        const isValid = await validateDataIntegrity();

        if (!isValid) {
            console.log('\n🧹 Running cleanup...');
            await cleanupOrphanedStatementTopics();
            console.log('\n🔄 Re-validating after cleanup...');
            await validateDataIntegrity();
        }

        console.log('\n✅ Data integrity cleanup completed successfully.');

    } catch (error) {
        console.error('\n❌ Data integrity cleanup failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { cleanupOrphanedStatementTopics, validateDataIntegrity };
