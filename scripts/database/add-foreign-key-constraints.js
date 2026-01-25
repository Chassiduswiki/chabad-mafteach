/**
 * Script to add foreign key constraints to critical tables in the Directus schema
 * 
 * This script adds missing foreign key constraints to ensure database integrity
 * and prevent orphaned records in the future.
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

async function addForeignKeyConstraints() {
  try {
    console.log('Connecting to PostgreSQL database...');
    await pgClient.connect();
    
    console.log('Adding foreign key constraints...');
    
    // 1. Add constraint from statement_topics.statement_id to statements.id
    await pgClient.query(`
      ALTER TABLE statement_topics 
      ADD CONSTRAINT statement_topics_statement_id_fkey 
      FOREIGN KEY (statement_id) 
      REFERENCES statements(id) 
      ON DELETE CASCADE;
    `).catch(err => {
      if (err.code === '23503') {
        console.error('Error: Orphaned records exist in statement_topics table');
        console.error('Please run the clean-orphaned-records.js script first');
      } else if (err.code === '42710') {
        console.log('Constraint statement_topics_statement_id_fkey already exists');
      } else {
        throw err;
      }
    });
    
    // 2. Add constraint from statement_topics.topic_id to topics.id
    await pgClient.query(`
      ALTER TABLE statement_topics 
      ADD CONSTRAINT statement_topics_topic_id_fkey 
      FOREIGN KEY (topic_id) 
      REFERENCES topics(id) 
      ON DELETE CASCADE;
    `).catch(err => {
      if (err.code === '42710') {
        console.log('Constraint statement_topics_topic_id_fkey already exists');
      } else {
        throw err;
      }
    });
    
    // 3. Add constraint from statements.block_id to content_blocks.id
    await pgClient.query(`
      ALTER TABLE statements 
      ADD CONSTRAINT statements_block_id_fkey 
      FOREIGN KEY (block_id) 
      REFERENCES content_blocks(id) 
      ON DELETE CASCADE;
    `).catch(err => {
      if (err.code === '23503') {
        console.error('Error: Orphaned records exist in statements table');
      } else if (err.code === '42710') {
        console.log('Constraint statements_block_id_fkey already exists');
      } else {
        throw err;
      }
    });
    
    // 4. Add constraint from source_links.statement_id to statements.id
    await pgClient.query(`
      ALTER TABLE source_links 
      ADD CONSTRAINT source_links_statement_id_fkey 
      FOREIGN KEY (statement_id) 
      REFERENCES statements(id) 
      ON DELETE SET NULL;
    `).catch(err => {
      if (err.code === '42710') {
        console.log('Constraint source_links_statement_id_fkey already exists');
      } else {
        throw err;
      }
    });
    
    // 5. Add constraint from source_links.source_id to sources.id
    await pgClient.query(`
      ALTER TABLE source_links 
      ADD CONSTRAINT source_links_source_id_fkey 
      FOREIGN KEY (source_id) 
      REFERENCES sources(id) 
      ON DELETE CASCADE;
    `).catch(err => {
      if (err.code === '42710') {
        console.log('Constraint source_links_source_id_fkey already exists');
      } else {
        throw err;
      }
    });
    
    // 6. Add constraint from source_links.topic_id to topics.id
    await pgClient.query(`
      ALTER TABLE source_links 
      ADD CONSTRAINT source_links_topic_id_fkey 
      FOREIGN KEY (topic_id) 
      REFERENCES topics(id) 
      ON DELETE CASCADE;
    `).catch(err => {
      if (err.code === '42710') {
        console.log('Constraint source_links_topic_id_fkey already exists');
      } else {
        throw err;
      }
    });
    
    console.log('Foreign key constraints added successfully!');
  } catch (error) {
    console.error('Error adding foreign key constraints:', error);
  } finally {
    await pgClient.end();
  }
}

// Run the script
addForeignKeyConstraints();
