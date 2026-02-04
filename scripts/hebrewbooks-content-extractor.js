#!/usr/bin/env node

/**
 * HebrewBooks Content Extractor - Working Version
 * Uses already downloaded PDFs to extract content
 */

const fs = require('fs').promises;
const path = require('path');

// Import pdf-parse correctly
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  console.error('❌ pdf-parse not installed. Run: npm install pdf-parse');
  process.exit(1);
}

class HebrewBooksContentExtractor {
  constructor() {
    this.downloadsDir = process.cwd(); // Where we downloaded the PDFs
  }

  /**
   * Extract text from existing PDF file
   */
  async extractTextFromPdf(pdfPath) {
    console.log(`📖 Extracting text from: ${path.basename(pdfPath)}`);
    
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdfParse(dataBuffer);
      
      return {
        text: data.text,
        info: data.info,
        metadata: data.metadata,
        pageCount: data.numpages
      };
    } catch (error) {
      console.error(`❌ Failed to extract text from ${pdfPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get content from page 4 (already downloaded)
   */
  async getPage4Content() {
    const pdfPath = path.join(this.downloadsDir, 'derech_mitzvosecha_page4.pdf');
    
    try {
      const content = await this.extractTextFromPdf(pdfPath);
      
      return {
        bookId: 15419,
        pageNumber: 4,
        content: content.text,
        metadata: content.metadata,
        pageCount: content.pageCount,
        info: content.info
      };
    } catch (error) {
      console.error('❌ Failed to get page 4 content:', error.message);
      throw error;
    }
  }

  /**
   * Get full book content (already downloaded)
   */
  async getFullBookContent() {
    const pdfPath = path.join(this.downloadsDir, 'derech_mitzvosecha_full.pdf');
    
    try {
      const content = await this.extractTextFromPdf(pdfPath);
      
      return {
        bookId: 15419,
        content: content.text,
        metadata: content.metadata,
        pageCount: content.pageCount,
        info: content.info
      };
    } catch (error) {
      console.error('❌ Failed to get full book content:', error.message);
      throw error;
    }
  }

  /**
   * Search within extracted content
   */
  searchInContent(content, query, options = {}) {
    const { caseSensitive = false, wholeWord = false } = options;
    const flags = caseSensitive ? 'g' : 'gi';
    
    let pattern = query;
    if (wholeWord) {
      pattern = `\\b${query}\\b`;
    }
    
    const regex = new RegExp(pattern, flags);
    const matches = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        text: match[0],
        index: match.index,
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    return matches;
  }

  /**
   * Get specific pages by splitting full book content
   */
  async getPageFromFullBook(pageNumber) {
    const fullContent = await this.getFullBookContent();
    
    // Simple page splitting (this is approximate - real PDF pagination is complex)
    const lines = fullContent.content.split('\n');
    const linesPerPage = Math.ceil(lines.length / fullContent.pageCount);
    const startIndex = (pageNumber - 1) * linesPerPage;
    const endIndex = Math.min(startIndex + linesPerPage, lines.length);
    
    const pageLines = lines.slice(startIndex, endIndex);
    const pageContent = pageLines.join('\n');
    
    return {
      bookId: 15419,
      pageNumber,
      content: pageContent,
      estimatedFromFullBook: true
    };
  }
}

// Demo usage
async function main() {
  const extractor = new HebrewBooksContentExtractor();
  
  try {
    console.log('🚀 HebrewBooks Content Extractor - Using Downloaded PDFs\n');
    
    // Extract page 4 content
    console.log('📄 Extracting Page 4 Content:');
    const page4 = await extractor.getPage4Content();
    console.log(`✅ Page 4 extracted (${page4.content.length} chars, ${page4.pageCount} pages)`);
    console.log(`📝 First 200 chars: ${page4.content.substring(0, 200)}...\n`);
    
    // Search for specific terms
    console.log('🔍 Searching for "מצוה" in page 4:');
    const matches = extractor.searchInContent(page4.content, 'מצוה');
    console.log(`✅ Found ${matches.length} matches:`);
    matches.slice(0, 3).forEach((match, i) => {
      console.log(`   ${i + 1}. Line ${match.line}: "${match.text}"`);
    });
    
    // Extract full book content
    console.log('\n📚 Extracting Full Book Content:');
    const fullBook = await extractor.getFullBookContent();
    console.log(`✅ Full book extracted (${fullBook.content.length} chars, ${fullBook.pageCount} pages)`);
    
    // Search in full book
    console.log('\n🔍 Searching for "דרך" in full book:');
    const bookMatches = extractor.searchInContent(fullBook.content, 'דרך');
    console.log(`✅ Found ${bookMatches.length} matches in full book`);
    
    // Get specific page from full book
    console.log('\n📄 Getting Page 2 from full book:');
    const page2 = await extractor.getPageFromFullBook(2);
    console.log(`✅ Page 2 extracted (${page2.content.length} chars)`);
    console.log(`📝 First 200 chars: ${page2.content.substring(0, 200)}...`);
    
    console.log('\n🎉 Content extraction completed successfully!');
    console.log('\n📋 SUMMARY:');
    console.log(`   ✅ Page 4: ${page4.content.length} characters`);
    console.log(`   ✅ Full Book: ${fullBook.content.length} characters`);
    console.log(`   ✅ Total Pages: ${fullBook.pageCount}`);
    console.log(`   ✅ "מצוה" matches: ${matches.length}`);
    console.log(`   ✅ "דרך" matches: ${bookMatches.length}`);
    
  } catch (error) {
    console.error('💥 Extraction failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = HebrewBooksContentExtractor;

// Run demo if called directly
if (require.main === module) {
  main();
}
