/**
 * Utility functions for handling and validating slugs
 */

/**
 * Validate slug format - alphanumeric with hyphens, no spaces or special chars
 * @param slug The slug to validate
 * @returns boolean indicating if the slug is valid
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Normalize slug - lowercase, replace spaces with hyphens, remove special chars
 * @param input The string to normalize into a slug
 * @returns A normalized slug
 */
export function normalizeSlug(input: string): string {
  if (!input) return '';
  
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars except hyphens
    .replace(/\-\-+/g, '-')     // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')         // Trim hyphens from start
    .replace(/-+$/, '');        // Trim hyphens from end
}

/**
 * Generate alternative slugs when the original is taken
 * @param slug The base slug
 * @returns Array of alternative slug suggestions
 */
export function generateAlternativeSlugs(slug: string): string[] {
  const timestamp = new Date().getTime().toString().slice(-4);
  return [
    `${slug}-${timestamp}`,
    `${slug}-alt`,
    `${slug}-concept`,
    `${slug}-topic`
  ];
}

/**
 * Validate slug length
 * @param slug The slug to check
 * @param minLength Minimum required length (default: 3)
 * @returns boolean indicating if the slug meets minimum length
 */
export function isValidSlugLength(slug: string, minLength: number = 3): boolean {
  return slug.length >= minLength;
}
