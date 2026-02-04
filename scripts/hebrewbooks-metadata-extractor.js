#!/usr/bin/env node

/**
 * HebrewBooks Metadata Extractor using Playwright
 * Uses headless browser to bypass Cloudflare for metadata extraction
 */

const { chromium } = require('playwright'); // npm install playwright
const fs = require('fs').promises;
const path = require('path');

class HebrewBooksMetadataExtractor {
  constructor() {
    this.cacheDir = path.join(process.cwd(), '.cache', 'hebrewbooks-metadata');
    this.browser = null;
    this.context = null;
  }

  /**
   * Initialize browser with stealth settings
   */
  async init() {
    console.log('🚀 Initializing browser...');
    
    this.browser = await chromium.launch({
      headless: true, // Can be set to false for debugging
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 375, height: 667 }, // Mobile viewport
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });

    // Add stealth-like headers
    await this.context.route('**/*', (route) => {
      const headers = route.request().headers();
      headers['Accept-Language'] = 'en-US,en;q=0.9,he;q=0.8';
      headers['Accept-Encoding'] = 'gzip, deflate, br';
      headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
      headers['Connection'] = 'keep-alive';
      headers['Upgrade-Insecure-Requests'] = '1';
      route.continue({ headers });
    });

    console.log('✅ Browser initialized');
  }

  /**
   * Extract metadata from book page
   */
  async getBookMetadata(bookId) {
    const cacheFile = path.join(this.cacheDir, `book_${bookId}_metadata.json`);
    
    // Check cache first
    try {
      const cached = await fs.readFile(cacheFile, 'utf8');
      console.log(`📁 Using cached metadata for book ${bookId}`);
      return JSON.parse(cached);
    } catch (error) {
      // No cache, proceed with extraction
    }

    console.log(`🔍 Extracting metadata for book ${bookId}...`);
    
    if (!this.context) {
      await this.init();
    }

    const page = await this.context.newPage();
    
    try {
      // Navigate to book page
      const url = `https://hebrewbooks.org/${bookId}`;
      console.log(`🌐 Loading: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for Cloudflare challenge to pass
      await page.waitForTimeout(3000);

      // Check if we got blocked
      if (await page.locator('text=Just a moment').isVisible()) {
        console.log('⏳ Waiting for Cloudflare challenge...');
        await page.waitForSelector('body:not(:has-text("Just a moment"))', { timeout: 60000 });
      }

      // Extract metadata using selectors
      const metadata = await page.evaluate(() => {
        const getText = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : '';
        };

        const getMeta = (name) => {
          const element = document.querySelector(`meta[name="${name}"]`) || 
                         document.querySelector(`meta[property="${name}"]`);
          return element ? element.getAttribute('content') : '';
        };

        // Try different selector patterns for book information
        const title = 
          getText('h1') || 
          getText('.book-title') || 
          getText('#MainContent_lblTitle') ||
          getText('title');

        const author = 
          getText('.author') ||
          getText('#MainContent_lblAuthor') ||
          getText('span:has-text("מחבר")')?.nextElementSibling?.textContent ||
          '';

        // Extract from page content
        const pageText = document.body.innerText;
        
        // Look for publication info
        const pubInfoMatch = pageText.match(/(הוצאה|Published|מהדורה).*?(\d{4})/);
        const publicationYear = pubInfoMatch ? pubInfoMatch[2] : '';

        // Look for page count
        const pageCountMatch = pageText.match(/(\d+)\s*(pages|עמודים|דפים)/);
        const pageCount = pageCountMatch ? pageCountMatch[1] : '';

        // Extract download links
        const downloadLink = document.querySelector('a[href*="downloadhandler"]');
        const pdfUrl = downloadLink ? downloadLink.href : '';

        return {
          id: window.location.pathname.split('/').pop(),
          title: title.split(' - ')[0] || title, // Remove site suffix
          author: author.replace(/^by\s+/i, '').trim(),
          publicationYear,
          pageCount,
          pdfUrl,
          url: window.location.href,
          extractedAt: new Date().toISOString()
        };
      });

      // Cache the metadata
      await fs.mkdir(this.cacheDir, { recursive: true });
      await fs.writeFile(cacheFile, JSON.stringify(metadata, null, 2));
      
      console.log(`✅ Metadata extracted for book ${bookId}`);
      console.log(`📚 Title: ${metadata.title}`);
      console.log(`✍️  Author: ${metadata.author}`);
      
      return metadata;

    } catch (error) {
      console.error(`❌ Failed to extract metadata for book ${bookId}:`, error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Search for books by query
   */
  async searchBooks(query, maxResults = 10) {
    console.log(`🔍 Searching for: "${query}"`);
    
    if (!this.context) {
      await this.init();
    }

    const page = await this.context.newPage();
    
    try {
      // Go to search page
      await page.goto('https://hebrewbooks.org/advanced.aspx', { waitUntil: 'networkidle' });
      
      // Wait for Cloudflare if needed
      await page.waitForTimeout(3000);
      
      // Fill search form (adjust selectors based on actual page structure)
      await page.fill('input[name*="search"]', query);
      await page.click('input[type="submit"], button[type="submit"]');
      
      // Wait for results
      await page.waitForLoadState('networkidle');
      
      // Extract search results
      const results = await page.evaluate(() => {
        const items = document.querySelectorAll('a[href*="/"]');
        const results = [];
        
        items.forEach(item => {
          const href = item.href;
          const match = href.match(/\/(\d+)$/);
          
          if (match) {
            const bookId = match[1];
            const title = item.textContent.trim();
            
            if (title && !title.includes('PDF') && !title.includes('Download')) {
              results.push({
                id: bookId,
                title: title,
                url: href
              });
            }
          }
        });
        
        return results.slice(0, 10); // Limit results
      });

      console.log(`✅ Found ${results.length} results`);
      return results;

    } catch (error) {
      console.error(`❌ Search failed:`, error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      console.log('🔒 Browser closed');
    }
  }
}

// Example usage
async function main() {
  const extractor = new HebrewBooksMetadataExtractor();
  const DERECH_MITZVOSECHA_ID = 15419;
  
  try {
    console.log('🚀 Testing HebrewBooks Metadata Extractor...\n');
    
    // Test metadata extraction
    console.log('📚 Testing metadata extraction:');
    const metadata = await extractor.getBookMetadata(DERECH_MITZVOSECHA_ID);
    console.log('✅ Metadata extracted:');
    console.log(JSON.stringify(metadata, null, 2));
    
    // Test search
    console.log('\n🔍 Testing search functionality:');
    const searchResults = await extractor.searchBooks('derech mitzvosecha');
    console.log(`✅ Search completed. Found ${searchResults.length} results:`);
    searchResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.title} (ID: ${result.id})`);
    });
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  } finally {
    await extractor.close();
  }
}

// Export for use in other modules
module.exports = HebrewBooksMetadataExtractor;

// Run tests if called directly
if (require.main === module) {
  main();
}
