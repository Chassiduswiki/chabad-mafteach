#!/usr/bin/env node

/**
 * Import v1.md Chassidus Dictionary into Directus
 * 
 * This script:
 * 1. Parses v1.md structured entries
 * 2. Creates proper document hierarchy: documents → content_blocks → statements
 * 3. Links statements to topics via statement_topics
 * 
 * Usage: node import-v1-to-directus.js [--clean]
 */

import { createDirectus, rest, createItem, createItems, readItems, deleteItems } from '@directus/sdk';
import fs from 'fs/promises';
import path from 'path';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error('❌ DIRECTUS_TOKEN environment variable required');
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL).with(rest());

// Parse v1.md into structured entries
async function parseV1File(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const entries = [];
  let currentEntry = null;
  let currentSection = null;
  let currentText = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Entry header: "Entry: עבודה, Avodah"
    if (trimmed.startsWith('Entry:')) {
      if (currentEntry) {
        if (currentSection && currentText.length > 0) {
          currentEntry.sections.push({
            type: currentSection,
            content: currentText.join('\n').trim()
          });
        }
        entries.push(currentEntry);
      }
      
      const match = trimmed.match(/Entry:\s*([^,]+),\s*(.+)/);
      if (match) {
        currentEntry = {
          hebrew: match[1].trim(),
          transliteration: match[2].trim(),
          sections: []
        };
        currentSection = null;
        currentText = [];
      }
      continue;
    }
    
    // Section headers
    if (trimmed.endsWith(':') && !trimmed.includes(' ')) {
      if (currentSection && currentText.length > 0) {
        currentEntry.sections.push({
          type: currentSection,
          content: currentText.join('\n').trim()
        });
      }
      currentSection = trimmed.slice(0, -1);
      currentText = [];
      continue;
    }
    
    // Content lines
    if (trimmed && currentSection) {
      currentText.push(trimmed);
    }
  }
  
  // Add last entry
  if (currentEntry) {
    if (currentSection && currentText.length > 0) {
      currentEntry.sections.push({
        type: currentSection,
        content: currentText.join('\n').trim()
      });
    }
    entries.push(currentEntry);
  }
  
  return entries;
}

// Split content into sentences (statements)
function splitIntoStatements(text) {
  // Simple sentence splitting - can be improved
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return sentences;
}

// Find or create topic by canonical title
async function findOrCreateTopic(canonicalTitle, transliteration) {
  const slug = transliteration.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  const existing = await client.request(
    readItems('topics', {
      filter: { slug: { _eq: slug } },
      limit: 1
    })
  );
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Create new topic
  const topic = await client.request(
    createItem('topics', {
      canonical_title: canonicalTitle,
      canonical_title_transliteration: transliteration,
      slug: slug,
      topic_type: 'concept',
      original_lang: 'he',
      content_status: 'partial'
    })
  );
  
  return topic;
}

// Import a single entry
async function importEntry(entry) {
  console.log(`\n📝 Importing: ${entry.transliteration} (${entry.hebrew})`);
  
  // 1. Find or create topic
  const topic = await findOrCreateTopic(entry.hebrew, entry.transliteration);
  console.log(`  ✓ Topic ID: ${topic.id}`);
  
  // 2. Create document
  const document = await client.request(
    createItem('documents', {
      title: `${entry.transliteration} (${entry.hebrew}) - Dictionary Entry`,
      doc_type: 'entry',
      original_lang: 'he',
      status: 'published',
      topic: topic.id,
      source_format: 'manual_entry'
    })
  );
  console.log(`  ✓ Document ID: ${document.id}`);
  
  // 3. Create content blocks and statements
  let orderPosition = 0;
  let totalStatements = 0;
  
  for (const section of entry.sections) {
    orderPosition += 10;
    
    // Determine block type
    let blockType = 'paragraph';
    if (section.type === 'Definition') blockType = 'heading';
    else if (['Mashal', 'Personal Nimshal', 'Global Nimshal', 'Sources'].includes(section.type)) {
      blockType = 'subheading';
    }
    
    // Create content block
    const block = await client.request(
      createItem('content_blocks', {
        document_id: document.id,
        block_type: blockType,
        order_key: `${orderPosition}`,
        order_position: orderPosition,
        content: `<h3>${section.type}</h3>`
      })
    );
    
    console.log(`  ✓ Block: ${section.type} (ID: ${block.id})`);
    
    // Split into statements
    const sentences = splitIntoStatements(section.content);
    const statements = [];
    
    for (let i = 0; i < sentences.length; i++) {
      statements.push({
        block_id: block.id,
        order_key: `${orderPosition}.${i + 1}`,
        text: sentences[i],
        original_lang: 'en',
        status: 'published',
        importance_score: 0.5
      });
    }
    
    // Batch create statements
    if (statements.length > 0) {
      const createdStatements = await client.request(
        createItems('statements', statements)
      );
      
      totalStatements += createdStatements.length;
      
      // Link statements to topic
      const statementTopics = createdStatements.map(stmt => ({
        statement_id: stmt.id,
        topic_id: topic.id,
        relevance_score: 0.9,
        is_primary: true
      }));
      
      await client.request(createItems('statement_topics', statementTopics));
    }
  }
  
  console.log(`  ✅ Complete: ${totalStatements} statements created`);
  
  return { document, topic, statementCount: totalStatements };
}

// Clean existing data
async function cleanExistingData() {
  console.log('\n🧹 Cleaning existing data...');
  
  // Delete in reverse dependency order
  const collections = ['statement_topics', 'statements', 'content_blocks', 'documents'];
  
  for (const collection of collections) {
    const items = await client.request(readItems(collection, { fields: ['id'], limit: -1 }));
    if (items.length > 0) {
      const ids = items.map(item => item.id);
      await client.request(deleteItems(collection, ids));
      console.log(`  ✓ Deleted ${ids.length} items from ${collection}`);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const shouldClean = args.includes('--clean');
  
  console.log('🚀 v1.md Import Script');
  console.log(`📍 Directus: ${DIRECTUS_URL}`);
  
  if (shouldClean) {
    await cleanExistingData();
  }
  
  // Parse v1.md
  const v1Path = path.join(process.cwd(), 'data', 'v1.md');
  console.log(`\n📖 Parsing: ${v1Path}`);
  
  const entries = await parseV1File(v1Path);
  console.log(`  ✓ Found ${entries.length} entries`);
  
  // Import each entry
  const results = [];
  for (const entry of entries) {
    try {
      const result = await importEntry(entry);
      results.push(result);
    } catch (error) {
      console.error(`  ❌ Failed to import ${entry.transliteration}:`, error.message);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`Total entries processed: ${results.length}`);
  console.log(`Total statements created: ${results.reduce((sum, r) => sum + r.statementCount, 0)}`);
  console.log('✅ Import complete!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
