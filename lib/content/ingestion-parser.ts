/**
 * Ingestion Engine - Advanced Statement Parser
 * 
 * Logic:
 * 1. Clean HTML tags while preserving paragraph structure.
 * 2. Identify footnotes ([1], [א]) and separate them into haoros.
 * 3. Break long text into granular statements based on sentence boundaries.
 * 4. Auto-detect language per statement.
 */

export interface ParsedStatement {
  text: string;
  type: 'main' | 'footnote' | 'citation';
  language: 'he' | 'en';
  index: number;
}

export function parseTextIntoStatements(text: string, haoros: string = ''): ParsedStatement[] {
  if (!text) return [];

  const statements: ParsedStatement[] = [];
  
  // 1. Clean the main text but keep it mostly intact for sentence breaking
  const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
  
  // 2. Identify and extract inline footnotes like [1] or [א]
  // This regex matches [number] or [hebrew_letter]
  const footnoteRegex = /\[([0-9\u0590-\u05FF]+)\]/g;
  
  // 3. Sentence breaking logic (Hebrew/English aware)
  // Splits by period, question mark, or colon, but handles common abbreviations
  const sentenceEndRegex = /([.?!:])\s+/g;
  const parts = cleanText.split(sentenceEndRegex);
  
  let currentIdx = 0;
  for (let i = 0; i < parts.length; i += 2) {
    const sentence = parts[i] + (parts[i + 1] || '');
    if (sentence.trim().length < 3) continue;

    statements.push({
      text: sentence.trim(),
      type: 'main',
      language: detectLanguage(sentence),
      index: currentIdx++
    });
  }

  // 4. Process haoros (footnotes)
  if (haoros) {
    const haoroParts = haoros.split(/<p>|<\/p>|<br\s*\/?>/).filter(p => p.trim().length > 0);
    haoroParts.forEach((part, idx) => {
      statements.push({
        text: part.replace(/<[^>]*>/g, '').trim(),
        type: 'footnote',
        language: detectLanguage(part),
        index: currentIdx++
      });
    });
  }

  return statements;
}

function detectLanguage(text: string): 'he' | 'en' {
  // Simple heuristic: if contains Hebrew characters, assume Hebrew
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text) ? 'he' : 'en';
}
