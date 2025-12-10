import { NextRequest } from 'next/server';
import { GET } from '../../app/api/search/route';

// Mock Directus
jest.mock('@/lib/directus', () => ({
  default: {
    request: jest.fn(),
  },
}));

const mockDirectus = require('@/lib/directus').default;

describe('/api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return empty results when no query provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/search');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        documents: [],
        locations: [],
        topics: []
      });
    });

    it('should search and return topics', async () => {
      const mockTopics = [{
        id: 1,
        canonical_title: 'Ahavas Yisroel',
        slug: 'ahavas-yisroel',
        topic_type: 'virtue',
        description: 'Love for one\'s fellow Jew'
      }];

      mockDirectus.request.mockResolvedValueOnce(mockTopics);

      const request = new NextRequest('http://localhost:3000/api/search?q=ahavas');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.topics).toHaveLength(1);
      expect(data.topics[0].name).toBe('Ahavas Yisroel');
      expect(data.topics[0].category).toBe('virtue');
    });

    it('should search and return documents', async () => {
      const mockDocuments = [{
        id: 1,
        title: 'Tanya',
        doc_type: 'book',
        author: 'Rabbi Schneur Zalman of Liadi'
      }];

      mockDirectus.request.mockResolvedValueOnce(mockDocuments);

      const request = new NextRequest('http://localhost:3000/api/search?q=tanya');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.documents).toHaveLength(1);
      expect(data.documents[0].title).toBe('Tanya');
    });

    it('should handle search errors gracefully', async () => {
      mockDirectus.request.mockRejectedValueOnce(new Error('Search failed'));

      const request = new NextRequest('http://localhost:3000/api/search?q=test');
      const response = await GET(request);

      expect(response.status).toBe(200); // API returns empty results on error
      const data = await response.json();
      expect(data.documents).toEqual([]);
      expect(data.topics).toEqual([]);
    });
  });
});
