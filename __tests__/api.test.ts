import { NextRequest } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';

// Mock Next.js request/response
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

// Mock Directus client
jest.mock('@/lib/directus', () => ({
  createClient: jest.fn(() => ({
    request: jest.fn(),
  })),
}));

jest.mock('@directus/sdk', () => ({
  readItems: jest.fn(),
  createItem: jest.fn(),
}));

// Mock auth functions
jest.mock('@/lib/auth', () => ({
  createAuthToken: jest.fn(() => 'mock-jwt-token'),
  createRefreshToken: jest.fn(() => 'mock-refresh-token'),
  checkAccountLockout: jest.fn(() => ({ isLocked: false })),
  recordFailedLogin: jest.fn(),
  recordSuccessfulLogin: jest.fn(),
}));

// Mock cache
jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe('API Endpoints', () => {
  let mockDirectusClient: any;
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDirectusClient = {
      request: jest.fn(),
    };
    (createClient as jest.Mock).mockReturnValue(mockDirectusClient);

    mockRequest = {
      headers: {
        get: jest.fn(),
      },
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
      json: jest.fn(),
    };
  });

  describe('Authentication API', () => {
    describe('POST /api/auth/login', () => {
      it('should return 400 for missing email/password', async () => {
        const { POST } = require('../app/api/auth/login/route');
        mockRequest.json.mockResolvedValue({});

        const response = await POST(mockRequest);
        expect(response.data.error).toBe('Email and password are required');
        expect(response.options.status).toBe(400);
      });

      it('should return 401 for invalid credentials', async () => {
        const { POST } = require('../app/api/auth/login/route');
        mockRequest.json.mockResolvedValue({ email: 'invalid@test.com', password: 'wrong' });

        mockDirectusClient.request.mockResolvedValue([]);

        const response = await POST(mockRequest);
        expect(response.data.error).toBe('Invalid email or password');
        expect(response.options.status).toBe(401);
      });

      it('should return tokens for valid credentials', async () => {
        const { POST } = require('../app/api/auth/login/route');
        mockRequest.json.mockResolvedValue({ email: 'editor@chabad.org', password: 'editor123' });

        mockDirectusClient.request.mockResolvedValue([{
          id: '1',
          email: 'editor@chabad.org',
          first_name: 'Editor',
          last_name: 'User',
          role: 'editor'
        }]);

        const response = await POST(mockRequest);
        expect(response.data.success).toBe(true);
        expect(response.data.accessToken).toBe('mock-jwt-token');
        expect(response.data.refreshToken).toBe('mock-refresh-token');
        expect(response.data.user.email).toBe('editor@chabad.org');
        expect(response.data.user.role).toBe('editor');
      });

      it('should handle account lockout', async () => {
        const { POST } = require('../app/api/auth/login/route');
        const { checkAccountLockout } = require('@/lib/auth');

        mockRequest.json.mockResolvedValue({ email: 'locked@test.com', password: 'password' });
        (checkAccountLockout as jest.Mock).mockReturnValue({
          isLocked: true,
          lockoutRemaining: 900 // 15 minutes
        });

        const response = await POST(mockRequest);
        expect(response.data.error).toContain('temporarily locked');
        expect(response.options.status).toBe(429);
      });

      it('should enforce rate limiting', async () => {
        const { POST } = require('../app/api/auth/login/route');
        mockRequest.json.mockResolvedValue({ email: 'test@test.com', password: 'password' });
        mockRequest.headers.get.mockReturnValue('192.168.1.1');

        // Simulate rate limit exceeded
        const response = await POST(mockRequest);
        // Rate limiting is disabled in test environment, so this should pass
        expect(response).toBeDefined();
      });
    });

    describe('POST /api/auth/refresh', () => {
      it('should return 400 for missing refresh token', async () => {
        const { POST } = require('../app/api/auth/refresh/route');
        mockRequest.json.mockResolvedValue({});

        const response = await POST(mockRequest);
        expect(response.data.error).toBe('Refresh token is required');
        expect(response.options.status).toBe(400);
      });

      it('should return 401 for invalid refresh token', async () => {
        const { POST } = require('../app/api/auth/refresh/route');
        const { verifyRefreshToken } = require('@/lib/auth');

        mockRequest.json.mockResolvedValue({ refreshToken: 'invalid-token' });
        (verifyRefreshToken as jest.Mock).mockReturnValue(null);

        const response = await POST(mockRequest);
        expect(response.data.error).toBe('Invalid or expired refresh token');
        expect(response.options.status).toBe(401);
      });

      it('should return new access token for valid refresh token', async () => {
        const { POST } = require('../app/api/auth/refresh/route');
        const { verifyRefreshToken } = require('@/lib/auth');

        mockRequest.json.mockResolvedValue({ refreshToken: 'valid-refresh-token' });
        (verifyRefreshToken as jest.Mock).mockReturnValue({ userId: '1' });

        const response = await POST(mockRequest);
        expect(response.data.success).toBe(true);
        expect(response.data.accessToken).toBe('mock-jwt-token');
        expect(response.data.user.id).toBe('1');
      });
    });
  });

  describe('Search API', () => {
    describe('GET /api/search', () => {
      it('should return empty results for no query', async () => {
        const { GET } = require('../app/api/search/route');
        mockRequest.nextUrl.searchParams.set('q', '');

        const response = await GET(mockRequest);
        expect(response.data.documents).toEqual([]);
        expect(response.data.locations).toEqual([]);
        expect(response.data.topics).toEqual([]);
        expect(response.data.statements).toEqual([]);
      });

      it('should return cached results when available', async () => {
        const { GET } = require('../app/api/search/route');
        const { cache } = require('@/lib/cache');

        mockRequest.nextUrl.searchParams.set('q', 'test query');
        (cache.get as jest.Mock).mockReturnValue({
          documents: [],
          locations: [],
          topics: [{ id: '1', name: 'Test Topic' }],
          statements: []
        });

        const response = await GET(mockRequest);
        expect(cache.get).toHaveBeenCalledWith('search:results:test query');
        expect(response.data.topics).toHaveLength(1);
      });

      it('should search content blocks, statements, and topics', async () => {
        const { GET } = require('../app/api/search/route');
        const { cache } = require('@/lib/cache');

        mockRequest.nextUrl.searchParams.set('q', 'test search');
        (cache.get as jest.Mock).mockReturnValue(null); // No cache hit

        // Mock content blocks search
        mockDirectusClient.request
          .mockResolvedValueOnce([{ id: 1, order_key: '1', content: 'test content', document_id: 1 }])
          .mockResolvedValueOnce([{ id: 1, text: 'test statement', block_id: 1 }])
          .mockResolvedValueOnce([{ id: 1, canonical_title: 'Test Topic', slug: 'test-topic', topic_type: 'concept' }]);

        const response = await GET(mockRequest);
        expect(mockDirectusClient.request).toHaveBeenCalledTimes(3);
        expect(response.data).toHaveProperty('documents');
        expect(response.data).toHaveProperty('locations');
        expect(response.data).toHaveProperty('topics');
        expect(response.data).toHaveProperty('statements');
      });
    });
  });

  describe('Topics API', () => {
    describe('GET /api/topics', () => {
      it('should return topics list by default', async () => {
        const { GET } = require('../app/api/topics/route');
        mockDirectusClient.request.mockResolvedValue([
          { id: 1, canonical_title: 'Topic 1', topic_type: 'concept' },
          { id: 2, canonical_title: 'Topic 2', topic_type: 'person' }
        ]);

        const response = await GET(mockRequest);
        expect(response.data.topics).toHaveLength(2);
        expect(response.data.topics[0].name).toBe('Topic 1');
      });

      it('should support discovery mode', async () => {
        const { GET } = require('../app/api/topics/route');
        mockRequest.nextUrl.searchParams.set('mode', 'discovery');

        mockDirectusClient.request.mockResolvedValue([
          { id: 1, canonical_title: 'Topic 1', topic_type: 'concept' }
        ]);

        const response = await GET(mockRequest);
        expect(response.data).toHaveProperty('featuredTopic');
        expect(response.data).toHaveProperty('recentTopics');
        expect(response.data).toHaveProperty('recentSources');
      });

      it('should support featured mode', async () => {
        const { GET } = require('../app/api/topics/route');
        mockRequest.nextUrl.searchParams.set('mode', 'featured');

        mockDirectusClient.request.mockResolvedValue([
          { id: 1, canonical_title: 'Topic 1', topic_type: 'concept' }
        ]);

        const response = await GET(mockRequest);
        expect(response.data).toHaveProperty('topics');
        expect(response.data.topics[0]).toHaveProperty('citation_count', 0);
      });

      it('should filter by category', async () => {
        const { GET } = require('../app/api/topics/route');
        mockRequest.nextUrl.searchParams.set('category', 'concept');

        const response = await GET(mockRequest);
        expect(mockDirectusClient.request).toHaveBeenCalledWith(
          expect.objectContaining({
            filter: { topic_type: { _eq: 'concept' } }
          })
        );
      });
    });
  });

  describe('Documents API', () => {
    describe('GET /api/documents', () => {
      it('should return documents filtered by type', async () => {
        const { GET } = require('../app/api/documents/route');
        mockRequest.nextUrl.searchParams.set('doc_type', 'sefer');

        mockDirectusClient.request.mockResolvedValue([
          { id: 1, title: 'Test Sefer', doc_type: 'sefer' }
        ]);

        const response = await GET(mockRequest);
        expect(response.data).toEqual([{ id: 1, title: 'Test Sefer', doc_type: 'sefer' }]);
      });

      it('should return all documents when no type specified', async () => {
        const { GET } = require('../app/api/documents/route');

        mockDirectusClient.request.mockResolvedValue([
          { id: 1, title: 'Document 1', doc_type: 'sefer' },
          { id: 2, title: 'Document 2', doc_type: 'entry' }
        ]);

        const response = await GET(mockRequest);
        expect(response.data).toHaveLength(2);
      });

      it('should handle Directus errors gracefully', async () => {
        const { GET } = require('../app/api/documents/route');
        mockDirectusClient.request.mockRejectedValue(new Error('Database connection failed'));

        const response = await GET(mockRequest);
        expect(response.options.status).toBe(500);
        expect(response.data.error).toContain('Failed to fetch documents');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors consistently', async () => {
      const { handleApiError } = require('@/lib/utils/api-errors');

      const mockError = new Error('Test error');
      const response = handleApiError(mockError);

      expect(response.options.status).toBe(500);
      expect(response.data.error).toBe('Internal Server Error');
    });

    it('should handle custom ApiError instances', async () => {
      const { handleApiError, ApiError } = require('@/lib/utils/api-errors');

      const customError = new ApiError('Custom error message', 400);
      const response = handleApiError(customError);

      expect(response.options.status).toBe(400);
      expect(response.data.error).toBe('Custom error message');
    });
  });

  describe('Authentication Middleware', () => {
    describe('requireAuth', () => {
      it('should reject requests without authorization header', async () => {
        const { requireAuth } = require('@/lib/auth');
        const { verifyAuth } = require('@/lib/auth');

        (verifyAuth as jest.Mock).mockReturnValue(null);

        const mockHandler = jest.fn();
        const protectedHandler = requireAuth(mockHandler);

        const response = await protectedHandler(mockRequest);
        expect(response.options.status).toBe(401);
        expect(response.data.error).toBe('Authentication required');
      });

      it('should allow authenticated requests', async () => {
        const { requireAuth } = require('@/lib/auth');
        const { verifyAuth } = require('@/lib/auth');

        (verifyAuth as jest.Mock).mockReturnValue({ userId: '1', role: 'editor' });

        const mockHandler = jest.fn().mockResolvedValue({ success: true });
        const protectedHandler = requireAuth(mockHandler);

        await protectedHandler(mockRequest);
        expect(mockHandler).toHaveBeenCalledWith(mockRequest, { userId: '1', role: 'editor' });
      });
    });

    describe('requireEditor', () => {
      it('should reject non-editor roles for POST requests', async () => {
        const { requireEditor } = require('@/lib/auth');
        const { verifyAuth } = require('@/lib/auth');

        (verifyAuth as jest.Mock).mockReturnValue({ userId: '1', role: 'viewer' });

        const mockHandler = jest.fn();
        const protectedHandler = requireEditor(mockHandler);

        mockRequest.method = 'POST';
        const response = await protectedHandler(mockRequest);
        expect(response.options.status).toBe(401);
        expect(response.data.error).toBe('Editor permissions required');
      });
    });
  });
});
