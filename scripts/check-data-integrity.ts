import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

const directus = createClient();

export async function checkDataIntegrity() {
  console.log('🔍 Checking data integrity issues...');

  try {
    // 1. Check for orphaned statement_topics records
    console.log('\n1. Checking statement_topics for orphaned records...');

    const statementTopics = await directus.request(
      readItems('statement_topics', {
        fields: ['id', 'statement_id', 'topic_id']
      })
    );

    const orphanedRecords: any[] = [];

    for (const record of statementTopics) {
      try {
        // Check if the referenced statement exists
        const statement = await directus.request(
          readItems('statements', {
            filter: { id: { _eq: record.statement_id } },
            fields: ['id'],
            limit: 1
          })
        );

        if (!statement || statement.length === 0) {
          orphanedRecords.push({
            statement_topics_id: record.id,
            missing_statement_id: record.statement_id,
            topic_id: record.topic_id
          });
        }
      } catch (error) {
        console.error(`Error checking statement ${record.statement_id}:`, error);
      }
    }

    if (orphanedRecords.length > 0) {
      console.log(`❌ Found ${orphanedRecords.length} orphaned statement_topics records:`);
      orphanedRecords.forEach(record => {
        console.log(`  - statement_topics.id: ${record.statement_topics_id}, missing statement_id: ${record.missing_statement_id}`);
      });
    } else {
      console.log('✅ No orphaned statement_topics records found');
    }

    // 2. Check for statements with invalid block_id references
    console.log('\n2. Checking statements for invalid block_id references...');

    const statements = await directus.request(
      readItems('statements', {
        fields: ['id', 'block_id']
      })
    );

    const invalidBlockRefs: any[] = [];

    for (const statement of statements) {
      try {
        // Check if the referenced content_block exists
        const contentBlock = await directus.request(
          readItems('content_blocks', {
            filter: { id: { _eq: statement.block_id } },
            fields: ['id'],
            limit: 1
          })
        );

        if (!contentBlock || contentBlock.length === 0) {
          invalidBlockRefs.push({
            statement_id: statement.id,
            invalid_block_id: statement.block_id
          });
        }
      } catch (error) {
        console.error(`Error checking content_block ${statement.block_id}:`, error);
      }
    }

    if (invalidBlockRefs.length > 0) {
      console.log(`❌ Found ${invalidBlockRefs.length} statements with invalid block_id references:`);
      invalidBlockRefs.forEach(record => {
        console.log(`  - statement.id: ${record.statement_id}, invalid block_id: ${record.invalid_block_id}`);
      });
    } else {
      console.log('✅ All statements have valid block_id references');
    }

    // 3. Summary
    console.log('\n📊 Data Integrity Summary:');
    console.log(`   - Total statement_topics records: ${statementTopics.length}`);
    console.log(`   - Orphaned statement_topics records: ${orphanedRecords.length}`);
    console.log(`   - Total statements: ${statements.length}`);
    console.log(`   - Statements with invalid block_id: ${invalidBlockRefs.length}`);

    return {
      orphanedRecords,
      invalidBlockRefs,
      summary: {
        totalStatementTopics: statementTopics.length,
        orphanedCount: orphanedRecords.length,
        totalStatements: statements.length,
        invalidBlockRefsCount: invalidBlockRefs.length
      }
    };

  } catch (error) {
    console.error('❌ Error during data integrity check:', error);
    throw error;
  }
}
