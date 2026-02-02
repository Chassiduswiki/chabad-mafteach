/**
 * Citation Parser
 *
 * Parses scholarly citation strings into structured data.
 * Supports Hebrew, English, and mixed formats.
 *
 * Examples:
 *   "ל״ש ח״ד ע׳ 345"           → Likkutei Sichos vol 4, page 345
 *   "Likkutei Sichos vol. 4, p. 345"
 *   "LS 4:345"
 *   "תניא פרק א"               → Tanya chapter 1
 *   "Torah Ohr, Bereishis 5a"
 */

export interface ParsedCitation {
  /** Confidence score 0-1 */
  confidence: number;

  /** Detected source type */
  sourceType:
    | 'likkutei_sichos'
    | 'tanya'
    | 'torah_ohr'
    | 'likkutei_torah'
    | 'maamar'
    | 'unknown';

  /** Original input text */
  original: string;

  /** Extracted volume/chelek number */
  volume?: number;

  /** Extracted page number */
  page?: number;

  /** Extracted chapter number */
  chapter?: number;

  /** Extracted parsha name */
  parsha?: string;

  /** Extracted daf/folio reference */
  daf?: string;

  /** Human-readable interpretation */
  interpretation: string;

  /** Can this be auto-resolved? */
  resolvable: boolean;

  /** Root source ID if known */
  rootSourceId?: number;
}

// Hebrew numeral mappings
const HEBREW_NUMERALS: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'יא': 11, 'יב': 12, 'יג': 13, 'יד': 14, 'טו': 15, 'טז': 16,
  'יז': 17, 'יח': 18, 'יט': 19, 'כ': 20, 'כא': 21, 'כב': 22, 'כג': 23,
  'כד': 24, 'כה': 25, 'כו': 26, 'כז': 27, 'כח': 28, 'כט': 29, 'ל': 30,
  'לא': 31, 'לב': 32, 'לג': 33, 'לד': 34, 'לה': 35, 'לו': 36, 'לז': 37,
  'לח': 38, 'לט': 39, 'מ': 40, 'מא': 41, 'מב': 42, 'מג': 43, 'מד': 44,
  'מה': 45, 'מו': 46, 'מז': 47, 'מח': 48, 'מט': 49, 'נ': 50, 'נא': 51,
  'נב': 52, 'נג': 53
};

// Reverse mapping for display
const NUMBER_TO_HEBREW: Record<number, string> = Object.fromEntries(
  Object.entries(HEBREW_NUMERALS).map(([k, v]) => [v, k])
);

// Source aliases
const SOURCE_PATTERNS: Array<{
  type: ParsedCitation['sourceType'];
  patterns: RegExp[];
  rootSourceId?: number;
}> = [
  {
    type: 'likkutei_sichos',
    rootSourceId: 256, // Your Likkutei Sichos root ID
    patterns: [
      /^ל["״]?ש\b/i,
      /^לקו["״]?ש\b/i,
      /^ליקוטי\s*שיחות\b/i,
      /^likkutei\s*sichos\b/i,
      /^lik(?:kutei)?\s*sich(?:os|ot)?\b/i,
      /^ls\b/i,
    ],
  },
  {
    type: 'tanya',
    patterns: [
      /^תניא\b/i,
      /^tanya\b/i,
      /^לקו["״]?א\b/i,
      /^ליקוטי\s*אמרים\b/i,
    ],
  },
  {
    type: 'torah_ohr',
    patterns: [
      /^תו["״]?א\b/i,
      /^תורה\s*אור\b/i,
      /^torah\s*o[h]?r\b/i,
    ],
  },
  {
    type: 'likkutei_torah',
    patterns: [
      /^לקו["״]?ת\b/i,
      /^ליקוטי\s*תורה\b/i,
      /^likkutei\s*torah\b/i,
    ],
  },
  {
    type: 'maamar',
    patterns: [
      /^ד["״]?ה\b/i,
      /^מאמר\b/i,
      /^ma['"]?amar\b/i,
    ],
  },
];

/**
 * Parse a Hebrew numeral string to a number
 */
function parseHebrewNumeral(text: string): number | null {
  // Clean up the text
  const cleaned = text.replace(/["״׳']/g, '').trim();

  // Direct lookup
  if (HEBREW_NUMERALS[cleaned]) {
    return HEBREW_NUMERALS[cleaned];
  }

  // Try to parse compound numerals (e.g., כ״ד = 24)
  let total = 0;
  let current = cleaned;

  while (current.length > 0) {
    let found = false;

    // Try longest match first
    for (let len = Math.min(current.length, 2); len >= 1; len--) {
      const substr = current.substring(0, len);
      if (HEBREW_NUMERALS[substr]) {
        total += HEBREW_NUMERALS[substr];
        current = current.substring(len);
        found = true;
        break;
      }
    }

    if (!found) break;
  }

  return total > 0 ? total : null;
}

/**
 * Extract volume number from text
 */
function extractVolume(text: string): number | null {
  // Hebrew patterns: ח״ד, חלק ד, ח׳ ד
  const hebrewPatterns = [
    /ח["״׳]([א-ת]+)/,
    /חלק\s*([א-ת]+)/,
    /ח׳?\s*([א-ת]+)/,
  ];

  for (const pattern of hebrewPatterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseHebrewNumeral(match[1]);
      if (num) return num;
    }
  }

  // English patterns: vol. 4, vol 4, volume 4, v. 4
  const englishPatterns = [
    /vol(?:ume)?\.?\s*(\d+)/i,
    /v\.?\s*(\d+)/i,
    /(\d+)\s*:/,  // LS 4:345 format
  ];

  for (const pattern of englishPatterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Extract page number from text
 */
function extractPage(text: string): number | null {
  // Hebrew patterns: ע׳ 345, עמ׳ 345, ע' 345
  const hebrewPatterns = [
    /ע["״׳']\s*(\d+)/,
    /עמ["״׳']?\s*(\d+)/,
    /עמוד\s*(\d+)/,
  ];

  for (const pattern of hebrewPatterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  // English patterns: p. 345, page 345, pp. 345
  const englishPatterns = [
    /p(?:p|age)?\.?\s*(\d+)/i,
    /:\s*(\d+)/, // LS 4:345 format
  ];

  for (const pattern of englishPatterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Extract chapter number from text
 */
function extractChapter(text: string): number | null {
  // Hebrew patterns: פרק א, פ״א
  const hebrewPatterns = [
    /פרק\s*([א-ת]+)/,
    /פ["״׳]([א-ת]+)/,
  ];

  for (const pattern of hebrewPatterns) {
    const match = text.match(pattern);
    if (match) {
      return parseHebrewNumeral(match[1]);
    }
  }

  // English patterns: chapter 1, ch. 1
  const englishPatterns = [
    /ch(?:apter)?\.?\s*(\d+)/i,
  ];

  for (const pattern of englishPatterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Extract parsha name from text
 */
function extractParsha(text: string): string | null {
  const parshiyot = [
    'בראשית', 'נח', 'לך לך', 'וירא', 'חיי שרה', 'תולדות', 'ויצא', 'וישלח',
    'וישב', 'מקץ', 'ויגש', 'ויחי', 'שמות', 'וארא', 'בא', 'בשלח', 'יתרו',
    'משפטים', 'תרומה', 'תצוה', 'כי תשא', 'ויקהל', 'פקודי', 'ויקרא', 'צו',
    'שמיני', 'תזריע', 'מצורע', 'אחרי מות', 'קדושים', 'אמור', 'בהר', 'בחוקותי',
    'במדבר', 'נשא', 'בהעלותך', 'שלח', 'קרח', 'חקת', 'בלק', 'פינחס', 'מטות',
    'מסעי', 'דברים', 'ואתחנן', 'עקב', 'ראה', 'שופטים', 'כי תצא', 'כי תבוא',
    'נצבים', 'וילך', 'האזינו', 'וזאת הברכה',
    // English transliterations
    'bereishis', 'bereshit', 'noach', 'lech lecha', 'vayeira', 'chayei sarah',
    'toldos', 'vayeitzei', 'vayishlach', 'vayeishev', 'mikeitz', 'vayigash',
    'vayechi', 'shemos', 'vaeira', 'bo', 'beshalach', 'yisro', 'mishpatim',
    'terumah', 'tetzaveh', 'ki sisa', 'vayakhel', 'pekudei',
  ];

  const lowerText = text.toLowerCase();

  for (const parsha of parshiyot) {
    if (text.includes(parsha) || lowerText.includes(parsha.toLowerCase())) {
      return parsha;
    }
  }

  return null;
}

/**
 * Main parsing function
 */
export function parseCitation(input: string): ParsedCitation {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      confidence: 0,
      sourceType: 'unknown',
      original: input,
      interpretation: 'Empty input',
      resolvable: false,
    };
  }

  // Detect source type
  let sourceType: ParsedCitation['sourceType'] = 'unknown';
  let rootSourceId: number | undefined;

  for (const source of SOURCE_PATTERNS) {
    for (const pattern of source.patterns) {
      if (pattern.test(trimmed)) {
        sourceType = source.type;
        rootSourceId = source.rootSourceId;
        break;
      }
    }
    if (sourceType !== 'unknown') break;
  }

  // Extract components
  const volume = extractVolume(trimmed);
  const page = extractPage(trimmed);
  const chapter = extractChapter(trimmed);
  const parsha = extractParsha(trimmed);

  // Build interpretation
  let interpretation = '';
  let confidence = 0;

  if (sourceType === 'likkutei_sichos') {
    interpretation = 'Likkutei Sichos';
    confidence = 0.7;

    if (volume) {
      interpretation += `, Vol. ${volume}`;
      confidence += 0.15;
    }
    if (page) {
      interpretation += `, p. ${page}`;
      confidence += 0.1;
    }
    if (parsha) {
      interpretation += ` (${parsha})`;
    }
  } else if (sourceType === 'tanya') {
    interpretation = 'Tanya';
    confidence = 0.7;

    if (chapter) {
      interpretation += `, Chapter ${chapter}`;
      confidence += 0.2;
    }
    if (page) {
      interpretation += `, p. ${page}`;
    }
  } else if (sourceType !== 'unknown') {
    interpretation = sourceType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    confidence = 0.5;

    if (volume) interpretation += `, Vol. ${volume}`;
    if (page) interpretation += `, p. ${page}`;
    if (chapter) interpretation += `, Ch. ${chapter}`;
    if (parsha) interpretation += ` (${parsha})`;
  } else {
    interpretation = 'Could not identify source';
    confidence = 0;
  }

  // Determine if resolvable
  const resolvable =
    sourceType === 'likkutei_sichos' && !!volume && !!page && !!rootSourceId;

  return {
    confidence: Math.min(confidence, 1),
    sourceType,
    original: input,
    volume: volume || undefined,
    page: page || undefined,
    chapter: chapter || undefined,
    parsha: parsha || undefined,
    interpretation,
    resolvable,
    rootSourceId,
  };
}

/**
 * Check if text looks like a citation
 */
export function looksLikeCitation(text: string): boolean {
  const trimmed = text.trim();

  // Quick checks for common citation patterns
  const citationIndicators = [
    /^ל["״]?ש/,
    /^תניא/,
    /^תו["״]?א/,
    /^לקו["״]?ת/,
    /vol\./i,
    /p\.\s*\d+/i,
    /ע["״׳']\s*\d+/,
    /פרק/,
    /chapter/i,
  ];

  return citationIndicators.some(pattern => pattern.test(trimmed));
}

/**
 * Format a volume number as Hebrew
 */
export function formatHebrewVolume(num: number): string {
  return NUMBER_TO_HEBREW[num] || num.toString();
}
