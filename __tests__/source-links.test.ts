import {
  hebrewBooksPageUrl,
  hebrewBooksBookUrl,
  getChapterForPage,
  getChapterPageRange,
  getLinksForPage,
  validatePageBoundaries,
  fetchChabadOrgChapters,
} from '@/lib/source-links';

describe('Source Links Utilities', () => {
  const book = {
    id: 'book-1',
    hebrewbooks_id: 123,
    hebrewbooks_offset: 10,
    chabad_org_root_id: 456,
    lahak_root_id: 789,
    chabadlibrary_id: 222,
    sefaria_slug: 'Test_Book',
    chapters: [
      {
        id: 'ch-1',
        sort: 1,
        chapter_number: 1,
        start_page: 5,
        end_page: 12,
        chabad_org_article_id: 111,
        lahak_content_id: 222,
        sefaria_ref: 'Test_Book, Chapter 1',
      },
      {
        id: 'ch-2',
        sort: 2,
        chapter_number: 2,
        start_page: 13,
        end_page: 20,
        chabad_org_article_id: 112,
        lahak_content_id: 223,
        sefaria_ref: 'Test_Book, Chapter 2',
      },
    ],
  } as any;

  it('builds HebrewBooks URLs with offsets', () => {
    expect(hebrewBooksPageUrl(book, 5)).toBe('https://hebrewbooks.org/pdfpager.aspx?req=123&pgnum=15');
    expect(hebrewBooksBookUrl(book)).toBe('https://hebrewbooks.org/123');
  });

  it('resolves chapters by page and builds links', () => {
    const chapter = getChapterForPage(book.chapters, 6);
    expect(chapter?.id).toBe('ch-1');
    const links = getLinksForPage(book, 6);
    expect(links.hebrewbooks).toContain('pgnum=16');
    expect(links.chabad_org).toBe('https://www.chabad.org/torah-texts/111');
  });

  it('validates chapter page ranges and overlaps', () => {
    const invalid = getChapterPageRange({ id: 'x', start_page: 10, end_page: 5 } as any);
    expect(invalid).toBeNull();

    const { overlaps, statusById } = validatePageBoundaries([
      { id: 'a', start_page: 1, end_page: 10 },
      { id: 'b', start_page: 9, end_page: 15 },
    ] as any);

    expect(overlaps.length).toBe(1);
    expect(statusById.a).toBe('overlap');
    expect(statusById.b).toBe('overlap');
  });

  it('fetches Chabad.org chapters', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        'article-id': 999,
        children: [
          { 'article-id': 101, 'hebrew-title': 'Chapter 1' },
          { 'article-id': 102, 'hebrew-title': 'Chapter 2' },
        ],
      }),
    });
    global.fetch = mockFetch as any;

    const result = await fetchChabadOrgChapters(999);
    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].chabad_org_article_id).toBe(101);
    delete (global as any).fetch;
  });
});
