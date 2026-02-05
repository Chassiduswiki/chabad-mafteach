/**
 * Citation Formatter
 *
 * Transforms source data into clean, scholarly English citations.
 *
 * Example:
 *   Input:  { title: "חכח ע' 33 (נשא א)", page_number: 33, page_count: 7, parsha: "נשא", metadata: { chelek: "חלק כח" } }
 *   Output: "Likkutei Sichos, vol. 28, pp. 33-39 (Nasso 1)"
 */

// Hebrew numeral to number
const HEBREW_TO_NUMBER: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'יא': 11, 'יב': 12, 'יג': 13, 'יד': 14, 'טו': 15, 'טז': 16,
  'יז': 17, 'יח': 18, 'יט': 19, 'כ': 20, 'כא': 21, 'כב': 22, 'כג': 23,
  'כד': 24, 'כה': 25, 'כו': 26, 'כז': 27, 'כח': 28, 'כט': 29, 'ל': 30,
  'לא': 31, 'לב': 32, 'לג': 33, 'לד': 34, 'לה': 35, 'לו': 36, 'לז': 37,
  'לח': 38, 'לט': 39, 'מ': 40, 'מא': 41, 'מב': 42, 'מג': 43, 'מד': 44,
  'מה': 45, 'מו': 46, 'מז': 47, 'מח': 48, 'מט': 49, 'נ': 50, 'נא': 51,
  'נב': 52, 'נג': 53
};

// Parsha transliterations (Hebrew → English)
const PARSHA_TRANSLITERATIONS: Record<string, string> = {
  // Bereishis
  'בראשית': 'Bereishis',
  'נח': 'Noach',
  'לך לך': 'Lech Lecha',
  'לך': 'Lech Lecha',
  'וירא': 'Vayeira',
  'חיי שרה': 'Chayei Sarah',
  'חיי': 'Chayei Sarah',
  'תולדות': 'Toldos',
  'ויצא': 'Vayeitzei',
  'וישלח': 'Vayishlach',
  'וישב': 'Vayeishev',
  'מקץ': 'Mikeitz',
  'ויגש': 'Vayigash',
  'ויחי': 'Vayechi',

  // Shemos
  'שמות': 'Shemos',
  'וארא': 'Vaeira',
  'בא': 'Bo',
  'בשלח': 'Beshalach',
  'יתרו': 'Yisro',
  'משפטים': 'Mishpatim',
  'תרומה': 'Terumah',
  'תצוה': 'Tetzaveh',
  'כי תשא': 'Ki Sisa',
  'ויקהל': 'Vayakhel',
  'פקודי': 'Pekudei',

  // Vayikra
  'ויקרא': 'Vayikra',
  'צו': 'Tzav',
  'שמיני': 'Shemini',
  'תזריע': 'Tazria',
  'מצורע': 'Metzora',
  'אחרי מות': 'Acharei Mos',
  'אחרי': 'Acharei',
  'קדושים': 'Kedoshim',
  'אמור': 'Emor',
  'בהר': 'Behar',
  'בחוקותי': 'Bechukosai',
  'בחוקתי': 'Bechukosai',

  // Bamidbar
  'במדבר': 'Bamidbar',
  'נשא': 'Nasso',
  'בהעלותך': 'Behaaloscha',
  'בהעלתך': 'Behaaloscha',
  'שלח': 'Shelach',
  'קרח': 'Korach',
  'חקת': 'Chukas',
  'בלק': 'Balak',
  'פינחס': 'Pinchas',
  'מטות': 'Matos',
  'מסעי': 'Masei',

  // Devarim
  'דברים': 'Devarim',
  'ואתחנן': 'Vaeschanan',
  'עקב': 'Eikev',
  'ראה': 'Re\'eh',
  'שופטים': 'Shoftim',
  'כי תצא': 'Ki Seitzei',
  'כי תבוא': 'Ki Savo',
  'נצבים': 'Nitzavim',
  'וילך': 'Vayeilech',
  'האזינו': 'Haazinu',
  'וזאת הברכה': 'V\'zos Habracha',
  'ברכה': 'V\'zos Habracha',
};

// Root source info for formatting
interface RootSourceInfo {
  englishName: string;
  hebrewName: string;
  citationPrefix: string;
}

const ROOT_SOURCES: Record<number, RootSourceInfo> = {
  256: {
    englishName: 'Likkutei Sichos',
    hebrewName: 'ליקוטי שיחות',
    citationPrefix: 'Likkutei Sichos',
  },
  // Add more as you import them
};

export interface SourceForFormatting {
  id: number;
  title: string;
  parent_id?: number | null;
  page_number?: number | null;
  page_count?: number | null;
  parsha?: string | null;
  metadata?: {
    chelek?: string;
    volume_number?: number;
    type?: string;
    [key: string]: any;
  } | null;
  // Optional: pass in parent/root info if known
  rootSourceId?: number;
  volumeTitle?: string;
}

export interface FormattedCitation {
  /** Full formatted citation string */
  full: string;
  /** Just the source name (e.g., "Likkutei Sichos") */
  sourceName: string;
  /** Volume reference (e.g., "vol. 28") */
  volume?: string;
  /** Page reference (e.g., "pp. 33-39" or "p. 33") */
  pages?: string;
  /** Parsha/section reference (e.g., "Nasso 1") */
  section?: string;
  /** The external URL if available */
  url?: string;
}

/**
 * Extract volume number from Hebrew chelek string like "חלק כח" or title like "Likkutei Sichos חלק כח"
 */
function extractVolumeNumber(text: string): number | null {
  // Try to find "חלק X" pattern
  const chelekMatch = text.match(/חלק\s*([א-ת]+)/);
  if (chelekMatch) {
    return parseHebrewNumeral(chelekMatch[1]);
  }

  // Try to find "ח״X" pattern in title (like "חכח ע' 33")
  const shortMatch = text.match(/^ח["״׳]?([א-ת]+)/);
  if (shortMatch) {
    return parseHebrewNumeral(shortMatch[1]);
  }

  // Try standalone Hebrew letters
  const standaloneMatch = text.match(/([א-ת]{1,2})(?:\s|$)/);
  if (standaloneMatch) {
    const num = parseHebrewNumeral(standaloneMatch[1]);
    if (num && num <= 50) return num;
  }

  return null;
}

/**
 * Parse Hebrew numeral to number
 */
function parseHebrewNumeral(text: string): number | null {
  const cleaned = text.replace(/["״׳']/g, '').trim();

  // Direct lookup
  if (HEBREW_TO_NUMBER[cleaned]) {
    return HEBREW_TO_NUMBER[cleaned];
  }

  // Try compound (e.g., כח = כ + ח = 20 + 8 = 28)
  let total = 0;
  for (const char of cleaned) {
    if (HEBREW_TO_NUMBER[char]) {
      total += HEBREW_TO_NUMBER[char];
    }
  }

  return total > 0 ? total : null;
}

/**
 * Transliterate parsha name to English
 */
function transliterateParsha(hebrewParsha: string): string {
  // Direct lookup
  if (PARSHA_TRANSLITERATIONS[hebrewParsha]) {
    return PARSHA_TRANSLITERATIONS[hebrewParsha];
  }

  // Try without spaces/prefixes
  const cleaned = hebrewParsha.trim();
  for (const [heb, eng] of Object.entries(PARSHA_TRANSLITERATIONS)) {
    if (cleaned.includes(heb) || heb.includes(cleaned)) {
      return eng;
    }
  }

  // Return original if no match
  return hebrewParsha;
}

/**
 * Extract sicha number from title (e.g., "נשא א" → 1, "נשא ב" → 2)
 */
function extractSichaNumber(title: string, parsha: string): number | null {
  // Look for Hebrew letter after parsha name indicating sicha number
  // Pattern: parsha name followed by space and single Hebrew letter
  const pattern = new RegExp(`${parsha}\\s*([א-י])(?:\\)|$|\\s)`, 'i');
  const match = title.match(pattern);

  if (match) {
    return parseHebrewNumeral(match[1]);
  }

  // Also check in parentheses like "(נשא א)"
  const parenMatch = title.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const innerMatch = parenMatch[1].match(/([א-י])$/);
    if (innerMatch) {
      return parseHebrewNumeral(innerMatch[1]);
    }
  }

  return null;
}

/**
 * Format a source into a clean English citation
 */
export function formatCitation(source: SourceForFormatting): FormattedCitation {
  const result: FormattedCitation = {
    full: '',
    sourceName: '',
  };

  // Determine the root source type
  const rootInfo = source.rootSourceId ? ROOT_SOURCES[source.rootSourceId] : null;

  // Check if this is specifically a Likkutei Sichos source
  // ONLY true if:
  // 1. rootSourceId is explicitly 256 (ROOT_SOURCES has it)
  // 2. OR metadata explicitly marks it as type='sicha' AND volumeTitle contains 'Likkutei Sichos'
  // Do NOT match on title alone - too many false positives
  const isLikkuteiSichos =
    rootInfo?.citationPrefix === 'Likkutei Sichos' ||
    (source.metadata?.type === 'sicha' && source.volumeTitle?.includes('Likkutei Sichos'));

  // For Likkutei Sichos
  if (isLikkuteiSichos) {
    result.sourceName = 'Likkutei Sichos';

    // Get volume number
    let volumeNum: number | null = null;

    if (source.metadata?.volume_number) {
      volumeNum = source.metadata.volume_number;
    } else if (source.metadata?.chelek) {
      volumeNum = extractVolumeNumber(source.metadata.chelek);
    } else if (source.volumeTitle) {
      volumeNum = extractVolumeNumber(source.volumeTitle);
    } else {
      // Try to extract from title (e.g., "חכח ע' 33")
      volumeNum = extractVolumeNumber(source.title);
    }

    if (volumeNum) {
      result.volume = `vol. ${volumeNum}`;
    }

    // Format page range
    if (source.page_number) {
      const startPage = source.page_number;
      const endPage = source.page_count && source.page_count > 1
        ? startPage + source.page_count - 1
        : null;

      if (endPage && endPage > startPage) {
        result.pages = `pp. ${startPage}-${endPage}`;
      } else {
        result.pages = `p. ${startPage}`;
      }
    }

    // Format parsha/section
    if (source.parsha) {
      const englishParsha = transliterateParsha(source.parsha);
      const sichaNum = extractSichaNumber(source.title, source.parsha);

      if (sichaNum) {
        result.section = `${englishParsha} ${sichaNum}`;
      } else {
        result.section = englishParsha;
      }
    }

    // Build full citation
    const parts = [result.sourceName];
    if (result.volume) parts.push(result.volume);
    if (result.pages) parts.push(result.pages);

    result.full = parts.join(', ');

    if (result.section) {
      result.full += ` (${result.section})`;
    }

    return result;
  }

  // Default: use title as-is
  result.sourceName = source.title;
  result.full = source.title;

  if (source.page_number) {
    const startPage = source.page_number;
    const endPage = source.page_count && source.page_count > 1
      ? startPage + source.page_count - 1
      : null;

    if (endPage && endPage > startPage) {
      result.pages = `pp. ${startPage}-${endPage}`;
    } else {
      result.pages = `p. ${startPage}`;
    }
    result.full += `, ${result.pages}`;
  }

  return result;
}

/**
 * Quick format for display in UI (just returns the full string)
 */
export function formatCitationString(source: SourceForFormatting): string {
  return formatCitation(source).full;
}
