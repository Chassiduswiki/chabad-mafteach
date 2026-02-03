import { measureQueryPerformance } from '@/lib/performance/analyze-performance';

describe('Performance Analysis', () => {
  let now = 0;

  beforeEach(() => {
    now = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => {
      now += 50;
      return now;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it('returns average timings based on endpoints', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [], topics: [], statements: [] }),
    }) as any;

    const result = await measureQueryPerformance({ baseUrl: 'http://localhost:3000', timeoutMs: 1000 });
    expect(result.searchTime).toBeGreaterThan(0);
    expect(result.topicsTime).toBeGreaterThan(0);
    expect(result.docsTime).toBeGreaterThan(0);
    expect(result.averageTime).toBeGreaterThan(0);
  });
});
