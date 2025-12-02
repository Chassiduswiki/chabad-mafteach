/**
 * Citation Matching Utility for Footnote System
 * 
 * Matches footnote text against topic_citations to find source references.
 * Handles fuzzy matching, book name variants, and reference parsing.
 */

import { TopicCitation, Sefer, Location } from '@/lib/types';

/**
 * Parsed citation structure extracted from footnote text
 */
export interface ParsedCitation {
    bookName: string;
    reference?: string;
    originalText: string;
}

/**
 * Match result with confidence score
 */
export interface CitationMatch {
    citation: TopicCitation & { location: Location; sefer: Sefer };
    confidence: number; // 0-100
    matchType: 'exact' | 'fuzzy' | 'partial';
}

/**
 * Common book name variants for matching
 * Maps alternate names/spellings to canonical names
 */
const BOOK_VARIANTS: Record<string, string[]> = {
    'tanya': ['likkutei amarim', 'likutei amarim', 'ליקוטי אמרים'],
    'likkutei sichos': ['likutei sichot', 'לקוטי שיחות'],
    'torah or': ['תורה אור'],
    'likkutei torah': ['likutei torah', 'לקוטי תורה'],
    'sefer hamaamarim': ['ספר המאמרים'],
    'igros kodesh': ['אגרות קודש', 'letters'],
};

/**
 * Parse footnote text to extract book name and reference
 * 
 * Examples:
 * - "See Tanya ch. 32" → { bookName: "Tanya", reference: "ch. 32" }
 * - "Likkutei Sichos vol. 12 p. 45" → { bookName: "Likkutei Sichos", reference: "vol. 12 p. 45" }
 */
export function parseCitation(footnoteText: string): ParsedCitation {
    const text = footnoteText.trim();

    // Common patterns:
    // 1. "Book Name ch/vol/p. XX"
    // 2. "Book Name, chapter XX"
    // 3. "See Book Name XX:YY"

    const patterns = [
        // "Tanya ch. 32" or "Tanya, ch. 32"
        /^(?:see\s+)?([a-z\s]+?)(?:,?\s+)((?:ch|chapter|vol|page|p)\.?\s*\d+.*?)$/i,
        // "Likkutei Sichos vol. 12 p. 45"
        /^(?:see\s+)?([a-z\s]+?)\s+(vol\.?\s*\d+[^,]*(?:,?\s*p\.?\s*\d+.*)?)$/i,
        // "Torah Or 45b"
        /^(?:see\s+)?([a-z\s]+?)\s+(\d+[a-z]?)$/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return {
                bookName: match[1].trim(),
                reference: match[2]?.trim(),
                originalText: text,
            };
        }
    }

    // Fallback: treat entire text as book name
    return {
        bookName: text,
        originalText: text,
    };
}

/**
 * Normalize book name for comparison (lowercase, remove punctuation)
 */
function normalizeBookName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[.,'"]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Check if two book names match (including variants)
 */
function matchesBookName(query: string, targetSeferTitle: string): boolean {
    const normalizedQuery = normalizeBookName(query);
    const normalizedTarget = normalizeBookName(targetSeferTitle);

    // Exact match
    if (normalizedQuery === normalizedTarget) {
        return true;
    }

    // Partial match (target contains query or vice versa)
    if (normalizedTarget.includes(normalizedQuery) || normalizedQuery.includes(normalizedTarget)) {
        return true;
    }

    // Check variants
    for (const [canonical, variants] of Object.entries(BOOK_VARIANTS)) {
        const allNames = [canonical, ...variants].map(normalizeBookName);

        if (allNames.includes(normalizedQuery) && allNames.includes(normalizedTarget)) {
            return true;
        }
    }

    return false;
}

/**
 * Score how well a citation matches the parsed query
 * Returns 0-100 confidence score
 */
export function scoreMatch(
    citation: TopicCitation & { location: Location; sefer: Sefer },
    parsedCitation: ParsedCitation
): number {
    let score = 0;

    const seferTitle = citation.sefer.title;
    const locationRef = citation.location.reference_text || '';

    // Book name match (worth 60 points)
    if (matchesBookName(parsedCitation.bookName, seferTitle)) {
        const normalizedQuery = normalizeBookName(parsedCitation.bookName);
        const normalizedTarget = normalizeBookName(seferTitle);

        if (normalizedQuery === normalizedTarget) {
            score += 60; // Exact match
        } else if (normalizedTarget.includes(normalizedQuery) || normalizedQuery.includes(normalizedTarget)) {
            score += 50; // Partial match
        } else {
            score += 40; // Variant match
        }
    } else {
        return 0; // No book match, not a valid candidate
    }

    // Reference match (worth 40 points)
    if (parsedCitation.reference && locationRef) {
        const normalizedRefQuery = normalizeBookName(parsedCitation.reference);
        const normalizedRefTarget = normalizeBookName(locationRef);

        if (normalizedRefQuery === normalizedRefTarget) {
            score += 40; // Exact reference match
        } else if (normalizedRefTarget.includes(normalizedRefQuery) || normalizedRefQuery.includes(normalizedRefTarget)) {
            score += 25; // Partial reference match
        } else {
            // Extract numbers and compare
            const queryNumbers = parsedCitation.reference.match(/\d+/g) || [];
            const targetNumbers = locationRef.match(/\d+/g) || [];

            if (queryNumbers.some(n => targetNumbers.includes(n))) {
                score += 15; // Number overlap
            }
        }
    } else if (!parsedCitation.reference && locationRef) {
        // No reference in query, but citation has one - assume it's valid
        score += 20;
    }

    return score;
}

/**
 * Find best matching citation for a footnote text
 * 
 * @param footnoteText - The footnote text to match
 * @param citations - Available citations to match against
 * @param minConfidence - Minimum confidence threshold (default: 50)
 * @returns Best matching citation or null if no good match found
 */
export function fuzzyMatchCitation(
    footnoteText: string,
    citations: (TopicCitation & { location: Location; sefer: Sefer })[],
    minConfidence: number = 50
): CitationMatch | null {
    const parsed = parseCitation(footnoteText);

    // Score all citations
    const scoredMatches: CitationMatch[] = citations.map(citation => ({
        citation,
        confidence: scoreMatch(citation, parsed),
        matchType: 'fuzzy' as 'exact' | 'fuzzy' | 'partial',
    }));

    // Sort by confidence (highest first)
    scoredMatches.sort((a, b) => b.confidence - a.confidence);

    // Get best match
    const best = scoredMatches[0];

    if (!best || best.confidence < minConfidence) {
        return null;
    }

    // Determine match type based on confidence
    const matchType: 'exact' | 'fuzzy' | 'partial' =
        best.confidence >= 90 ? 'exact' :
            best.confidence >= 70 ? 'fuzzy' :
                'partial';

    return {
        ...best,
        matchType,
    };
}

/**
 * Check if a sefer has HebrewBooks data available
 */
export function hasHebrewBooksLink(sefer: Sefer): boolean {
    return !!sefer.hebrewbooks_id;
}
