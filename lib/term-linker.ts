import { Topic } from './directus';

/**
 * Auto-links terms in the content to their respective topic pages.
 * Only links the first occurrence of each term.
 */
export function linkTerms(content: string, terms: Topic[]): string {
    if (!content || !terms.length) return content;

    let linkedContent = content;
    const linkedTerms = new Set<string>();

    // Sort terms by length (descending) to prioritize longer phrases
    // e.g. "Ahavas Yisroel" before "Ahavas"
    const sortedTerms = [...terms].sort((a, b) => {
        const aName = a.name || a.canonical_title || '';
        const bName = b.name || b.canonical_title || '';
        return bName.length - aName.length;
    });

    // Create a map of placeholders to final links to avoid nested linking
    // e.g. preventing [Bittul] becoming [[Bittul]...]
    const replacements: { placeholder: string; link: string }[] = [];

    sortedTerms.forEach((term, index) => {
        const termName = term.name || term.canonical_title;
        if (!termName) return;
        
        // Skip if already linked (though we only link first occurrence, this helps if we have synonyms)
        if (linkedTerms.has(term.slug)) return;

        // Escape regex special characters
        const escapedName = termName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Look for whole words only, case insensitive
        const regex = new RegExp(`\\b(${escapedName})\\b`, 'i');

        // Find first match
        const match = linkedContent.match(regex);

        if (match && match.index !== undefined) {
            // We found a match. We want to replace it, but we need to be careful not to 
            // replace inside existing markdown links or HTML attributes.
            // For simplicity in this iteration, we'll assume plain markdown text.
            // A more robust solution would parse the AST.

            // Check if we are inside a link (simple heuristic: check for nearby brackets)
            // This is a basic check and might need refinement
            const precedingText = linkedContent.substring(0, match.index);
            const followingText = linkedContent.substring(match.index + match[0].length);

            const openBracket = precedingText.lastIndexOf('[');
            const closeBracket = precedingText.lastIndexOf(']');
            const openParen = precedingText.lastIndexOf('(');
            const closeParen = precedingText.lastIndexOf(')');

            // If we are likely inside a link, skip
            if ((openBracket > closeBracket) || (openParen > closeParen)) {
                return;
            }

            // Generate a unique placeholder
            const placeholder = `__TERM_${index}__`;

            // Store the replacement
            replacements.push({
                placeholder,
                link: `[${match[0]}](lookup:${term.slug})`
            });

            // Replace only the first occurrence with placeholder
            linkedContent = linkedContent.replace(regex, placeholder);

            linkedTerms.add(term.slug);
        }
    });

    // Restore placeholders with actual links
    replacements.forEach(({ placeholder, link }) => {
        linkedContent = linkedContent.replace(placeholder, link);
    });

    return linkedContent;
}
