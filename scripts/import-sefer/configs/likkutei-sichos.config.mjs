/**
 * Likkutei Sichos Import Configuration
 * Source: berel.me/findasicha
 */

export const config = {
  id: 'likkutei-sichos',
  name: 'Likkutei Sichos',

  root: {
    title: 'Likkutei Sichos',
    title_hebrew: 'ליקוטי שיחות',
    author_id: 8, // The Rebbe
    original_lang: 'he',
    authority_level: 'primary',
    description: 'Collection of talks by the Lubavitcher Rebbe',
    publication_year: 1962,
  },

  dataSource: {
    type: 'url',
    url: 'https://berel.me/findasicha/sichos_data.json',
  },

  hierarchy: {
    structure: 'grouped',

    middleLevel: {
      levelName: 'Volume',
      extract: {
        groupByField: 'chelek',
        titleTemplate: 'Likkutei Sichos {value}',
        sortType: 'hebrew-numeric',
      },
    },

    leafLevel: {
      levelName: 'Sicha',
      mappings: {
        title: 'title',
        pageNumber: {
          extract: {
            from: 'title',
            regex: "ע['\u05F3]\\s*(\\d+)",
          },
        },
        pageCount: 'pages',
        parsha: 'parsha',
        language: 'language',
        metadata: {
          filename: 'filename',
          chelek: 'chelek',
        },
      },
      externalUrl: {
        system: 'chabad.org',
        idField: 'articleid',
        urlTemplate: 'https://www.chabad.org/torah-texts/{id}',
        requireId: true,
      },
    },
  },

  transforms: {
    preProcess: (data) => {
      const flatSichos = [];
      for (const parsha of data.parshiyot || []) {
        const sichos = data.sichos_by_parsha?.[parsha] || [];
        flatSichos.push(...sichos);
      }
      return flatSichos;
    },

    transformLeaf: (item) => ({
      ...item,
      language: item.language === 'אידיש' ? 'yi' : 'he',
    }),

    filter: (item) => !!item.title,
  },

  options: {
    skipExisting: true,
    batchSize: 50,
    batchDelay: 100,
  },
};

export default config;
