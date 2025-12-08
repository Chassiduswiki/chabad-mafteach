export type TanyaBlockType = 'main' | 'commentary' | 'footnote';

export interface TanyaBlock {
  id: string;
  type: TanyaBlockType;
  hebrew: string;
  english?: string;
}

export interface TanyaChapter {
  sefer: 'likkutei_amarim';
  perek: number;
  titleHebrew?: string;
  titleEnglish?: string;
  blocks: TanyaBlock[];
}

export const likkuteiAmarim1: TanyaChapter = {
  sefer: 'likkutei_amarim',
  perek: 1,
  titleHebrew: 'פרק א׳',
  titleEnglish: 'Chapter 1',
  blocks: [
    {
      id: 'p1',
      type: 'main',
      hebrew: `תַּנְיָא [בְּסוֹף פֶּרֶק ג' דְּנִדָּה]: "מַשְׁבִּיעִים אוֹתוֹ,`,
      english: `We have learned (Niddah, end of ch. 3):1 “An oath is administered to him:`,
    },
    {
      id: 'p2',
      type: 'main',
      hebrew: `תְּהִי צַדִּיק וְאַל תְּהִי רָשָׁע. וַאֲפִילוּ כָּל הָעוֹלָם כּוּלּוֹ אוֹמְרִים לְךָ צַדִּיק אַתָּה – הֱיֵה בְעֵינֶיךָ כְּרָשָׁע".`,
      english: `‘Be righteous and be not wicked; and even if the whole world judging you by your actions tells you that you are righteous, regard yourself as wicked.’”`,
    },
  ],
};
