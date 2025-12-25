/**
 * Enhanced search result processor
 * Uses fuzzy matching and relevance scoring to improve search results
 */

import { generateSearchVariants, calculateRelevance, isHebrew } from './search';

export interface SearchResult {
    id: string;
    title: string;
    type: string;
    relevance?: number;
    [key: string]: any;
}

/**
 * Process and rank search results using relevance scoring
 */
export function rankSearchResults(
    results: SearchResult[],
    query: string
): SearchResult[] {
    // Calculate relevance score for each result
    const scoredResults = results.map(result => {
        let score = 0;

        // Score based on title match
        if (result.title) {
            score += calculateRelevance(query, result.title, 'title');
        }

        // Score based on description/content
        if (result.description) {
            score += calculateRelevance(query, result.description, 'description');
        }
        if (result.content_preview) {
            score += calculateRelevance(query, result.content_preview, 'content');
        }

        // Boost for exact type matches
        if (result.type && query.toLowerCase() === result.type.toLowerCase()) {
            score += 50;
        }

        return {
            ...result,
            relevance: score
        };
    });

    // Sort by relevance (highest first)
    return scoredResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
}

/**
 * Generate search query variants for better matching
 * Includes original query plus transliterations
 */
export function getSearchQueryVariants(query: string): string[] {
    const variants = generateSearchVariants(query);

    // Deduplicate and normalize
    const uniqueVariants = Array.from(new Set(
        variants.map(v => v.toLowerCase().trim())
    ));

    return uniqueVariants;
}

/**
 * Filter results by minimum relevance threshold
 */
export function filterByRelevance(
    results: SearchResult[],
    minRelevance: number = 10
): SearchResult[] {
    return results.filter(r => (r.relevance || 0) >= minRelevance);
}

/**
 * Group results by type
 */
export function groupResultsByType(results: SearchResult[]): Record<string, SearchResult[]> {
    return results.reduce((groups, result) => {
        const type = result.type || 'other';
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(result);
        return groups;
    }, {} as Record<string, SearchResult[]>);
}

/**
 * Get "did you mean?" suggestions based on common typos
 */
export function getSearchSuggestions(query: string, allResults: SearchResult[]): string[] {
    // This is a simple implementation
    // Could be enhanced with a proper spell-checker or common typo database
    const suggestions: string[] = [];

    // If query is very short, no suggestions
    if (query.length < 3) return suggestions;

    // Look for similar titles in results
    const similarTitles = allResults
        .map(r => r.title)
        .filter(title => {
            if (!title) return false;
            const titleLower = title.toLowerCase();
            const queryLower = query.toLowerCase();

            // Check if they start with the same letter and have similar length
            return titleLower[0] === queryLower[0] &&
                Math.abs(titleLower.length - queryLower.length) <= 3;
        })
        .slice(0, 3);

    return similarTitles;
}
