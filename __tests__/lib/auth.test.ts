import { NextRequest } from 'next/server';
import { verifyAuth, createAuthToken, requireEditor } from '../../lib/auth';

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

const mockJwt = require('jsonwebtoken');

describe('Authentication utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyAuth', () => {
    it('should return user data for valid token', () => {
      const mockDecoded = { userId: '1', role: 'editor' };
      mockJwt.verify.mockReturnValue(mockDecoded);

      const request = new NextRequest('http://localhost:3000', {
        headers: { authorization: 'Bearer valid-token' }
      });

      const result = verifyAuth(request);
      expect(result).toEqual({ userId: '1', role: 'editor' });
    });

    it('should return null for missing authorization header', () => {
      const request = new NextRequest('http://localhost:3000');
      const result = verifyAuth(request);
      expect(result).toBeNull();
    });

    it('should return null for invalid token format', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: { authorization: 'InvalidFormat' }
      });

      const result = verifyAuth(request);
      expect(result).toBeNull();
    });

    it('should return null for expired/invalid token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const request = new NextRequest('http://localhost:3000', {
        headers: { authorization: 'Bearer invalid-token' }
      });

      const result = verifyAuth(request);
      expect(result).toBeNull();
    });
  });

  describe('createAuthToken', () => {
    it('should create JWT token with user data', () => {
      mockJwt.sign.mockReturnValue('mock-jwt-token');

      const token = createAuthToken('user123', 'editor');
      expect(token).toBe('mock-jwt-token');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', role: 'editor', iat: expect.any(Number) },
        expect.any(String),
        { expiresIn: '24h' }
      );
    });
  });

  describe('requireEditor', () => {
    it('should call handler for authenticated editor', async () => {
      const mockHandler = jest.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = requireEditor(mockHandler);

      mockJwt.verify.mockReturnValue({ userId: '1', role: 'editor' });

      const request = new NextRequest('http://localhost:3000', {
        headers: { authorization: 'Bearer valid-token' }
      });

      const response = await wrappedHandler(request);
      expect(mockHandler).toHaveBeenCalledWith(
        request,
        { userId: '1', role: 'editor' }
      );
      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const mockHandler = jest.fn();
      const wrappedHandler = requireEditor(mockHandler);

      const request = new NextRequest('http://localhost:3000');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication required');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 403 for insufficient permissions', async () => {
      const mockHandler = jest.fn();
      const wrappedHandler = requireEditor(mockHandler);

      mockJwt.verify.mockReturnValue({ userId: '1', role: 'viewer' });

      const request = new NextRequest('http://localhost:3000', {
        headers: { authorization: 'Bearer viewer-token' }
      });

      const response = await wrappedHandler(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Editor permissions required');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should pass additional parameters to handler', async () => {
      const mockHandler = jest.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = requireEditor(mockHandler);

      mockJwt.verify.mockReturnValue({ userId: '1', role: 'admin' });

      const request = new NextRequest('http://localhost:3000', {
        headers: { authorization: 'Bearer admin-token' }
      });

      const params = { slug: 'test-slug' };
      const response = await wrappedHandler(request, params);

      expect(mockHandler).toHaveBeenCalledWith(
        request,
        { userId: '1', role: 'admin' },
        params
      );
    });
  });
});
