/**
 * Sefer Import Configuration Schema
 *
 * This defines the structure for importing any hierarchical sefer into the sources table.
 * The system supports up to 3 levels of hierarchy: root → middle → leaf
 *
 * Examples:
 *   - Likkutei Sichos: Collection → Volume → Sicha
 *   - Tanya: Sefer → Section → Chapter
 *   - Torah Ohr: Sefer → Parsha → Maamar
 */

export interface SeferImportConfig {
  /**
   * Unique identifier for this import config (used for logging, idempotency)
   */
  id: string;

  /**
   * Human-readable name for this import
   */
  name: string;

  /**
   * Root source configuration (the top-level sefer)
   */
  root: {
    title: string;
    title_hebrew?: string;
    author_id: number;
    original_lang: 'he' | 'yi' | 'en' | 'ar';
    authority_level: 'primary' | 'secondary' | 'explanatory' | 'contemporary';
    description?: string;
    publication_year?: number;
  };

  /**
   * Data source configuration
   */
  dataSource:
    | { type: 'url'; url: string }
    | { type: 'file'; path: string }
    | { type: 'inline'; data: any };

  /**
   * Hierarchy structure definition
   * Defines how to extract middle and leaf levels from the data
   */
  hierarchy: {
    /**
     * How the data is organized
     * - 'flat': All items at one level (just root → leaves)
     * - 'grouped': Items grouped by a key (root → groups → items)
     * - 'nested': Nested structure in the data
     */
    structure: 'flat' | 'grouped' | 'nested';

    /**
     * Middle level configuration (e.g., volumes, sections, parshiyos)
     * Optional - if not provided, leaves attach directly to root
     */
    middleLevel?: {
      /** Display name for this level (e.g., "Volume", "Section", "Parsha") */
      levelName: string;

      /** How to extract/identify middle level items */
      extract: {
        /** Field in the data that identifies the middle level */
        groupByField: string;

        /** How to generate the title for middle level sources */
        titleTemplate: string; // e.g., "Likkutei Sichos {value}" or "{value}"

        /** Optional: field for sort order */
        sortField?: string;

        /** Optional: custom sort function name */
        sortType?: 'numeric' | 'alphabetic' | 'hebrew-numeric';
      };
    };

    /**
     * Leaf level configuration (e.g., sichos, chapters, maamarim)
     */
    leafLevel: {
      /** Display name for this level (e.g., "Sicha", "Chapter", "Maamar") */
      levelName: string;

      /** Field mappings from source data to source fields */
      mappings: {
        /** Required: how to get the title */
        title: string | { template: string };

        /** Optional: page number field */
        pageNumber?: string | { extract: { from: string; regex: string } };

        /** Optional: page count field */
        pageCount?: string;

        /** Optional: parsha/section name field */
        parsha?: string;

        /** Optional: chapter number field */
        chapterNumber?: string;

        /** Optional: language field (or static value) */
        language?: string | { static: 'he' | 'yi' | 'en' | 'ar' };

        /** Optional: any additional metadata fields */
        metadata?: Record<string, string>;
      };

      /** External URL configuration */
      externalUrl?: {
        /** External system name (e.g., "chabad.org", "sefaria") */
        system: string;

        /** Field containing the external ID */
        idField: string;

        /** URL template - use {id} for the external ID */
        urlTemplate: string;

        /** Only generate URL if ID field is non-empty */
        requireId?: boolean;
      };
    };
  };

  /**
   * Data transformation hooks
   */
  transforms?: {
    /** Transform raw data before processing */
    preProcess?: (data: any) => any;

    /** Transform each leaf item before import */
    transformLeaf?: (item: any, context: { middle?: any; root: any }) => any;

    /** Filter function - return false to skip item */
    filter?: (item: any) => boolean;
  };

  /**
   * Import behavior options
   */
  options?: {
    /** Skip items that already exist (by title match) */
    skipExisting?: boolean;

    /** Dry run - log what would be created without actually creating */
    dryRun?: boolean;

    /** Batch size for API calls */
    batchSize?: number;

    /** Delay between batches (ms) */
    batchDelay?: number;
  };
}

/**
 * Hebrew numeric values for sorting
 */
export const HEBREW_NUMERALS: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'יא': 11, 'יב': 12, 'יג': 13, 'יד': 14, 'טו': 15, 'טז': 16,
  'יז': 17, 'יח': 18, 'יט': 19, 'כ': 20, 'כא': 21, 'כב': 22, 'כג': 23,
  'כד': 24, 'כה': 25, 'כו': 26, 'כז': 27, 'כח': 28, 'כט': 29, 'ל': 30,
  'לא': 31, 'לב': 32, 'לג': 33, 'לד': 34, 'לה': 35, 'לו': 36, 'לז': 37,
  'לח': 38, 'לט': 39, 'מ': 40, 'מא': 41, 'מב': 42, 'מג': 43, 'מד': 44,
  'מה': 45, 'מו': 46, 'מז': 47, 'מח': 48, 'מט': 49, 'נ': 50
};

/**
 * Author IDs (from your database)
 */
export const AUTHORS = {
  ALTER_REBBE: 2,
  MITTELER_REBBE: 3,
  TZEMACH_TZEDEK: 4,
  REBBE_MAHARASH: 5,
  REBBE_RASHAB: 6,
  FRIERDIKER_REBBE: 7,
  THE_REBBE: 8,
} as const;
