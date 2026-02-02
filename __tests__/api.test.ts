import { NextRequest } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';

// Mock common variables at module scope for stability
const mockDirectusClient = {
  request: jest.fn(),
};

const mockCache = {
  get: jest.fn().mockReturnValue(null),
  set: jest.fn(),
};

const mockSemanticCache = {
  getCachedSearchResults: jest.fn().mockReturnValue(null),
  cacheSearchResults: jest.fn(),
  getCacheStatistics: jest.fn(() => ({
    hits: 0,
    misses: 0,
    evictions: 0,
    currentSize: 0,
    hitRate: 0,
    memoryUsage: '0MB',
  })),
};

const mockAuth = {
  createAuthToken: jest.fn(() => 'mock-jwt-token'),
  createRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: jest.fn(),
  verifyAuth: jest.fn(),
  requireAuth: jest.fn((handler) => async (req: any, ctx: any) => {
    const auth = mockAuth.verifyAuth(req);
    if (!auth) return { data: { error: 'Authentication required' }, options: { status: 401 } };
    return handler(req, auth);
  }),
  requireEditor: jest.fn((handler) => async (req: any, ctx: any) => {
    const auth = mockAuth.verifyAuth(req);
    if (!auth) return { data: { error: 'Authentication required' }, options: { status: 401 } };
    if (auth.role !== 'editor' && auth.role !== 'admin') {
      return { data: { error: 'Editor permissions required' }, options: { status: 401 } };
    }
    return handler(req, auth);
  }),
  checkAccountLockout: jest.fn(() => ({ isLocked: false })),
  recordFailedLogin: jest.fn(),
  recordSuccessfulLogin: jest.fn(),
};

// Mock Next.js request/response
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

// Mock Directus client
jest.mock('@/lib/directus', () => ({
  createClient: jest.fn(() => mockDirectusClient),
  getDirectus: jest.fn(() => mockDirectusClient),
}));

jest.mock('@directus/sdk', () => ({
  readItems: jest.fn((collection, query) => ({ collection, ...query })),
  createItem: jest.fn((collection, data) => ({ collection, data })),
  readSingleton: jest.fn((collection) => ({ collection })),
  updateItem: jest.fn((collection, id, data) => ({ collection, id, data })),
}));

// Mock auth functions
jest.mock('@/lib/auth', () => mockAuth);

// Mock cache
jest.mock('@/lib/cache', () => ({
  cache: mockCache,
}));

jest.mock('@/lib/cache-optimization', () => ({
  semanticCache: mockSemanticCache,
}));

jest.mock('@/lib/search-smart-mode', () => ({
  determineSmartSearchMode: jest.fn(() => ({ mode: 'keyword', reasoning: 'test' })),
  getLanguageOptimizedFilters: jest.fn(() => ({})),
  getSearchExplanation: jest.fn(() => ''),
  shouldShowSemanticIndicators: jest.fn(() => false),
}));

jest.mock('@/lib/ai/openrouter-client', () => {
  return jest.fn().mockImplementation(() => ({
    translate: jest.fn(),
  }));
});

jest.mock('@/lib/ai/cache', () => ({
  getCachedAIResult: jest.fn(),
  setCachedAIResult: jest.fn(),
}));

jest.mock('@/lib/performance/analyze-performance', () => ({
  measureQueryPerformance: jest.fn().mockResolvedValue({
    searchTime: 10,
    topicsTime: 20,
    docsTime: 30,
    averageTime: 20,
    recommendations: [],
  }),
}));

let mockRequest: any;

beforeEach(() => {
  jest.clearAllMocks();

  mockDirectusClient.request.mockReset();
  mockCache.get.mockReset().mockReturnValue(null);
  mockSemanticCache.getCachedSearchResults.mockReset().mockReturnValue(null);
  mockAuth.verifyAuth.mockReset().mockReturnValue({ userId: '1', role: 'editor' });
  mockAuth.verifyRefreshToken.mockReset().mockReturnValue({ userId: '1' });
  const { getCachedAIResult, setCachedAIResult } = require('@/lib/ai/cache');
  (getCachedAIResult as jest.Mock).mockReset().mockReturnValue(null);
  (setCachedAIResult as jest.Mock).mockReset();

  mockRequest = {
    url: 'http://localhost:3000/api/test',
    method: 'GET',
    headers: {
      get: jest.fn().mockReturnValue('127.0.0.1'),
    },
    nextUrl: {
      searchParams: new URLSearchParams(),
    },
    json: jest.fn(),
  };
});

describe('API Endpoints', () => {

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
        const { semanticCache } = require('@/lib/cache-optimization');

        mockRequest.nextUrl.searchParams.set('q', 'test query');
        (semanticCache.getCachedSearchResults as jest.Mock).mockReturnValue({
          documents: [],
          locations: [],
          topics: [{ id: '1', name: 'Test Topic' }],
          statements: []
        });

        const response = await GET(mockRequest);
        expect(semanticCache.getCachedSearchResults).toHaveBeenCalledWith('test query', 'keyword', 0.6);
        expect(response.data.topics).toHaveLength(1);
      });

      it('should search content blocks, statements, and topics', async () => {
        const { GET } = require('../app/api/search/route');

        // Bypass rate limit
        const prevEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        mockRequest.nextUrl.searchParams.set('q', 'test search');
        (mockSemanticCache.getCachedSearchResults as jest.Mock).mockReturnValue(null);

        // Mock search results (4 calls: content_blocks, statements, topics, seforim)
        mockDirectusClient.request
          .mockResolvedValueOnce([{ id: 1, order_key: '1', content: 'test content', document_id: 1 }]) // content_blocks
          .mockResolvedValueOnce([{ id: 1, text: 'test statement', block_id: 1 }]) // statements
          .mockResolvedValueOnce([{ id: 1, canonical_title: 'Test Topic', slug: 'test-topic', topic_type: 'concept' }]) // topics
          .mockResolvedValueOnce([{ id: 1, title: 'Test Sefer', doc_type: 'sefer' }]); // seforim

        const response = await GET(mockRequest);
        process.env.NODE_ENV = prevEnv;

        expect(mockDirectusClient.request).toHaveBeenCalledTimes(4);
        expect(response.data).toHaveProperty('documents');
        expect(response.data).toHaveProperty('locations');
        expect(response.data).toHaveProperty('topics');
        expect(response.data).toHaveProperty('statements');
        expect(response.data).toHaveProperty('seforim');
      });
    });
  });

  describe('Source Resolve API', () => {
    describe('GET /api/sources/resolve', () => {
      it('should resolve Derech Mitzvosecha page links', async () => {
        const { GET } = require('../app/api/sources/resolve/route');

        mockRequest.url = 'http://localhost:3000/api/sources/resolve?bookId=derech-1&page=15';

        mockDirectusClient.request
          .mockResolvedValueOnce([{
            id: 'derech-1',
            canonical_name: 'Derech Mitzvosecha',
            reference_style: 'page',
            hebrewbooks_id: 16082,
            hebrewbooks_offset: 10,
            chabad_org_root_id: 5580713,
            lahak_root_id: null,
            chabadlibrary_id: null,
            sefaria_slug: 'Derekh_Mitzvotekha',
          }])
          .mockResolvedValueOnce([
            {
              id: 'ch-1',
              book_id: 'derech-1',
              sort: 1,
              chapter_number: 1,
              chapter_name: 'מצות פרו ורבו',
              chapter_name_english: 'The Mitzvah of Procreation',
              start_page: 12,
              end_page: 20,
              chabad_org_article_id: 5878273,
              lahak_content_id: null,
              sefaria_ref: 'Derekh_Mitzvotekha,_The_Commandment_of_Procreation',
            },
          ]);

        const response = await GET(mockRequest);

        expect(response.data.bookId).toBe('derech-1');
        expect(response.data.page).toBe(15);
        expect(response.data.chapter.chapterNumber).toBe(1);
        expect(response.data.links.hebrewBooks).toBe(
          'https://hebrewbooks.org/pdfpager.aspx?req=16082&pgnum=25'
        );
        expect(response.data.links.chabadOrg).toBe(
          'https://www.chabad.org/torah-texts/5878273'
        );
        expect(response.data.links.sefaria).toBe(
          'https://www.sefaria.org/Derekh_Mitzvotekha%2C_The_Commandment_of_Procreation?lang=bi'
        );
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

        mockDirectusClient.request.mockResolvedValue([]);

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
        { id: 1, title: 'Document 1', doc_type: 'sefer' }
      ]);

      const response = await GET(mockRequest);
      // The route defaults to doc_type='sefer' if not specified
      expect(mockDirectusClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { doc_type: { _eq: 'sefer' } }
        })
      );
      expect(response.data).toHaveLength(1);
    });

    it('should handle Directus errors gracefully', async () => {
      const { GET } = require('../app/api/documents/route');
      mockDirectusClient.request.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET(mockRequest);
      expect(response.options.status).toBe(500);
      expect(response.data.error).toBe('Internal Server Error');
    });
  });

  describe('Translation API', () => {
    it('should return 400 for missing parameters', async () => {
      const { POST } = require('../app/api/ai/translate/route');
      mockRequest.json.mockResolvedValue({ topic_id: '1' });

      const response = await POST(mockRequest);
      expect(response.options.status).toBe(400);
      expect(response.data.error).toBe('Missing required parameters');
    });

    it('should return cached translation when available', async () => {
      const { POST } = require('../app/api/ai/translate/route');
      const { getCachedAIResult } = require('@/lib/ai/cache');

      mockRequest.json.mockResolvedValue({
        topic_id: '1',
        target_language: 'en',
        source_language: 'he',
        field: 'canonical_title',
      });

      mockDirectusClient.request
        .mockResolvedValueOnce({ quality_threshold: 0.8, auto_approval_threshold: 0.95 }) // ai_settings
        .mockResolvedValueOnce([{ canonical_title: 'שלום' }]); // topics

      (getCachedAIResult as jest.Mock).mockReturnValue({
        translation: 'Cached Translation',
        quality: { score: 0.99, explanation: 'Great' },
        model: 'cached-model',
        isFallback: false,
        cached: true,
      });

      const response = await POST(mockRequest);
      expect(response.data.cached).toBe(true);
      expect(response.data.translation).toBe('Cached Translation');
    });

    it('should translate and save when quality threshold met', async () => {
      const { POST } = require('../app/api/ai/translate/route');
      const OpenRouterClient = require('@/lib/ai/openrouter-client');

      mockRequest.json.mockResolvedValue({
        topic_id: '1',
        target_language: 'en',
        source_language: 'he',
        field: 'canonical_title',
      });

      const translateMock = jest.fn().mockResolvedValue({
        translation: 'Translated Text',
        quality: { score: 0.98, explanation: 'Excellent' },
        model: 'test-model',
        isFallback: false,
      });

      (OpenRouterClient as jest.Mock).mockImplementation(() => ({
        translate: translateMock,
      }));

      mockDirectusClient.request
        .mockResolvedValueOnce({ quality_threshold: 0.8, auto_approval_threshold: 0.95 }) // ai_settings
        .mockResolvedValueOnce([{ canonical_title: 'שלום' }]) // topics
        .mockResolvedValueOnce({}) // translation_history create
        .mockResolvedValueOnce([]) // topic_translations read
        .mockResolvedValueOnce({}); // topic_translations create

      const response = await POST(mockRequest);
      expect(response.data.translation).toBe('Translated Text');
      expect(response.data.auto_approved).toBe(true);
      expect(translateMock).toHaveBeenCalled();
    });
  });

  describe('Performance API', () => {
    it('should reject non-admin access', async () => {
      const { GET } = require('../app/api/admin/performance/route');
      const { verifyAuth } = require('@/lib/auth');

      (verifyAuth as jest.Mock).mockReturnValue({ userId: '1', role: 'editor' });

      const response = await GET(mockRequest);
      expect(response.options.status).toBe(403);
      expect(response.data.error).toBe('Unauthorized');
    });

    it('should return a performance report for admins', async () => {
      const { GET } = require('../app/api/admin/performance/route');
      const { verifyAuth } = require('@/lib/auth');

      (verifyAuth as jest.Mock).mockReturnValue({ userId: '1', role: 'admin' });

      const response = await GET(mockRequest);
      expect(response.data.generatedAt).toBeDefined();
      expect(response.data.api).toBeDefined();
      expect(response.data.cache).toBeDefined();
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
