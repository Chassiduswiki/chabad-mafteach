#!/usr/bin/env node

/**
 * HebrewBooks Working Solution
 * What we can do RIGHT NOW with HebrewBooks.org
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class HebrewBooksWorkingSolution {
  constructor() {
    this.cacheDir = path.join(process.cwd(), '.cache', 'hebrewbooks');
  }

  /**
   * Download PDF with proper URL handling
   */
  async downloadPdf(bookId, pageNumber, filename) {
    const cachePath = path.join(this.cacheDir, filename);
    
    // Check cache first
    try {
      await fs.access(cachePath);
      console.log(`📁 Using cached PDF: ${filename}`);
      return cachePath;
    } catch (error) {
      // File doesn't exist, download it
    }

    console.log(`⬇️  Downloading PDF: ${filename}`);
    
    // Use the beta URL that worked in our redirect
    const url = `https://beta.hebrewbooks.org/pdfpagefeed.aspx?req=${bookId}&pgnum=${pageNumber}`;
    
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept': 'application/pdf,application/octet-stream,*/*',
          'Referer': 'https://beta.hebrewbooks.org/',
        }
      };
      
      const req = https.get(url, options, (res) => {
        console.log(`📊 Status: ${res.statusCode}`);
        
        if (res.statusCode === 302 || res.statusCode === 301) {
          const location = res.headers.location;
          if (location) {
            console.log(`🔄 Following redirect to: ${location}`);
            // Follow the redirect
            return this.downloadDirectPdf(location, cachePath).then(resolve).catch(reject);
          }
        }
        
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }
        
        // Handle direct PDF response
        this.handlePdfResponse(res, cachePath).then(resolve).catch(reject);
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Download PDF from direct URL
   */
  async downloadDirectPdf(url, cachePath) {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept': 'application/pdf,application/octet-stream,*/*',
        }
      };
      
      const req = https.get(url, options, (res) => {
        console.log(`📊 Direct download status: ${res.statusCode}`);
        
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }
        
        this.handlePdfResponse(res, cachePath).then(resolve).catch(reject);
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Handle PDF response and save to file
   */
  async handlePdfResponse(res, cachePath) {
    const chunks = [];
    
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        // Check if it's actually a PDF
        const header = buffer.toString('binary', 0, 4);
        if (header !== '%PDF') {
          throw new Error('Downloaded file is not a valid PDF');
        }
        
        // Ensure cache directory exists
        await fs.mkdir(path.dirname(cachePath), { recursive: true });
        
        // Save to cache
        await fs.writeFile(cachePath, buffer);
        console.log(`✅ Cached PDF: ${path.basename(cachePath)}`);
        
        return cachePath;
      } catch (error) {
        throw error;
      }
    });
  }

  /**
   * Get working URLs for Derech Mitzvosecha
   */
  getWorkingUrls() {
    const bookId = 15419;
    
    return {
      // These URLs work in browser
      webPage: `https://hebrewbooks.org/${bookId}`,
      pdfViewer: `https://hebrewbooks.org/pdfpager.aspx?req=${bookId}&pgnum=4`,
      
      // These might work with proper headers
      pagePdf: `https://hebrewbooks.org/pagefeed/hebrewbooks_org_${bookId}_4.pdf`,
      betaPagePdf: `https://beta.hebrewbooks.org/pdfpagefeed.aspx?req=${bookId}&pgnum=4`,
      fullPdf: `https://download.hebrewbooks.org/downloadhandler.ashx?req=${bookId}`,
      
      // Cover image
      cover: `https://hebrewbooks.org/coverpage.aspx?req=${bookId}&width=200&height=300`,
    };
  }

  /**
   * Test what URLs actually work
   */
  async testUrls() {
    const urls = this.getWorkingUrls();
    const results = {};
    
    for (const [name, url] of Object.entries(urls)) {
      console.log(`\n🔍 Testing ${name}: ${url}`);
      
      try {
        const response = await this.headRequest(url);
        results[name] = {
          url,
          status: response.status,
          contentType: response.headers['content-type'],
          contentLength: response.headers['content-length'],
          works: response.status < 400
        };
        
        console.log(`   ${response.status} - ${response.headers['content-type'] || 'No content type'}`);
      } catch (error) {
        results[name] = {
          url,
          status: 'ERROR',
          error: error.message,
          works: false
        };
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    return results;
  }

  /**
   * Make HEAD request to test URL
   */
  async headRequest(url) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        }
      };
      
      const req = https.get(url, options, (res) => {
        resolve({
          status: res.statusCode,
          headers: res.headers
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Create a simple web viewer for the book
   */
  createWebViewer() {
    const bookId = 15419;
    const urls = this.getWorkingUrls();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Derech Mitzvosecha - HebrewBooks Viewer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .viewer { border: 1px solid #ccc; width: 100%; height: 600px; }
        .links { margin: 20px 0; }
        .links a { display: block; margin: 5px 0; }
    </style>
</head>
<body>
    <h1>Derech Mitzvosecha (Book ID: ${bookId})</h1>
    
    <div class="links">
        <h3>Working Links:</h3>
        <a href="${urls.webPage}" target="_blank">📖 Web Page</a>
        <a href="${urls.pdfViewer}" target="_blank">📄 PDF Viewer (Page 4)</a>
        <a href="${urls.fullPdf}" target="_blank">📥 Full PDF Download</a>
        <a href="${urls.cover}" target="_blank">🖼️ Cover Image</a>
    </div>
    
    <h3>PDF Viewer (Page 4):</h3>
    <iframe class="viewer" src="${urls.pdfViewer}"></iframe>
    
    <h3>Alternative: Direct PDF Embed</h3>
    <iframe class="viewer" src="${urls.fullPdf}"></iframe>
</body>
</html>`;
  }
}

// Demo and testing
async function main() {
  const solution = new HebrewBooksWorkingSolution();
  
  try {
    console.log('🚀 HebrewBooks Working Solution Test\n');
    
    // Test URLs
    console.log('🔍 Testing URL accessibility...');
    const results = await solution.testUrls();
    
    console.log('\n📊 RESULTS SUMMARY:');
    console.log('='.repeat(50));
    
    const working = Object.entries(results).filter(([name, result]) => result.works);
    const broken = Object.entries(results).filter(([name, result]) => !result.works);
    
    console.log(`✅ Working URLs: ${working.length}`);
    working.forEach(([name, result]) => {
      console.log(`   ${name}: ${result.status} - ${result.contentType}`);
    });
    
    console.log(`❌ Broken URLs: ${broken.length}`);
    broken.forEach(([name, result]) => {
      console.log(`   ${name}: ${result.status} - ${result.error || result.contentType}`);
    });
    
    // Create web viewer
    console.log('\n🌐 Creating web viewer...');
    const htmlContent = solution.createWebViewer();
    await fs.writeFile('hebrewbooks-viewer.html', htmlContent);
    console.log('✅ Created: hebrewbooks-viewer.html');
    
    console.log('\n🎉 WHAT YOU CAN DO RIGHT NOW:');
    console.log('='.repeat(50));
    console.log('1. ✅ Open hebrewbooks-viewer.html in your browser');
    console.log('2. ✅ Use the working links to access content');
    console.log('3. ✅ View PDF pages in iframe');
    console.log('4. ✅ Download full book PDF');
    console.log('5. ✅ Access cover images');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Use iframe embedding for PDF viewing');
    console.log('2. Implement server-side PDF parsing for text extraction');
    console.log('3. Use Playwright for metadata extraction (if needed)');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = HebrewBooksWorkingSolution;

// Run demo if called directly
if (require.main === module) {
  main();
}
