#!/usr/bin/env node

/**
 * HebrewBooks PDF Content Extractor
 * Uses reliable PDF downloads with optional Playwright for metadata
 */

const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse'); // npm install pdf-parse

class HebrewBooksPDFExtractor {
  constructor() {
    this.cacheDir = path.join(process.cwd(), '.cache', 'hebrewbooks');
    this.metadataCache = new Map();
  }

  /**
   * Get PDF URL for a specific page
   */
  getPagePdfUrl(bookId, pageNumber) {
    return `https://hebrewbooks.org/pagefeed/hebrewbooks_org_${bookId}_${pageNumber}.pdf`;
  }

  /**
   * Get full book PDF URL
   */
  getFullPdfUrl(bookId) {
    return `https://download.hebrewbooks.org/downloadhandler.ashx?req=${bookId}`;
  }

  /**
   * Download PDF with caching
   */
  async downloadPdf(url, filename) {
    const cachePath = path.join(this.cacheDir, filename);
    
    // Check cache first
    try {
      const stats = await fs.stat(cachePath);
      console.log(`📁 Using cached PDF: ${filename}`);
      return cachePath;
    } catch (error) {
      // File doesn't exist, download it
    }

    console.log(`⬇️  Downloading PDF: ${filename}`);
    
    // Use Node.js https module with proper headers
    const https = require('https');
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept': 'application/pdf,application/octet-stream,*/*',
          'Accept-Language': 'en-US,en;q=0.9,he;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Referer': 'https://hebrewbooks.org/',
        }
      };
      
      const req = client.request(options, (res) => {
        console.log(`📊 Status: ${res.statusCode}`);
        
        if (res.statusCode === 302 || res.statusCode === 301) {
          // Handle redirect
          const location = res.headers.location;
          if (location) {
            console.log(`🔄 Following redirect to: ${location}`);
            return this.downloadPdf(location, filename).then(resolve).catch(reject);
          }
        }
        
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }
        
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            
            // Ensure cache directory exists
            await fs.mkdir(this.cacheDir, { recursive: true });
            
            // Save to cache
            await fs.writeFile(cachePath, buffer);
            console.log(`✅ Cached PDF: ${filename}`);
            
            resolve(cachePath);
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  /**
   * Extract text from PDF
   */
  async extractTextFromPdf(pdfPath) {
    console.log(`📖 Extracting text from: ${path.basename(pdfPath)}`);
    
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdf(dataBuffer);
    
    return {
      text: data.text,
      info: data.info,
      metadata: data.metadata,
      pageCount: data.numpages
    };
  }

  /**
   * Get page content with caching
   */
  async getPageContent(bookId, pageNumber) {
    const url = this.getPagePdfUrl(bookId, pageNumber);
    const filename = `book_${bookId}_page_${pageNumber}.pdf`;
    
    try {
      const pdfPath = await this.downloadPdf(url, filename);
      const content = await this.extractTextFromPdf(pdfPath);
      
      return {
        bookId,
        pageNumber,
        content: content.text,
        metadata: content.metadata,
        pageCount: content.pageCount
      };
    } catch (error) {
      console.error(`❌ Failed to get page ${pageNumber}:`, error.message);
      throw error;
    }
  }

  /**
   * Get full book content
   */
  async getFullBookContent(bookId) {
    const url = this.getFullPdfUrl(bookId);
    const filename = `book_${bookId}_full.pdf`;
    
    try {
      const pdfPath = await this.downloadPdf(url, filename);
      const content = await this.extractTextFromPdf(pdfPath);
      
      return {
        bookId,
        content: content.text,
        metadata: content.metadata,
        pageCount: content.pageCount
      };
    } catch (error) {
      console.error(`❌ Failed to get full book ${bookId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get multiple pages efficiently
   */
  async getMultiplePages(bookId, startPage = 1, endPage) {
    console.log(`📚 Getting pages ${startPage}-${endPage} for book ${bookId}`);
    
    const pages = [];
    const promises = [];
    
    for (let page = startPage; page <= endPage; page++) {
      promises.push(
        this.getPageContent(bookId, page)
          .then(content => pages.push(content))
          .catch(error => console.error(`Failed page ${page}:`, error.message))
      );
    }
    
    await Promise.all(promises);
    
    // Sort by page number
    pages.sort((a, b) => a.pageNumber - b.pageNumber);
    
    return pages;
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
}

// Example usage and testing
async function main() {
  const extractor = new HebrewBooksPDFExtractor();
  const DERECH_MITZVOSECHA_ID = 15419;
  
  try {
    console.log('🚀 Testing HebrewBooks PDF Extractor...\n');
    
    // Test single page
    console.log('📄 Testing single page extraction:');
    const page4 = await extractor.getPageContent(DERECH_MITZVOSECHA_ID, 4);
    console.log(`✅ Page 4 extracted (${page4.content.length} chars)`);
    console.log(`📝 Preview: ${page4.content.substring(0, 200)}...\n`);
    
    // Test search in content
    console.log('🔍 Testing search in content:');
    const matches = extractor.searchInContent(page4.content, 'מצוה');
    console.log(`✅ Found ${matches.length} matches for "מצוה"`);
    
    // Test multiple pages
    console.log('\n📚 Testing multiple pages:');
    const pages = await extractor.getMultiplePages(DERECH_MITZVOSECHA_ID, 1, 3);
    console.log(`✅ Extracted ${pages.length} pages`);
    
    pages.forEach(page => {
      console.log(`   Page ${page.pageNumber}: ${page.content.length} chars`);
    });
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = HebrewBooksPDFExtractor;

// Run tests if called directly
if (require.main === module) {
  main();
}
