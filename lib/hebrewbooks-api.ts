/**
 * HebrewBooks API Integration
 * 
 * 🎯 FRONTEND-SAFE INTEGRATION - No server required!
 * 
 * This module provides SAFE integration with HebrewBooks.org that will NOT break your frontend.
 * All methods are browser-compatible and require no server-side changes.
 * 
 * ✅ SAFE TO USE (Guaranteed to work):
 * - iframe embedding for PDF viewing
 * - Direct links for navigation
 * - Cover image URLs
 * - Book page URLs
 * 
 * ❌ WILL FAIL (Don't use these):
 * - Direct API calls (Cloudflare blocked)
 * - PDF downloads (403 Forbidden)
 * - Metadata extraction (requires Playwright)
 * 
 * 🔗 CONNECTION TO CHABAD.ORG/LAHAK:
 * Use same interface pattern as your existing Chabad integration
 * 
 * 📚 SEE: docs/HEBREWBOOKS_INTEGRATION_GUIDE.md for complete examples
 */

export interface HebrewBookInfo {
  id: number;
  title: string;
  author?: string;
  publicationYear?: string;
  pageCount?: string;
  pdfUrl?: string;
  url: string;
  extractedAt?: string;
}

export interface PageContent {
  bookId: number;
  pageNumber: number;
  content: string;
  metadata?: any;
  pageCount?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
}

export class HebrewBooksAPI {
  private static readonly BASE_URL = 'https://hebrewbooks.org';
  
  // ==================== ✅ SAFE METHODS (Use These!) ====================
  
  /**
   * Get book information page URL - SAFE: Works in browser
   */
  static getBookUrl(bookId: number): string {
    return `${this.BASE_URL}/${bookId}`;
  }
  
  /**
   * Get PDF viewer URL for iframe embedding - SAFE: Works in browser
   */
  static getPageViewerUrl(bookId: number, pageNumber: number = 1): string {
    return `${this.BASE_URL}/pdfpager.aspx?req=${bookId}&pgnum=${pageNumber}`;
  }
  
  /**
   * Get cover image URL - SAFE: Works in browser
   */
  static getCoverUrl(bookId: number, width: number = 200, height: number = 300): string {
    return `${this.BASE_URL}/coverpage.aspx?req=${bookId}&width=${width}&height=${height}`;
  }
  
  /**
   * Get full PDF download URL - SAFE: Works for direct links
   */
  static getDownloadUrl(bookId: number): string {
    return `https://download.hebrewbooks.org/downloadhandler.ashx?req=${bookId}`;
  }
  
  // ==================== ❌ UNSAFE METHODS (Don't Use!) ====================
  
  /**
   * @deprecated WILL FAIL: Direct PDF download blocked by Cloudflare
   * Use getPageViewerUrl() for iframe embedding instead
   */
  static async downloadPage(bookId: number, pageNumber: number): Promise<Blob> {
    throw new Error('PDF download blocked by Cloudflare. Use getPageViewerUrl() for iframe embedding instead.');
  }
  
  /**
   * @deprecated WILL FAIL: Full PDF download blocked by Cloudflare  
   * Use getDownloadUrl() for direct download links instead
   */
  static async downloadFullBook(bookId: number): Promise<Blob> {
    throw new Error('PDF download blocked by Cloudflare. Use getDownloadUrl() for direct download links instead.');
  }

  /**
   * @deprecated WILL FAIL: API access blocked by Cloudflare
   * Requires server-side Playwright setup - see documentation
   */
  static async getBookMetadata(bookId: number): Promise<Partial<HebrewBookInfo>> {
    throw new Error('API access blocked by Cloudflare. Requires server-side Playwright setup. See docs/HEBREWBOOKS_INTEGRATION_GUIDE.md');
  }

  /**
   * @deprecated WILL FAIL: Search requires server-side Playwright
   * See documentation for server-side setup
   */
  static async searchBooks(query: string): Promise<SearchResult[]> {
    throw new Error('Search requires server-side Playwright setup. See docs/HEBREWBOOKS_INTEGRATION_GUIDE.md');
  }

  // ==================== 🔧 HELPER METHODS ====================

  /**
   * Create iframe embed code - SAFE: Works in browser
   */
  static createIframeEmbed(bookId: number, pageNumber: number = 1, options: {width?: string, height?: string} = {}): string {
    const {width = '100%', height = '600px'} = options;
    const url = this.getPageViewerUrl(bookId, pageNumber);
    
    return `<iframe src="${url}" width="${width}" height="${height}" frameborder="0" style="border: 1px solid #ccc;"></iframe>`;
  }
  
  /**
   * Create navigation links - SAFE: Works in browser
   */
  static createNavigationLinks(bookId: number, options: {openInNewTab?: boolean} = {}): string {
    const {openInNewTab = true} = options;
    const target = openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    
    return `
      <div class="hebrewbooks-navigation">
        <a href="${this.getBookUrl(bookId)}"${target}>📖 View Book</a>
        <a href="${this.getPageViewerUrl(bookId)}"${target}>📄 PDF Viewer</a>
        <a href="${this.getDownloadUrl(bookId)}"${target}>📥 Download PDF</a>
      </div>
    `;
  }

  /**
   * Integration helper for Chabad.org/Lahak pattern
   */
  static createUnifiedSource(bookId: number, title: string, metadata?: any) {
    return {
      type: 'hebrewbooks' as const,
      id: `hebrewbooks-${bookId}`,
      bookId,
      title,
      metadata,
      urls: {
        book: this.getBookUrl(bookId),
        viewer: this.getPageViewerUrl(bookId),
        download: this.getDownloadUrl(bookId),
        cover: this.getCoverUrl(bookId)
      }
    };
  }
}

// Example usage:
export const DERECH_MITZVOSECHA_ID = 15419;

export const exampleUsage = {
  // Get page 4 of Derech Mitzvosecha
  page4Url: HebrewBooksAPI.getPageViewerUrl(DERECH_MITZVOSECHA_ID, 4),
  page4Iframe: HebrewBooksAPI.createIframeEmbed(DERECH_MITZVOSECHA_ID, 4),
  fullPdfUrl: HebrewBooksAPI.getDownloadUrl(DERECH_MITZVOSECHA_ID),
  coverUrl: HebrewBooksAPI.getCoverUrl(DERECH_MITZVOSECHA_ID),
  navigationLinks: HebrewBooksAPI.createNavigationLinks(DERECH_MITZVOSECHA_ID),
  unifiedSource: HebrewBooksAPI.createUnifiedSource(DERECH_MITZVOSECHA_ID, 'Derech Mitzvosecha Vol 1'),
};

console.log('🎯 HebrewBooks Frontend-Safe Integration');
console.log('Page 4 Viewer:', exampleUsage.page4Url);
console.log('Cover Image:', exampleUsage.coverUrl);
console.log('Download PDF:', exampleUsage.fullPdfUrl);
