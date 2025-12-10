//B"H

/**
 * Scrapers Index - Chabad Research Data Ingestion Tools
 *
 * This file serves as the central registry for all data scraping and ingestion
 * tools used in the Chabad Research project.
 *
 * Available Scrapers:
 * - Chabad Library Scraper: Scrapes books from chabadlibrary.org API
 *
 * Usage:
 * const scrapers = require('./scrapers');
 * const { getEntireChabadLibraryBookSequential } = scrapers.chabadLibrary;
 *
 * // Or import specific scrapers
 * const chabadScraper = require('./scrapers/chabadlibraryScraper');
 */

// Export all available scrapers
module.exports = {
  chabadLibrary: require('./chabadlibraryScraper')
};

/**
 * SCRAPER REGISTRY
 * ================
 *
 * Chabad Library Scraper
 * ----------------------
 * Source: https://chabadlibrary.org/books/api/main?path=/${id}
 * Capabilities:
 *   - Scrapes complete book structures hierarchically
 *   - Extracts Hebrew text with footnotes/notes
 *   - Handles nested sections and chapters
 *   - Sequential processing to avoid rate limiting
 *   - Saves data as JSON for further processing
 *
 * Usage Examples:
 *   // Scrape Shulchan Aruch (default)
 *   node scrapers/chabadlibraryScraper.js
 *
 *   // Scrape specific book by ID
 *   const { getEntireChabadLibraryBookSequential } = require('./chabadlibraryScraper');
 *   const bookData = await getEntireChabadLibraryBookSequential(bookId);
 *
 * Output Format:
 *   {
 *     "Section Name": {
 *       id: "section_id",
 *       children: [
 *         {
 *           heading: "Chapter Name",
 *           id: "chapter_id",
 *           text: "Hebrew text content...",
 *           notes: "footnotes and annotations..."
 *         }
 *       ]
 *     }
 *   }
 *
 * Integration:
 *   - Output JSON files are processed by populate_chabad_book.js
 *   - Creates hierarchical document structure in Directus
 *   - Splits text into statements, extracts citations
 *   - Maintains proper ordering and relationships
 *
 * Future Scrapers to Add:
 *   - Sefaria API scraper (for additional sources)
 *   - HebrewBooks.org scraper
 *   - Local PDF/text file parsers
 *   - Cross-reference scrapers for citations
 */

/**
 * Helper Functions
 * ===============
 */

// List all available scrapers
function listAvailableScrapers() {
  return Object.keys(module.exports);
}

// Get scraper metadata
function getScraperInfo(scraperName) {
  const scraper = module.exports[scraperName];
  if (!scraper) return null;

  return {
    name: scraperName,
    functions: Object.keys(scraper).filter(key => typeof scraper[key] === 'function'),
    hasSequential: typeof scraper.getEntireChabadLibraryBookSequential === 'function',
    hasParallel: typeof scraper.getEntireChabadLibraryBook === 'function'
  };
}

// Export utility functions
module.exports.listAvailableScrapers = listAvailableScrapers;
module.exports.getScraperInfo = getScraperInfo;

// CLI usage
if (require.main === module) {
  console.log('Available Scrapers:');
  console.log('==================');

  const scrapers = listAvailableScrapers();
  scrapers.forEach(name => {
    const info = getScraperInfo(name);
    console.log(`\n📚 ${name.toUpperCase()}`);
    console.log(`   Functions: ${info.functions.join(', ')}`);
    console.log(`   Sequential: ${info.hasSequential ? '✅' : '❌'}`);
    console.log(`   Parallel: ${info.hasParallel ? '✅' : '❌'}`);
  });

  console.log('\n💡 Usage:');
  console.log('   const scrapers = require("./scrapers");');
  console.log('   const chabadData = await scrapers.chabadLibrary.getEntireChabadLibraryBookSequential(bookId);');
}
