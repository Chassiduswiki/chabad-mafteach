export interface GlossaryDefinition {
    id: number;
    text: string;
}

export interface GlossaryItem {
    term: string;
    hebrew?: string;
    definitions: GlossaryDefinition[];
}

export function parseGlossaryContent(text: string, defaultTerm?: string, defaultHebrew?: string): GlossaryItem[] | null {
    if (!text) return null;

    // Pattern: Term (Hebrew) - or just Term - followed by numbered list
    // This regex looks for the pattern "Words – Hebrew 1." or "Words – 1."
    // It's specific to the user's provided format.

    // Split by common delimiters that might separate major terms if double spacing exists
    // But since the user provided a block, we might need to parse linearly.

    const items: GlossaryItem[] = [];

    // Normalize text
    const cleanText = text.replace(/&nbsp;/g, ' ').replace(/\r\n/g, '\n');

    // Regex to find "Term – Hebrew" or similar headers followed by "1."
    // We look for a phrase ending in a dash or similar separator, or just a known structure
    // Strategy: Split by the start of a definition list "1." which usually follows a term.

    // Improved Regex approach:
    // Captures: 1=Term, 2=Hebrew(optional), 3=DefinitionBody
    // We loop through the string finding matches.

    // The user's example: 
    // "Taam Va'daas – טעם ודעת 1. Logic..."
    // "Pnimiyus – פנימיות 1. Motivation..."

    // Regex breakdown:
    // ([A-Za-z\s'()]+?)             -> Group 1: English Term (letters, spaces, quotes, parentheses)
    // [–-—]\s*                    -> Separator (en-dash, hyphen, em-dash)
    // ([^\d]+?)\s*               -> Group 2: Hebrew/Other (non-digits up to the number)
    // ((?:1\.[\s\S]+?)+)              -> Group 3: The definitions starting with 1.
    // Lookahead for next term or end of string

    // We replace . with [\s\S] to match newlines without the 's' flag
    const blockRegex = /([A-Za-z0-9\s'()]+?)\s*[–-—]\s*([^\d]+?)\s*((?:1\.[\s\S]+?)+)(?=(?:[A-Za-z0-9\s'()]+?\s*[–-—]\s*[^\d]+?1\.)|$)/g;

    let match;
    while ((match = blockRegex.exec(cleanText)) !== null) {
        const [_, term, hebrew, defsBlock] = match;

        // Parse definitions
        const definitions: GlossaryDefinition[] = [];
        // The 's' flag is removed. The `[^0-9]` already matches newlines, so `[\s\S]` is not needed here.
        const defRegex = /(\d+)\.\s*([^0-9]+?)(?=(?:\d+\.)|$)/g;
        let defMatch;

        while ((defMatch = defRegex.exec(defsBlock)) !== null) {
            definitions.push({
                id: parseInt(defMatch[1]),
                text: defMatch[2].trim()
            });
        }

        if (definitions.length > 0) {
            items.push({
                term: term.trim(),
                hebrew: hebrew.trim(),
                definitions
            });
        }
    }

    // Heuristic: If we found at least 2 structured items, or 1 item with multiple definitions
    if (items.length > 0) return items;

    // FALLBACK: Single Term List
    // If text starts with "1." and we have a default term, parse as a single glossary item
    // Use trim() to avoid whitespace issues
    // Check if it starts with "1." or similar pattern
    if (cleanText.trim().startsWith('1.') && defaultTerm) {
        const definitions: GlossaryDefinition[] = [];
        // Use safe regex for definitions running to end of string or next number
        const defRegex = /(\d+)\.\s*([\s\S]+?)(?=(?:\d+\.)|$)/g;
        let defMatch;

        while ((defMatch = defRegex.exec(cleanText)) !== null) {
            definitions.push({
                id: parseInt(defMatch[1]),
                text: defMatch[2].trim()
            });
        }

        if (definitions.length > 0) {
            return [{
                term: defaultTerm,
                hebrew: defaultHebrew,
                definitions
            }];
        }
    }

    return null;
}
