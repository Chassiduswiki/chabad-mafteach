import { createClient } from '@/lib/directus';
import { readItems, deleteItems } from '@directus/sdk';

const directus = createClient();

export async function fixDataIntegrityIssues() {
  console.log('🔧 Starting data integrity fixes...');

  try {
    // 1. Fix orphaned statement_topics records
    console.log('\n1. Removing orphaned statement_topics records...');

    const statementTopics = await directus.request(
      readItems('statement_topics', {
        fields: ['id', 'statement_id', 'topic_id']
      })
    );

    const orphanedIds: string[] = [];

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
          orphanedIds.push(record.id);
          console.log(`  Found orphaned record: statement_topics.id=${record.id}, missing statement_id=${record.statement_id}`);
        }
      } catch (error) {
        console.error(`Error checking statement ${record.statement_id}:`, error);
      }
    }

    if (orphanedIds.length > 0) {
      console.log(`Removing ${orphanedIds.length} orphaned statement_topics records...`);

      // Delete orphaned records
      await directus.request(deleteItems('statement_topics', orphanedIds));

      console.log(`✅ Successfully removed ${orphanedIds.length} orphaned records`);
    } else {
      console.log('✅ No orphaned statement_topics records found');
    }

    // 2. Check for statements with invalid block_id references
    console.log('\n2. Checking statements with invalid block_id references...');

    const statements = await directus.request(
      readItems('statements', {
        fields: ['id', 'block_id', 'text']
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
            invalid_block_id: statement.block_id,
            statement_text: statement.text?.substring(0, 50) + '...'
          });
        }
      } catch (error) {
        console.error(`Error checking content_block ${statement.block_id}:`, error);
      }
    }

    if (invalidBlockRefs.length > 0) {
      console.log(`⚠️ Found ${invalidBlockRefs.length} statements with invalid block_id references:`);
      invalidBlockRefs.forEach(record => {
        console.log(`  - statement.id: ${record.statement_id}, invalid block_id: ${record.invalid_block_id}`);
        console.log(`    Text: ${record.statement_text}`);
      });

      console.log('\n⚠️ MANUAL ACTION REQUIRED: These statements reference non-existent content_blocks.');
      console.log('   You may need to:');
      console.log('   1. Find the correct content_block ID for each statement');
      console.log('   2. Update the block_id field');
      console.log('   3. Or delete the orphaned statements if they are no longer needed');

      // Optional: Create a backup/log of these records for manual review
      console.log('\n📝 Consider creating a backup before making manual changes.');
    } else {
      console.log('✅ All statements have valid block_id references');
    }

    // 3. Summary
    console.log('\n📊 Data Integrity Fix Summary:');
    console.log(`   - Orphaned statement_topics records removed: ${orphanedIds.length}`);
    console.log(`   - Statements with invalid block_id references: ${invalidBlockRefs.length}`);

    if (invalidBlockRefs.length === 0 && orphanedIds.length === 0) {
      console.log('🎉 All data integrity issues resolved!');
    } else if (orphanedIds.length > 0 && invalidBlockRefs.length === 0) {
      console.log('✅ Major data integrity issues resolved. Manual review may be needed for remaining issues.');
    } else {
      console.log('⚠️ Some issues require manual intervention. See details above.');
    }

    return {
      orphanedRecordsRemoved: orphanedIds.length,
      invalidBlockRefsFound: invalidBlockRefs.length,
      invalidBlockRefs: invalidBlockRefs
    };

  } catch (error) {
    console.error('❌ Error during data integrity fixes:', error);
    throw error;
  }
}

// Usage instructions
if (require.main === module) {
  console.log('🛠️ Data Integrity Fix Script');
  console.log('This script will:');
  console.log('1. Remove orphaned statement_topics records (automatic)');
  console.log('2. Identify statements with invalid block_id references (requires manual review)');
  console.log('');
  console.log('⚠️ IMPORTANT: Run this script in a staging environment first!');
  console.log('Consider backing up your database before running.');
  console.log('');

  // Uncomment the line below when ready to run
  // fixDataIntegrityIssues().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
}
