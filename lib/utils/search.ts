/**
 * Search utilities for fuzzy matching and Hebrew transliteration
 */

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to handle typos
 */
export function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[len1][len2];
}

/**
 * Check if two strings are similar within a threshold
 * Returns true if the edit distance is small relative to string length
 */
export function isFuzzyMatch(str1: string, str2: string, threshold: number = 0.3): boolean {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = 1 - (distance / maxLength);
    return similarity >= (1 - threshold);
}

/**
 * Hebrew to English transliteration mapping
 * Maps Hebrew characters to their common English equivalents
 */
const hebrewToEnglish: Record<string, string[]> = {
    'א': ['a', 'e', 'o'],
    'ב': ['b', 'v'],
    'ג': ['g'],
    'ד': ['d'],
    'ה': ['h'],
    'ו': ['v', 'u', 'o'],
    'ז': ['z'],
    'ח': ['ch', 'h'],
    'ט': ['t'],
    'י': ['y', 'i'],
    'כ': ['k', 'ch'],
    'ך': ['ch', 'k'],
    'ל': ['l'],
    'מ': ['m'],
    'ם': ['m'],
    'נ': ['n'],
    'ן': ['n'],
    'ס': ['s'],
    'ע': ['a', 'e', 'o'],
    'פ': ['p', 'f'],
    'ף': ['f', 'p'],
    'צ': ['tz', 'ts'],
    'ץ': ['tz', 'ts'],
    'ק': ['k', 'q'],
    'ר': ['r'],
    'ש': ['sh', 's'],
    'ת': ['t', 's']
};

/**
 * English to Hebrew transliteration mapping (reverse)
 */
const englishToHebrew: Record<string, string[]> = {
    'a': ['א', 'ע'],
    'b': ['ב'],
    'v': ['ב', 'ו'],
    'g': ['ג'],
    'd': ['ד'],
    'h': ['ה', 'ח'],
    'o': ['ו', 'א', 'ע'],
    'u': ['ו'],
    'z': ['ז'],
    'ch': ['ח', 'כ', 'ך'],
    't': ['ט', 'ת'],
    'y': ['י'],
    'i': ['י'],
    'k': ['כ', 'ק', 'ך'],
    'l': ['ל'],
    'm': ['מ', 'ם'],
    'n': ['נ', 'ן'],
    's': ['ס', 'ש', 'ת'],
    'e': ['א', 'ע'],
    'p': ['פ', 'ף'],
    'f': ['פ', 'ף'],
    'tz': ['צ', 'ץ'],
    'ts': ['צ', 'ץ'],
    'q': ['ק'],
    'r': ['ר'],
    'sh': ['ש']
};

/**
 * Check if a string contains Hebrew characters
 */
export function isHebrew(text: string): boolean {
    return /[\u0590-\u05FF]/.test(text);
}

/**
 * Transliterate Hebrew to English (approximate)
 */
export function hebrewToEnglishTransliteration(hebrew: string): string[] {
    const variants: string[] = [''];

    for (const char of hebrew) {
        const transliterations = hebrewToEnglish[char] || [char];
        const newVariants: string[] = [];

        for (const variant of variants) {
            for (const trans of transliterations) {
                newVariants.push(variant + trans);
            }
        }

        variants.length = 0;
        variants.push(...newVariants.slice(0, 10)); // Limit combinations
    }

    return variants;
}

/**
 * Transliterate English to Hebrew (approximate)
 */
export function englishToHebrewTransliteration(english: string): string[] {
    const variants: string[] = [''];
    const normalized = english.toLowerCase();

    let i = 0;
    while (i < normalized.length) {
        // Try two-character combinations first
        const twoChar = normalized.substring(i, i + 2);
        const oneChar = normalized[i];

        let transliterations: string[] = [];
        if (englishToHebrew[twoChar]) {
            transliterations = englishToHebrew[twoChar];
            i += 2;
        } else if (englishToHebrew[oneChar]) {
            transliterations = englishToHebrew[oneChar];
            i += 1;
        } else {
            transliterations = [oneChar];
            i += 1;
        }

        const newVariants: string[] = [];
        for (const variant of variants) {
            for (const trans of transliterations) {
                newVariants.push(variant + trans);
            }
        }

        variants.length = 0;
        variants.push(...newVariants.slice(0, 10)); // Limit combinations
    }

    return variants;
}

/**
 * Calculate relevance score for a search result
 * Higher score = more relevant
 */
export function calculateRelevance(
    searchTerm: string,
    targetText: string,
    fieldType: 'title' | 'description' | 'content' = 'content'
): number {
    const search = searchTerm.toLowerCase();
    const target = targetText.toLowerCase();

    let score = 0;

    // Exact match (highest priority)
    if (target === search) {
        score += 100;
    }

    // Starts with search term
    if (target.startsWith(search)) {
        score += 50;
    }

    // Contains exact search term
    if (target.includes(search)) {
        score += 30;
    }

    // Word boundary match
    const wordBoundaryRegex = new RegExp(`\\b${search}\\b`, 'i');
    if (wordBoundaryRegex.test(target)) {
        score += 20;
    }

    // Fuzzy match
    if (isFuzzyMatch(search, target, 0.2)) {
        score += 10;
    }

    // Boost for title matches
    if (fieldType === 'title') {
        score *= 2;
    } else if (fieldType === 'description') {
        score *= 1.5;
    }

    return score;
}

/**
 * Generate search variants including transliterations
 */
export function generateSearchVariants(query: string): string[] {
    const variants = new Set<string>();
    variants.add(query);
    variants.add(query.toLowerCase());

    // If Hebrew, add English transliterations
    if (isHebrew(query)) {
        const transliterations = hebrewToEnglishTransliteration(query);
        transliterations.forEach(t => variants.add(t));
    } else {
        // If English, add Hebrew transliterations
        const transliterations = englishToHebrewTransliteration(query);
        transliterations.forEach(t => variants.add(t));
    }

    return Array.from(variants);
}
