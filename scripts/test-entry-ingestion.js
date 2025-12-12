#!/usr/bin/env node

// Test script for entry document ingestion
// Usage: node scripts/test-entry-ingestion.js

const fs = require('fs');
const path = require('path');

async function testEntryIngestion() {
  console.log('🧪 Testing Entry Document Ingestion System\n');

  // Test parsing one of the sample files
  const sampleFile = path.join(__dirname, '../data/Entries/emunah.md');

  try {
    console.log('📖 Reading sample file:', sampleFile);
    const content = fs.readFileSync(sampleFile, 'utf-8');

    console.log('✅ File read successfully');
    console.log('📊 File size:', content.length, 'characters');

    // Test frontmatter parsing
    console.log('\n🔍 Testing frontmatter parsing...');
    const frontmatterMatch = content.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]+([\s\S]*)$/);

    if (frontmatterMatch) {
      console.log('✅ Frontmatter found');
      const [, frontmatterStr] = frontmatterMatch;

      // Parse YAML frontmatter
      const frontmatter = {};
      const lines = frontmatterStr.split(/\r?\n/); // Handle both \n and \r\n
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();

        if (!key || !value) continue;

        switch (key.trim()) {
          case 'slug':
            frontmatter.slug = value.replace(/['"]/g, '');
            break;
          case 'name':
            frontmatter.name = value.replace(/['"]/g, '');
            break;
          case 'name_hebrew':
            frontmatter.name_hebrew = value.replace(/['"]/g, '');
            break;
          case 'category':
            frontmatter.category = value.replace(/['"]/g, '');
            break;
          case 'difficulty':
            frontmatter.difficulty = value;
            break;
          case 'status':
            frontmatter.status = value;
            break;
          case 'tags':
            const tagsMatch = value.match(/^\[(.+)\]$/);
            if (tagsMatch) {
              frontmatter.tags = tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
            }
            break;
        }
      }

      console.log('📋 Parsed frontmatter:');
      console.log('   - Slug:', frontmatter.slug);
      console.log('   - Name:', frontmatter.name);
      console.log('   - Category:', frontmatter.category);
      console.log('   - Difficulty:', frontmatter.difficulty);
      console.log('   - Status:', frontmatter.status);
      console.log('   - Tags:', frontmatter.tags);

      // Test content processing
      console.log('\n📝 Testing content processing...');
      const contentStr = frontmatterMatch[2].trim();
      const titleMatch = contentStr.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : frontmatter.name;

      console.log('✅ Title extracted:', title);

      // Test paragraph splitting
      const paragraphs = contentStr
        .split(/\n\s*\n/)
        .filter(p => p.trim().length > 0)
        .map(p => p.trim());

      console.log(`✅ Split into ${paragraphs.length} paragraphs`);

      // Test statement extraction from first paragraph
      if (paragraphs.length > 0) {
        const firstPara = paragraphs[0];
        const sentences = firstPara
          .split(/[.!?]+/)
          .map(s => s.trim())
          .filter(s => s.length > 10);

        console.log(`✅ First paragraph split into ${sentences.length} statements`);
        console.log('   Sample statement:', sentences[0]?.substring(0, 80) + '...');
      }

    } else {
      console.log('❌ No frontmatter found');
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start your development server');
    console.log('   2. Navigate to /editor/import');
    console.log('   3. Test the "Import Entry" button with this file');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testEntryIngestion();
