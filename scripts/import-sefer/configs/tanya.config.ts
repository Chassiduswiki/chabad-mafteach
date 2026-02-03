/**
 * Tanya Import Configuration (TEMPLATE)
 *
 * Structure: Sefer → Section (5) → Chapter (53 in Likkutei Amarim + more in other sections)
 *
 * NOTE: This is a template - you'll need to provide the actual data source
 * The structure assumes data like:
 * [
 *   { section: "Likkutei Amarim", chapter: 1, title: "פרק א", page: 5, ... },
 *   { section: "Likkutei Amarim", chapter: 2, title: "פרק ב", page: 9, ... },
 *   ...
 * ]
 */

import { SeferImportConfig, AUTHORS } from '../config.schema';

export const config: SeferImportConfig = {
  id: 'tanya',
  name: 'Tanya',

  root: {
    title: 'Tanya',
    title_hebrew: 'תניא',
    author_id: AUTHORS.ALTER_REBBE,
    original_lang: 'he',
    authority_level: 'primary',
    description: 'Foundational work of Chabad Chassidus by the Alter Rebbe',
    publication_year: 1797,
  },

  dataSource: {
    // TODO: Replace with actual data source
    type: 'file',
    path: './data/tanya-chapters.json',
  },

  hierarchy: {
    structure: 'grouped',

    middleLevel: {
      levelName: 'Section',
      extract: {
        groupByField: 'section',
        titleTemplate: 'Tanya - {value}',
        sortType: 'numeric', // Sections have a defined order
      },
    },

    leafLevel: {
      levelName: 'Chapter',
      mappings: {
        title: { template: '{section} - {title}' },
        pageNumber: 'page',
        pageCount: 'pageCount',
        chapterNumber: 'chapter',
        language: { static: 'he' },
        metadata: {
          section: 'section',
          chapter_hebrew: 'title',
        },
      },
      externalUrl: {
        system: 'sefaria',
        idField: 'sefaria_ref',
        urlTemplate: 'https://www.sefaria.org/{id}',
        requireId: true,
      },
    },
  },

  options: {
    skipExisting: true,
    batchSize: 20,
  },
};

/**
 * Expected Tanya sections:
 * 1. Likkutei Amarim (53 chapters)
 * 2. Shaar HaYichud VeHaEmunah (12 chapters)
 * 3. Iggeres HaTeshuva (12 chapters)
 * 4. Iggeres HaKodesh (32 letters)
 * 5. Kuntres Acharon (9 essays)
 */
export const TANYA_SECTIONS = [
  { name: 'ליקוטי אמרים', english: 'Likkutei Amarim', chapters: 53 },
  { name: 'שער היחוד והאמונה', english: 'Shaar HaYichud VeHaEmunah', chapters: 12 },
  { name: 'אגרת התשובה', english: 'Iggeres HaTeshuva', chapters: 12 },
  { name: 'אגרת הקודש', english: 'Iggeres HaKodesh', chapters: 32 },
  { name: 'קונטרס אחרון', english: 'Kuntres Acharon', chapters: 9 },
];

export default config;
