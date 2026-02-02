import { parseCitation, looksLikeCitation, formatHebrewVolume } from '@/lib/citations/citationParser';

describe('Citation Parser', () => {
  it('parses Likkutei Sichos references', () => {
    const result = parseCitation('LS 4:345');
    expect(result.sourceType).toBe('likkutei_sichos');
    expect(result.volume).toBe(4);
    expect(result.page).toBe(345);
    expect(result.resolvable).toBe(true);
  });

  it('parses Tanya chapter references', () => {
    const result = parseCitation('תניא פרק א');
    expect(result.sourceType).toBe('tanya');
    expect(result.chapter).toBe(1);
  });

  it('detects citation-like strings', () => {
    expect(looksLikeCitation('LS 4:345')).toBe(true);
    expect(looksLikeCitation('Hello world')).toBe(false);
  });

  it('formats Hebrew volume numbers', () => {
    expect(formatHebrewVolume(4)).toBe('ד');
    expect(formatHebrewVolume(100)).toBe('100');
  });
});
