import { createDirectus, rest, authentication, createItem, createItems, readItems } from '@directus/sdk';
import fs from 'fs/promises';

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD;

if (!DIRECTUS_EMAIL || !DIRECTUS_PASSWORD) {
  console.error('❌ Set DIRECTUS_EMAIL and DIRECTUS_PASSWORD environment variables');
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL).with(authentication()).with(rest());

// Split text into sentences
function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z(•\d])/g)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

// Find or get topic by transliteration
async function getTopicBySlug(slug) {
  const topics = await client.request(
    readItems('topics', {
      filter: { slug: { _eq: slug } },
      limit: 1
    })
  );
  return topics[0] || null;
}

// Import single entry
async function importEntry(entry, index, total) {
  const slug = entry.transliteration.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  console.log(`\n[${index + 1}/${total}] ${entry.transliteration} (${entry.hebrew})`);
  
  // Get topic
  const topic = await getTopicBySlug(slug);
  if (!topic) {
    console.log(`  ⚠️  Topic not found: ${slug}`);
    return null;
  }
  console.log(`  ✓ Topic ID: ${topic.id}`);
  
  // Create document
  const document = await client.request(
    createItem('documents', {
      title: `${entry.transliteration} (${entry.hebrew})`,
      doc_type: 'entry',
      original_lang: 'he',
      status: 'published',
      topic: topic.id,
      source_format: 'manual_entry'
    })
  );
  console.log(`  ✓ Document ID: ${document.id}`);
  
  // Process sections
  let orderPosition = 0;
  let totalStatements = 0;
  const allStatementIds = [];
  
  for (const section of entry.sections) {
    orderPosition += 10;
    
    // Determine block type
    let blockType = 'paragraph';
    if (section.type === 'Definition') {
      blockType = 'heading';
    } else if (['Mashal', 'Personal Nimshal', 'Global Nimshal', 'Nimshal', 'Sources', 'Introduction'].includes(section.type)) {
      blockType = 'subheading';
    }
    
    // Create content block
    const block = await client.request(
      createItem('content_blocks', {
        document_id: document.id,
        block_type: blockType,
        order_key: `${orderPosition.toString().padStart(4, '0')}`,
        order_position: orderPosition,
        content: `<h3>${section.type}</h3>`
      })
    );
    
    // Split into statements
    const sentences = splitIntoSentences(section.content);
    if (sentences.length === 0) continue;
    
    const statements = sentences.map((text, i) => ({
      block_id: block.id,
      order_key: `${orderPosition.toString().padStart(4, '0')}.${(i + 1).toString().padStart(3, '0')}`,
      text: text,
      original_lang: 'en',
      status: 'published',
      importance_score: 0.7
    }));
    
    // Batch create statements
    const createdStatements = await client.request(
      createItems('statements', statements)
    );
    
    totalStatements += createdStatements.length;
    allStatementIds.push(...createdStatements.map(s => s.id));
    
    console.log(`  ✓ ${section.type}: ${createdStatements.length} statements`);
  }
  
  // Link all statements to topic
  if (allStatementIds.length > 0) {
    const statementTopics = allStatementIds.map(stmtId => ({
      statement_id: stmtId,
      topic_id: topic.id,
      relevance_score: 0.9,
      is_primary: true
    }));
    
    await client.request(createItems('statement_topics', statementTopics));
    console.log(`  ✅ Linked ${allStatementIds.length} statements to topic`);
  }
  
  return { document, topic, statementCount: totalStatements };
}

// Main
async function main() {
  console.log('🚀 v1.md Import to Directus\n');
  
  // Login
  await client.login(DIRECTUS_EMAIL, DIRECTUS_PASSWORD);
  console.log('✓ Authenticated\n');
  
  // Load parsed entries
  const data = await fs.readFile('./scripts/parsed-entries.json', 'utf-8');
  const lines = data.split('\n');
  const jsonData = lines.slice(4).join('\n'); // Skip warning lines
  const entries = JSON.parse(jsonData);
  
  console.log(`Found ${entries.length} entries\n`);
  console.log('='.repeat(60));
  
  // Import each
  const results = [];
  for (let i = 0; i < entries.length; i++) {
    try {
      const result = await importEntry(entries[i], i, entries.length);
      if (result) results.push(result);
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`Entries processed: ${results.length}/${entries.length}`);
  console.log(`Total statements: ${results.reduce((sum, r) => sum + r.statementCount, 0)}`);
  console.log('\n✅ Import complete!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
