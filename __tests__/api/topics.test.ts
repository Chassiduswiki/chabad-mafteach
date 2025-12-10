import { NextRequest } from 'next/server';
import { GET } from '../app/api/topics/[slug]/route';

// Mock Directus
jest.mock('@/lib/directus', () => ({
  default: {
    request: jest.fn(),
  },
}));

const mockDirectus = require('@/lib/directus').default;

describe('/api/topics/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return topic data for valid slug', async () => {
      const mockTopic = {
        id: 1,
        canonical_title: 'Test Topic',
        slug: 'test-topic',
        description: 'Test description',
        topic_type: 'concept'
      };

      mockDirectus.request.mockResolvedValueOnce([mockTopic]);

      const request = new NextRequest('http://localhost:3000/api/topics/test-topic');
      const response = await GET(request, { params: Promise.resolve({ slug: 'test-topic' }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.topic.canonical_title).toBe('Test Topic');
    });

    it('should return 404 for non-existent topic', async () => {
      mockDirectus.request.mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost:3000/api/topics/non-existent');
      const response = await GET(request, { params: Promise.resolve({ slug: 'non-existent' }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Topic not found');
    });

    it('should handle Directus errors gracefully', async () => {
      mockDirectus.request.mockRejectedValueOnce(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/topics/test-topic');
      const response = await GET(request, { params: Promise.resolve({ slug: 'test-topic' }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch topic');
    });
  });
});
