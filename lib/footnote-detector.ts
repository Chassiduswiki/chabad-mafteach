export interface Footnote {
  id: string;
  marker: string;
  text: string;
  pageNumber: number;
  position: 'bottom' | 'inline' | 'endnote';
  references?: string[]; // Potential main text references
  confidence: number; // 0-1 confidence score
}

export interface FootnoteDetectionResult {
  footnotes: Footnote[];
  mainText: string; // Text with footnote markers removed
  detectionStats: {
    totalFootnotes: number;
    confidence: number;
    method: string;
  };
}

export class FootnoteDetector {
  // Common Hebrew footnote markers
  private readonly HEBREW_LETTERS = [
    'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת',
    'ך', 'ם', 'ן', 'ף', 'ץ' // Final forms
  ];

  private readonly NUMBER_PATTERNS = [
    /^\d+[\.\)\]\s]/,  // 1. or 1) or 1] or 1 followed by space
    /^\(\d+\)/,        // (1)
    /^\[\d+\]/,        // [1]
    /^\d+\)/,          // 1)
    /^\d+\]/,          // 1]
    /^\d+:/            // 1:
  ];

  private readonly HEBREW_PATTERNS = [
    /^[\u0590-\u05FF]+[\.\)\]\s]/, // Hebrew letter followed by punctuation
    /^\([\u0590-\u05FF]+\)/,       // (א)
    /^\[[\u0590-\u05FF]+\]/,       // [א]
    /^[\u0590-\u05FF]+\)/,         // א)
    /^[\u0590-\u05FF]+\]/,         // א]
    /^[\u0590-\u05FF]+:/           // א:
  ];

  /**
   * Detect footnotes in a page of text
   */
  detectFootnotes(pageText: string, pageNumber: number): FootnoteDetectionResult {
    const lines = pageText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const footnotes: Footnote[] = [];
    let mainText = pageText;
    let totalConfidence = 0;

    // Method 1: Bottom region detection (most common)
    const bottomRegionResult = this.detectBottomRegionFootnotes(lines, pageNumber);
    if (bottomRegionResult.footnotes.length > 0) {
      footnotes.push(...bottomRegionResult.footnotes);
      mainText = bottomRegionResult.mainText;
      totalConfidence += bottomRegionResult.confidence;
    }

    // Method 2: Inline footnote detection (less common)
    const inlineResult = this.detectInlineFootnotes(mainText, pageNumber);
    if (inlineResult.footnotes.length > 0) {
      footnotes.push(...inlineResult.footnotes);
      mainText = inlineResult.mainText;
      totalConfidence += inlineResult.confidence * 0.5; // Lower weight for inline
    }

    // Method 3: Endnote detection
    const endnoteResult = this.detectEndnotes(mainText, pageNumber);
    if (endnoteResult.footnotes.length > 0) {
      footnotes.push(...endnoteResult.footnotes);
      mainText = endnoteResult.mainText;
      totalConfidence += endnoteResult.confidence * 0.8; // Higher weight for endnotes
    }

    // Calculate overall confidence
    const avgConfidence = footnotes.length > 0 ? totalConfidence / footnotes.length : 0;

    return {
      footnotes,
      mainText,
      detectionStats: {
        totalFootnotes: footnotes.length,
        confidence: Math.min(avgConfidence, 1.0),
        method: this.getDetectionMethod(footnotes)
      }
    };
  }

  /**
   * Detect footnotes in the bottom region of a page (most common method)
   */
  private detectBottomRegionFootnotes(lines: string[], pageNumber: number): FootnoteDetectionResult {
    if (lines.length < 3) {
      return { footnotes: [], mainText: lines.join('\n'), detectionStats: { totalFootnotes: 0, confidence: 0, method: 'bottom' } };
    }

    // Consider bottom 25-40% of page as potential footnote region
    const footnoteRegionStart = Math.floor(lines.length * 0.6); // Start at 60% from top
    const footnoteRegion = lines.slice(footnoteRegionStart);
    const mainTextLines = lines.slice(0, footnoteRegionStart);

    const footnotes: Footnote[] = [];
    let remainingLines = [...footnoteRegion];

    // Look for footnote markers in the footnote region
    for (let i = 0; i < remainingLines.length; i++) {
      const line = remainingLines[i];
      const footnote = this.extractFootnoteFromLine(line, pageNumber, 'bottom');

      if (footnote) {
        footnotes.push(footnote);

        // Remove this line from remaining text
        remainingLines.splice(i, 1);
        i--; // Adjust index after removal

        // Continue collecting footnote text until next marker or end
        let footnoteEndIndex = i + 1;
        while (footnoteEndIndex < remainingLines.length) {
          const nextLine = remainingLines[footnoteEndIndex];
          if (this.isFootnoteMarker(nextLine)) {
            break; // Stop at next footnote marker
          }
          footnote.text += ' ' + nextLine;
          footnoteEndIndex++;
        }

        // Remove collected footnote lines
        remainingLines.splice(i, footnoteEndIndex - i);
        i--; // Reset index
      }
    }

    // If we found footnotes, remove them from the page text
    const cleanMainText = footnotes.length > 0
      ? [...mainTextLines, ...remainingLines].join('\n')
      : lines.join('\n');

    const confidence = footnotes.length > 0 ? 0.8 : 0; // High confidence for bottom region detection

    return {
      footnotes,
      mainText: cleanMainText,
      detectionStats: { totalFootnotes: footnotes.length, confidence, method: 'bottom' }
    };
  }

  /**
   * Detect inline footnotes (less common)
   */
  private detectInlineFootnotes(text: string, pageNumber: number): FootnoteDetectionResult {
    // This is more complex - inline footnotes are typically marked with symbols
    // For now, we'll focus on the bottom region method which is most common
    return {
      footnotes: [],
      mainText: text,
      detectionStats: { totalFootnotes: 0, confidence: 0, method: 'inline' }
    };
  }

  /**
   * Detect endnotes (collected at end of chapter/section)
   */
  private detectEndnotes(text: string, pageNumber: number): FootnoteDetectionResult {
    // Endnotes are typically at the very end of a document section
    // For now, we'll rely on the bottom region detection
    return {
      footnotes: [],
      mainText: text,
      detectionStats: { totalFootnotes: 0, confidence: 0, method: 'endnote' }
    };
  }

  /**
   * Extract a footnote from a single line if it starts with a marker
   */
  private extractFootnoteFromLine(line: string, pageNumber: number, position: 'bottom' | 'inline' | 'endnote'): Footnote | null {
    const trimmed = line.trim();

    // Check for Hebrew letter markers
    for (const letter of this.HEBREW_LETTERS) {
      if (trimmed.startsWith(letter)) {
        const afterMarker = trimmed.substring(letter.length).trim();
        // Look for separator characters
        if (afterMarker.startsWith('.') || afterMarker.startsWith(')') || afterMarker.startsWith(']') ||
            afterMarker.startsWith(':') || afterMarker.startsWith(' ')) {

          const text = afterMarker.replace(/^[\.\)\]\:\s]+/, '').trim();
          if (text.length > 0) {
            return {
              id: `fn_${pageNumber}_${letter}`,
              marker: letter,
              text,
              pageNumber,
              position,
              confidence: 0.9 // High confidence for Hebrew letter markers
            };
          }
        }
      }
    }

    // Check for number patterns
    for (const pattern of this.NUMBER_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        const marker = match[0];
        const text = trimmed.substring(marker.length).trim();
        if (text.length > 0) {
          return {
            id: `fn_${pageNumber}_${marker.replace(/[^\d]/g, '')}`,
            marker,
            text,
            pageNumber,
            position,
            confidence: 0.85 // High confidence for numbered markers
          };
        }
      }
    }

    // Check for Hebrew patterns
    for (const pattern of this.HEBREW_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        const marker = match[0];
        const text = trimmed.substring(marker.length).trim();
        if (text.length > 0) {
          return {
            id: `fn_${pageNumber}_${marker}`,
            marker,
            text,
            pageNumber,
            position,
            confidence: 0.8 // Good confidence for Hebrew patterns
          };
        }
      }
    }

    return null;
  }

  /**
   * Check if a line starts with a footnote marker
   */
  private isFootnoteMarker(line: string): boolean {
    const trimmed = line.trim();

    // Check Hebrew letters
    for (const letter of this.HEBREW_LETTERS) {
      if (trimmed.startsWith(letter) &&
          (trimmed[letter.length] === '.' ||
           trimmed[letter.length] === ')' ||
           trimmed[letter.length] === ']' ||
           trimmed[letter.length] === ':' ||
           trimmed[letter.length] === ' ')) {
        return true;
      }
    }

    // Check number patterns
    for (const pattern of this.NUMBER_PATTERNS) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get the primary detection method used
   */
  private getDetectionMethod(footnotes: Footnote[]): string {
    if (footnotes.length === 0) return 'none';

    const methods = footnotes.map(fn => fn.position);
    const bottomCount = methods.filter(m => m === 'bottom').length;
    const inlineCount = methods.filter(m => m === 'inline').length;
    const endnoteCount = methods.filter(m => m === 'endnote').length;

    if (bottomCount >= inlineCount && bottomCount >= endnoteCount) return 'bottom';
    if (inlineCount >= bottomCount && inlineCount >= endnoteCount) return 'inline';
    return 'endnote';
  }

  /**
   * Find potential references in main text for footnotes
   */
  findReferences(footnotes: Footnote[], mainText: string): void {
    for (const footnote of footnotes) {
      const references: string[] = [];

      // Look for the footnote marker in the main text
      const markerRegex = new RegExp(footnote.marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = mainText.match(markerRegex);

      if (matches) {
        // Find context around each marker occurrence
        let searchIndex = 0;
        for (const match of matches) {
          const markerIndex = mainText.indexOf(match, searchIndex);
          if (markerIndex !== -1) {
            // Get surrounding context (50 chars before and after)
            const start = Math.max(0, markerIndex - 50);
            const end = Math.min(mainText.length, markerIndex + match.length + 50);
            const context = mainText.substring(start, end);
            references.push(context.trim());
            searchIndex = markerIndex + match.length;
          }
        }
      }

      footnote.references = references;
    }
  }

  /**
   * Post-process footnotes to improve quality
   */
  postProcessFootnotes(footnotes: Footnote[]): Footnote[] {
    return footnotes.map(footnote => {
      // Clean up footnote text
      let cleanText = footnote.text
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Remove common artifacts
      cleanText = cleanText.replace(/^[\.\)\]\:\s]+/, ''); // Remove leading punctuation

      return {
        ...footnote,
        text: cleanText,
        // Adjust confidence based on text quality
        confidence: cleanText.length > 10 ? footnote.confidence : footnote.confidence * 0.7
      };
    });
  }
}

// Singleton instance
let footnoteDetector: FootnoteDetector | null = null;

export function getFootnoteDetector(): FootnoteDetector {
  if (!footnoteDetector) {
    footnoteDetector = new FootnoteDetector();
  }
  return footnoteDetector;
}
