// Bulk import remaining v1.md entries
// Run with: node --input-type=module scripts/bulk-import.js

import { readFileSync } from 'fs';

const entries = JSON.parse(readFileSync('./scripts/parsed-entries.json', 'utf-8').split('\n').slice(4).join('\n'));

// Topic slug mapping
const topicMap = {
  'avodah': 9,
  'haskalah': 10,
  'havanah': 11,
  'hisbonenus': 12,
  'nefesh': 13,
  'nefesh-habehamis': 14,
  'nefesh-haelokis': 15,
  'nefesh-ruach-neshamah-chaya-yechidah': 16,
  'etzem-hanefesh': 17,
  'kochos-hanefesh': 18,
  'levushei-hanefesh': 19,
  'ahavas-hashem': 20,
  'yiras-hashem': 21,
  'kabbalas-ol': 22,
  'mesiras-nefesh': 23,
  'shtus': 24,
  'taam-vadaas': 25,
  'pnimiyus': 26,
  'chitzoniyus': 27,
  'seder-hishtalshelus': 28,
  'atzmus': 29,
  'tzimtzum': 30,
  'reshimu': 31,
  'kav': 32,
  'igulim': 33,
  'yosher': 34,
  'adam-kadmon': 35,
  'atzilus-beriyah-yetzirah-asiyah': 36,
  'sefirah': 37,
  'partzuf': 38,
  'parsa-masach': 39,
  'kelipah': 40
};

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z(•\d])/g)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

// Generate import data for each entry
const importData = entries.slice(1).map((entry, idx) => {
  const slug = slugify(entry.transliteration);
  const topicId = topicMap[slug];
  
  if (!topicId) {
    console.log(`Skip: ${entry.transliteration} (no topic)`);
    return null;
  }
  
  const docId = 241 + idx;
  let blockId = 507 + (idx * 10);
  let stmtId = 4853 + (idx * 50);
  
  const blocks = [];
  const statements = [];
  const statementTopics = [];
  let orderPos = 0;
  
  entry.sections.forEach(section => {
    orderPos += 10;
    const blockType = section.type === 'Definition' ? 'heading' : 'subheading';
    
    blocks.push({
      id: blockId,
      document_id: docId,
      block_type: blockType,
      order_key: orderPos.toString().padStart(4, '0'),
      order_position: orderPos,
      content: `<h3>${section.type}</h3>`
    });
    
    const sentences = splitSentences(section.content);
    sentences.forEach((text, i) => {
      statements.push({
        id: stmtId,
        block_id: blockId,
        order_key: `${orderPos.toString().padStart(4, '0')}.${(i + 1).toString().padStart(3, '0')}`,
        text: text,
        original_lang: 'en',
        status: 'published',
        importance_score: 0.7
      });
      
      statementTopics.push({
        statement_id: stmtId,
        topic_id: topicId,
        relevance_score: 0.9,
        is_primary: true
      });
      
      stmtId++;
    });
    
    blockId++;
  });
  
  return {
    entry: entry.transliteration,
    slug,
    topicId,
    document: {
      id: docId,
      title: `${entry.transliteration} (${entry.hebrew})`,
      doc_type: 'entry',
      original_lang: 'he',
      status: 'published',
      topic: topicId,
      source_format: 'manual_entry'
    },
    blocks,
    statements,
    statementTopics
  };
}).filter(Boolean);

console.log(JSON.stringify(importData, null, 2));
console.log(`\n// Total entries: ${importData.length}`);
console.log(`// Total statements: ${importData.reduce((sum, e) => sum + e.statements.length, 0)}`);
