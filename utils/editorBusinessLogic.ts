/**
 * Business logic utilities for editor operations
 * Extracted from UI components to improve maintainability and testability
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates paragraph data before saving
 */
export function validateParagraph(text: string): ValidationResult {
  const errors: string[] = [];

  if (!text || text.trim().length === 0) {
    errors.push('Paragraph text cannot be empty');
  }

  if (text.length > 10000) {
    errors.push('Paragraph text cannot exceed 10,000 characters');
  }

  // Check for potentially problematic HTML
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      errors.push('Paragraph contains potentially unsafe content');
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates statement data before saving
 */
export function validateStatement(text: string): ValidationResult {
  const errors: string[] = [];

  if (!text || text.trim().length === 0) {
    errors.push('Statement text cannot be empty');
  }

  if (text.length > 5000) {
    errors.push('Statement text cannot exceed 5,000 characters');
  }

  // Check for basic HTML structure
  if (!text.includes('<p>') && !text.includes('<div>') && text.length > 100) {
    // If it's long text without HTML tags, it might be malformed
    // This is a soft warning, not an error
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates translation data before saving
 */
export function validateTranslation(
  originalText: string,
  translatedText: string,
  languageCode: string
): ValidationResult {
  const errors: string[] = [];

  if (!translatedText || translatedText.trim().length === 0) {
    errors.push('Translation text cannot be empty');
  }

  if (!languageCode || languageCode.trim().length === 0) {
    errors.push('Language code is required');
  }

  if (!originalText || originalText.trim().length === 0) {
    errors.push('Original text is required for translation');
  }

  // Check if translation is suspiciously similar to original (for different languages)
  if (languageCode !== 'en' && translatedText === originalText) {
    errors.push('Translation appears to be identical to original text');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates the next order key using a simple incremental approach
 * This is a simplified version - in production you might want LexoRank or similar
 */
export function generateNextOrderKey(existingOrderKeys: number[]): number {
  if (existingOrderKeys.length === 0) {
    return 1;
  }

  const maxOrder = Math.max(...existingOrderKeys);
  return maxOrder + 1;
}

/**
 * Reorders items by updating their order keys
 */
export function reorderItems<T extends { id: number; order_key: number }>(
  items: T[],
  startIndex: number,
  endIndex: number
): T[] {
  const reorderedItems = [...items];
  const [movedItem] = reorderedItems.splice(startIndex, 1);
  reorderedItems.splice(endIndex, 0, movedItem);

  // Update order keys
  reorderedItems.forEach((item, index) => {
    item.order_key = index + 1;
  });

  return reorderedItems;
}

/**
 * Sanitizes HTML content for safe display
 * This is a basic implementation - in production use a proper HTML sanitizer
 */
export function sanitizeHtmlContent(html: string): string {
  // Remove script tags and event handlers
  let sanitized = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, (match) => {
      // Remove event handlers but keep the tag
      return match.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    });

  return sanitized;
}

/**
 * Extracts plain text from HTML content
 */
export function extractPlainTextFromHtml(html: string): string {
  // Basic HTML to text conversion
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&')  // Replace common entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * Calculates word count for text content
 */
export function calculateWordCount(text: string): number {
  if (!text) return 0;

  // Remove HTML tags if present
  const plainText = extractPlainTextFromHtml(text);

  // Split by whitespace and filter out empty strings
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Estimates reading time based on word count (average 200 words per minute)
 */
export function estimateReadingTime(text: string): number {
  const wordCount = calculateWordCount(text);
  return Math.ceil(wordCount / 200); // minutes
}

/**
 * Checks if content contains Hebrew text
 */
export function containsHebrewText(text: string): boolean {
  // Hebrew Unicode range: \u0590-\u05FF
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}

/**
 * Determines the primary language of content
 */
export function detectPrimaryLanguage(text: string): 'hebrew' | 'english' | 'mixed' | 'unknown' {
  const plainText = extractPlainTextFromHtml(text);
  const hasHebrew = containsHebrewText(plainText);
  const hasEnglish = /[a-zA-Z]/.test(plainText);

  if (hasHebrew && hasEnglish) return 'mixed';
  if (hasHebrew) return 'hebrew';
  if (hasEnglish) return 'english';
  return 'unknown';
}
