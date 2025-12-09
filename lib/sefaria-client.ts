export interface SefariaBook {
  title: string;
  heTitle: string;
  categories: string[];
  length: number;
  enDesc?: string;
  heDesc?: string;
}

export interface SefariaTextContent {
  he: string | string[];
  en: string | string[];
  heTitle: string;
  enTitle: string;
  category: string;
  sections: string[];
  toSections: string[];
  ref: string;
  index: string;
  length: number;
}

export interface AutocompleteSuggestion {
  text: string;
  hebrew?: string;
  category?: string;
  book?: SefariaBook;
}

export class SefariaClient {
  private baseUrl = 'https://www.sefaria.org/api';
  private searchCache = new Map<string, { results: SefariaBook[], timestamp: number }>();
  private autocompleteCache = new Map<string, { suggestions: AutocompleteSuggestion[], timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async searchBooks(query: string): Promise<SefariaBook[]> {
    if (!query.trim()) return [];

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.results;
    }

    try {
      const response = await fetch(`${this.baseUrl}/index?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Sefaria search failed: ${response.statusText}`);
      }

      const results = await response.json();

      // Filter for main books, exclude commentary and individual sections
      const books = results
        .filter((item: any) =>
          item.categories &&
          !item.categories.includes('Commentary') &&
          item.length > 1 &&
          !item.title.includes(':') // Exclude specific references
        )
        .slice(0, 20)
        .map((item: any): SefariaBook => ({
          title: item.title,
          heTitle: item.heTitle,
          categories: item.categories,
          length: item.length,
          enDesc: item.enDesc || '',
          heDesc: item.heDesc || ''
        }));

      // Cache the results
      this.searchCache.set(cacheKey, { results: books, timestamp: Date.now() });

      return books;
    } catch (error) {
      console.error('Sefaria search error:', error);
      throw error;
    }
  }

  async getAutocompleteSuggestions(query: string, limit: number = 10): Promise<AutocompleteSuggestion[]> {
    if (!query.trim() || query.length < 2) return [];

    // Check cache first
    const cacheKey = query.toLowerCase().slice(0, 3); // Cache by first 3 chars for performance
    const cached = this.autocompleteCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.suggestions.filter(s =>
        s.text.toLowerCase().includes(query.toLowerCase()) ||
        (s.hebrew && s.hebrew.includes(query))
      ).slice(0, limit);
    }

    try {
      // Get a broader search to build autocomplete suggestions
      const response = await fetch(`${this.baseUrl}/index?q=${encodeURIComponent(query)}&size=50`);
      if (!response.ok) {
        throw new Error(`Sefaria autocomplete failed: ${response.statusText}`);
      }

      const results = await response.json();

      // Create comprehensive suggestions from results
      const suggestions: AutocompleteSuggestion[] = [];

      results.forEach((item: any) => {
        if (!item.categories || item.categories.includes('Commentary')) return;

        // Add English title
        if (item.title && item.title !== query) {
          suggestions.push({
            text: item.title,
            hebrew: item.heTitle,
            category: item.categories?.[0] || 'Unknown',
            book: {
              title: item.title,
              heTitle: item.heTitle,
              categories: item.categories || [],
              length: item.length || 0,
              enDesc: item.enDesc || '',
              heDesc: item.heDesc || ''
            }
          });
        }

        // Add Hebrew title if different
        if (item.heTitle && item.heTitle !== item.title && item.heTitle !== query) {
          suggestions.push({
            text: item.heTitle,
            hebrew: item.heTitle,
            category: item.categories?.[0] || 'Unknown',
            book: {
              title: item.title,
              heTitle: item.heTitle,
              categories: item.categories || [],
              length: item.length || 0,
              enDesc: item.enDesc || '',
              heDesc: item.heDesc || ''
            }
          });
        }

        // Add common transliterations and variations
        const transliterations = this.generateTransliterations(item.title, item.heTitle);
        transliterations.forEach(trans => {
          if (trans !== query && trans.length > 3) {
            suggestions.push({
              text: trans,
              hebrew: item.heTitle,
              category: item.categories?.[0] || 'Unknown',
              book: {
                title: item.title,
                heTitle: item.heTitle,
                categories: item.categories || [],
                length: item.length || 0,
                enDesc: item.enDesc || '',
                heDesc: item.heDesc || ''
              }
            });
          }
        });
      });

      // Remove duplicates and sort by relevance
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
      const sortedSuggestions = this.sortSuggestionsByRelevance(uniqueSuggestions, query);

      // Cache the results
      this.autocompleteCache.set(cacheKey, { suggestions: sortedSuggestions, timestamp: Date.now() });

      return sortedSuggestions.slice(0, limit);
    } catch (error) {
      console.error('Sefaria autocomplete error:', error);
      return [];
    }
  }

  private generateTransliterations(englishTitle: string, hebrewTitle: string): string[] {
    const variations: string[] = [];

    // Common Hebrew transliteration variations
    const translitMap: Record<string, string[]> = {
      'ch': ['kh', 'h'],
      'tz': ['ts', 'z'],
      'sh': ['s', 'sch'],
      'ph': ['f', 'p'],
      'th': ['t'],
      'kh': ['ch', 'h'],
      'ah': ['a'],
      'eh': ['e'],
      'oh': ['o']
    };

    // Generate variations based on common patterns
    let base = englishTitle.toLowerCase();

    // Handle common prefixes
    if (base.startsWith('tractate ')) {
      variations.push(base.replace('tractate ', 'masechet '));
      variations.push(base.replace('tractate ', ''));
    }

    // Handle "likutei" variations
    if (base.includes('likutei')) {
      variations.push(base.replace('likutei', 'likkutey'));
      variations.push(base.replace('likutei', 'likutey'));
    }

    // Add some common fuzzy matches
    const commonReplacements = [
      ['tanya', 'likutei amarim'],
      ['shulchan aruch', 'shulchan arukh'],
      ['shulchan aruch', 'shulhan arukh'],
      ['pirkei avot', 'ethics of the fathers'],
      ['mishneh torah', 'mishne torah'],
    ];

    commonReplacements.forEach(([from, to]) => {
      if (base.includes(from)) {
        variations.push(base.replace(from, to));
      }
      if (base.includes(to)) {
        variations.push(base.replace(to, from));
      }
    });

    return [...new Set(variations)]; // Remove duplicates
  }

  private deduplicateSuggestions(suggestions: AutocompleteSuggestion[]): AutocompleteSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = `${suggestion.text}|${suggestion.hebrew || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private sortSuggestionsByRelevance(suggestions: AutocompleteSuggestion[], query: string): AutocompleteSuggestion[] {
    const queryLower = query.toLowerCase();

    return suggestions.sort((a, b) => {
      const aText = a.text.toLowerCase();
      const bText = b.text.toLowerCase();

      // Exact prefix match gets highest priority
      const aStartsWith = aText.startsWith(queryLower);
      const bStartsWith = bText.startsWith(queryLower);
      if (aStartsWith && !bStartsWith) return -1;
      if (bStartsWith && !aStartsWith) return 1;

      // Contains query gets medium priority
      const aContains = aText.includes(queryLower);
      const bContains = bText.includes(queryLower);
      if (aContains && !bContains) return -1;
      if (bContains && !aContains) return 1;

      // Hebrew title match
      const aHebrewMatch = a.hebrew?.toLowerCase().includes(queryLower);
      const bHebrewMatch = b.hebrew?.toLowerCase().includes(queryLower);
      if (aHebrewMatch && !bHebrewMatch) return -1;
      if (bHebrewMatch && !aHebrewMatch) return 1;

      // Shorter titles first (more likely to be what user wants)
      return a.text.length - b.text.length;
    });
  }

  async getBookIndex(title: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/index/${encodeURIComponent(title)}`);
      if (!response.ok) {
        throw new Error(`Book index not found: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Sefaria index fetch error:', error);
      throw error;
    }
  }

  async getTextContent(title: string, language: 'he' | 'en' = 'he'): Promise<SefariaTextContent> {
    try {
      const url = `${this.baseUrl}/texts/${encodeURIComponent(title)}?lang=${language}&commentary=0`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Text content not found: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Sefaria text fetch error:', error);
      throw error;
    }
  }

  // Helper method to check if a book is suitable for import vs reference-only
  getBookRecommendation(book: SefariaBook): 'import' | 'reference' {
    // Basic heuristics - can be expanded
    const importCategories = ['Chasidut', 'Philosophy', 'Ethics', 'Mussar'];
    const referenceCategories = ['Tanakh', 'Mishnah', 'Talmud', 'Halakhah'];
    
    if (book.categories.some(cat => importCategories.includes(cat))) {
      return 'import';
    }
    
    if (book.categories.some(cat => referenceCategories.includes(cat))) {
      return 'reference';
    }
    
    // Default to import for unknown categories
    return 'import';
  }

  // Validate Hebrew text encoding
  validateHebrewText(text: string): boolean {
    // Check if text contains Hebrew characters
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text);
  }

  // Clean and normalize Hebrew text
  cleanHebrewText(text: string): string {
    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Fix common encoding issues
      .replace(/[\u05BE\u05C3]/g, '-') // Maqaf and sof pasuq to dash
      .replace(/\u05C4/g, '"') // Geresh
      .replace(/\u05C5/g, '"') // Gershayim
      .trim();
  }
}

export const sefariaClient = new SefariaClient();
