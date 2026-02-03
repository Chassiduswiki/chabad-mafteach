/**
 * Generate Embeddings Script
 * One-time migration to generate embeddings for all existing topics and statements
 *
 * Usage: npx tsx scripts/generate-embeddings.ts
 *
 * Options:
 *   --collection=topics|statements|all  (default: all)
 *   --batch-size=N                      (default: 50)
 *   --dry-run                           (preview without saving)
 *   --resume                            (skip items with existing embeddings)
 */

import { createClient } from '../lib/directus';
import { readItems } from '@directus/sdk';
import {
  generateEmbedding,
  prepareTextForEmbedding,
  estimateEmbeddingCost,
} from '../lib/vector/embedding-service';
import {
  storeTopicEmbedding,
  storeStatementEmbedding,
  getItemsWithoutEmbeddings,
} from '../lib/vector/pgvector-client';

const directus = createClient();

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  collection: 'all' as 'topics' | 'statements' | 'all',
  batchSize: 50,
  dryRun: false,
  resume: true, // Default to resume mode to avoid regenerating
};

for (const arg of args) {
  if (arg.startsWith('--collection=')) {
    const value = arg.split('=')[1] as 'topics' | 'statements' | 'all';
    if (['topics', 'statements', 'all'].includes(value)) {
      options.collection = value;
    }
  } else if (arg.startsWith('--batch-size=')) {
    options.batchSize = parseInt(arg.split('=')[1]);
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--no-resume') {
    options.resume = false;
  }
}

// Logging utilities
const log = {
  info: (msg: string) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  success: (msg: string) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`),
  progress: (current: number, total: number, msg: string) => {
    const percent = ((current / total) * 100).toFixed(1);
    console.log(`[PROGRESS] ${percent}% (${current}/${total}) - ${msg}`);
  },
};

// Statistics tracker
const stats = {
  topics: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
  statements: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
  totalCost: 0,
  startTime: Date.now(),
};

/**
 * Process topics
 */
async function processTopics() {
  log.info('Starting topic processing...');

  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      // Fetch batch of topics without embeddings
      const topics = await getItemsWithoutEmbeddings('topics', options.batchSize, offset);

      if (topics.length === 0) {
        hasMore = false;
        break;
      }

      log.info(`Processing batch of ${topics.length} topics (offset: ${offset})`);

      for (const topic of topics) {
        stats.topics.processed++;

        try {
          // Prepare text for embedding
          const text = prepareTextForEmbedding({
            canonical_title: topic.canonical_title,
            description: topic.description,
            overview: topic.overview,
          });

          if (!text.trim()) {
            log.error(`Topic ${topic.id} has no content to embed, skipping`);
            stats.topics.skipped++;
            continue;
          }

          // Estimate cost
          const cost = estimateEmbeddingCost(text);
          stats.totalCost += cost;

          if (options.dryRun) {
            log.info(`[DRY RUN] Would generate embedding for topic: ${topic.canonical_title}`);
            stats.topics.succeeded++;
            continue;
          }

          // Generate embedding
          const embeddingResponse = await generateEmbedding({ text });

          // Store embedding
          await storeTopicEmbedding(
            topic.id,
            embeddingResponse.embedding,
            embeddingResponse.model
          );

          log.success(`Generated embedding for topic: ${topic.canonical_title} (${topic.id})`);
          stats.topics.succeeded++;

          // Progress update every 10 items
          if (stats.topics.processed % 10 === 0) {
            log.progress(
              stats.topics.processed,
              stats.topics.processed + topics.length,
              'Topics processed'
            );
          }
        } catch (error) {
          log.error(`Failed to process topic ${topic.id}: ${error}`);
          stats.topics.failed++;
        }
      }

      offset += options.batchSize;

      // Rate limiting: wait 1 second between batches to avoid overwhelming the API
      if (hasMore && !options.dryRun) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      log.error(`Error fetching topics batch at offset ${offset}: ${error}`);
      break;
    }
  }

  log.info('Topic processing complete');
}

/**
 * Process statements
 */
async function processStatements() {
  log.info('Starting statement processing...');

  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      // Fetch batch of statements without embeddings
      const statements = await getItemsWithoutEmbeddings('statements', options.batchSize, offset);

      if (statements.length === 0) {
        hasMore = false;
        break;
      }

      log.info(`Processing batch of ${statements.length} statements (offset: ${offset})`);

      for (const statement of statements) {
        stats.statements.processed++;

        try {
          // Prepare text for embedding
          const text = prepareTextForEmbedding({
            text: statement.text,
          });

          if (!text.trim()) {
            log.error(`Statement ${statement.id} has no content to embed, skipping`);
            stats.statements.skipped++;
            continue;
          }

          // Estimate cost
          const cost = estimateEmbeddingCost(text);
          stats.totalCost += cost;

          if (options.dryRun) {
            log.info(`[DRY RUN] Would generate embedding for statement: ${statement.id}`);
            stats.statements.succeeded++;
            continue;
          }

          // Generate embedding
          const embeddingResponse = await generateEmbedding({ text });

          // Store embedding
          await storeStatementEmbedding(
            statement.id,
            embeddingResponse.embedding,
            embeddingResponse.model
          );

          log.success(`Generated embedding for statement: ${statement.id}`);
          stats.statements.succeeded++;

          // Progress update every 10 items
          if (stats.statements.processed % 10 === 0) {
            log.progress(
              stats.statements.processed,
              stats.statements.processed + statements.length,
              'Statements processed'
            );
          }
        } catch (error) {
          log.error(`Failed to process statement ${statement.id}: ${error}`);
          stats.statements.failed++;
        }
      }

      offset += options.batchSize;

      // Rate limiting: wait 1 second between batches
      if (hasMore && !options.dryRun) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      log.error(`Error fetching statements batch at offset ${offset}: ${error}`);
      break;
    }
  }

  log.info('Statement processing complete');
}

/**
 * Print final statistics
 */
function printStats() {
  const elapsedSeconds = (Date.now() - stats.startTime) / 1000;
  const elapsedMinutes = (elapsedSeconds / 60).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('EMBEDDING GENERATION SUMMARY');
  console.log('='.repeat(60));

  console.log('\nTopics:');
  console.log(`  Processed: ${stats.topics.processed}`);
  console.log(`  Succeeded: ${stats.topics.succeeded}`);
  console.log(`  Failed: ${stats.topics.failed}`);
  console.log(`  Skipped: ${stats.topics.skipped}`);

  console.log('\nStatements:');
  console.log(`  Processed: ${stats.statements.processed}`);
  console.log(`  Succeeded: ${stats.statements.succeeded}`);
  console.log(`  Failed: ${stats.statements.failed}`);
  console.log(`  Skipped: ${stats.statements.skipped}`);

  console.log('\nOverall:');
  console.log(`  Total processed: ${stats.topics.processed + stats.statements.processed}`);
  console.log(`  Total succeeded: ${stats.topics.succeeded + stats.statements.succeeded}`);
  console.log(`  Total failed: ${stats.topics.failed + stats.statements.failed}`);
  console.log(`  Total skipped: ${stats.topics.skipped + stats.statements.skipped}`);
  console.log(`  Estimated cost: $${stats.totalCost.toFixed(4)}`);
  console.log(`  Time elapsed: ${elapsedMinutes} minutes`);

  console.log('\n' + '='.repeat(60));

  if (options.dryRun) {
    console.log('\n[DRY RUN] No changes were made to the database.');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('EMBEDDING GENERATION SCRIPT');
  console.log('='.repeat(60));
  console.log(`\nOptions:`);
  console.log(`  Collection: ${options.collection}`);
  console.log(`  Batch size: ${options.batchSize}`);
  console.log(`  Dry run: ${options.dryRun}`);
  console.log(`  Resume mode: ${options.resume}`);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    if (options.collection === 'all' || options.collection === 'topics') {
      await processTopics();
    }

    if (options.collection === 'all' || options.collection === 'statements') {
      await processStatements();
    }

    printStats();

    process.exit(0);
  } catch (error) {
    log.error(`Fatal error: ${error}`);
    printStats();
    process.exit(1);
  }
}

// Run the script
main();
