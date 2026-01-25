/**
 * Script to clean up orphaned records in the statement_topics table
 * 
 * This script identifies and removes orphaned records in the statement_topics table
 * that reference non-existent statement IDs.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');

// Configuration
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'directus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Create PostgreSQL client
const pgClient = new Client(pgConfig);

async function cleanOrphanedRecords() {
  try {
    console.log('Connecting to PostgreSQL database...');
    await pgClient.connect();
    
    console.log('Finding orphaned records in statement_topics table...');
    
    // Find orphaned records in statement_topics table
    const orphanedRecordsResult = await pgClient.query(`
      SELECT st.id, st.statement_id, st.topic_id
      FROM statement_topics st
      LEFT JOIN statements s ON st.statement_id = s.id
      WHERE s.id IS NULL AND st.statement_id IS NOT NULL;
    `);
    
    const orphanedRecords = orphanedRecordsResult.rows;
    console.log(`Found ${orphanedRecords.length} orphaned records in statement_topics table.`);
    
    if (orphanedRecords.length > 0) {
      console.log('Orphaned statement_topics records:');
      console.table(orphanedRecords);
      
      // Prompt for confirmation before deleting
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to delete these orphaned records? (yes/no): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() === 'yes') {
        // Delete orphaned records
        const orphanedIds = orphanedRecords.map(record => record.id);
        
        const deleteResult = await pgClient.query(`
          DELETE FROM statement_topics
          WHERE id IN (${orphanedIds.join(',')});
        `);
        
        console.log(`Deleted ${deleteResult.rowCount} orphaned records from statement_topics table.`);
      } else {
        console.log('No records were deleted.');
      }
    }
    
    // Check for orphaned records in source_links table
    console.log('Finding orphaned records in source_links table...');
    
    const orphanedSourceLinksResult = await pgClient.query(`
      SELECT sl.id, sl.statement_id, sl.source_id, sl.topic_id
      FROM source_links sl
      LEFT JOIN statements s ON sl.statement_id = s.id
      WHERE s.id IS NULL AND sl.statement_id IS NOT NULL;
    `);
    
    const orphanedSourceLinks = orphanedSourceLinksResult.rows;
    console.log(`Found ${orphanedSourceLinks.length} orphaned records in source_links table.`);
    
    if (orphanedSourceLinks.length > 0) {
      console.log('Orphaned source_links records:');
      console.table(orphanedSourceLinks);
      
      // Prompt for confirmation before updating
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to set statement_id to NULL for these orphaned records? (yes/no): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() === 'yes') {
        // Update orphaned records by setting statement_id to NULL
        const orphanedIds = orphanedSourceLinks.map(record => record.id);
        
        const updateResult = await pgClient.query(`
          UPDATE source_links
          SET statement_id = NULL
          WHERE id IN (${orphanedIds.join(',')});
        `);
        
        console.log(`Updated ${updateResult.rowCount} orphaned records in source_links table.`);
      } else {
        console.log('No records were updated.');
      }
    }
    
    // Check for statements with invalid block_id
    console.log('Finding statements with invalid block_id...');
    
    const orphanedStatementsResult = await pgClient.query(`
      SELECT s.id, s.text, s.block_id
      FROM statements s
      LEFT JOIN content_blocks cb ON s.block_id = cb.id
      WHERE cb.id IS NULL AND s.block_id IS NOT NULL;
    `);
    
    const orphanedStatements = orphanedStatementsResult.rows;
    console.log(`Found ${orphanedStatements.length} statements with invalid block_id.`);
    
    if (orphanedStatements.length > 0) {
      console.log('Statements with invalid block_id:');
      console.table(orphanedStatements);
      
      // Prompt for confirmation before updating
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to set block_id to NULL for these statements? (yes/no): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() === 'yes') {
        // Update orphaned statements by setting block_id to NULL
        const orphanedIds = orphanedStatements.map(record => record.id);
        
        const updateResult = await pgClient.query(`
          UPDATE statements
          SET block_id = NULL
          WHERE id IN (${orphanedIds.join(',')});
        `);
        
        console.log(`Updated ${updateResult.rowCount} statements with invalid block_id.`);
      } else {
        console.log('No statements were updated.');
      }
    }
    
    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error cleaning orphaned records:', error);
  } finally {
    await pgClient.end();
  }
}

// Run the script
cleanOrphanedRecords();
