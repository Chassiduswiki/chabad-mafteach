/**
 * Authentication System Regression Tests
 * Prevents recurrence of infinite loading and API failures
 */

import { validateAuthConfig, performAuthHealthCheck, AuthErrorType, AuthError } from '../lib/auth/validation';

// Mock environment variables for testing
const mockEnv = (env: Record<string, string>) => {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...env };
  return () => {
    process.env = originalEnv;
  };
};

describe('Authentication Validation', () => {
  describe('validateAuthConfig', () => {
    it('should pass with valid configuration', () => {
      const restoreEnv = mockEnv({
        DIRECTUS_URL: 'https://directus.example.com',
        DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456',
        NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456'
      });

      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.config.directusUrl).toBe('https://directus.example.com');
      expect(result.config.staticToken).toBe('valid-server-token-123456');
      expect(result.config.publicStaticToken).toBe('valid-server-token-123456');

      restoreEnv();
    });

    it('should fail when DIRECTUS_URL is missing', () => {
      const restoreEnv = mockEnv({
        DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456',
        NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456'
      });

      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('DIRECTUS_URL or NEXT_PUBLIC_DIRECTUS_URL is required');

      restoreEnv();
    });

    it('should fail when DIRECTUS_STATIC_TOKEN is missing', () => {
      const restoreEnv = mockEnv({
        DIRECTUS_URL: 'https://directus.example.com',
        NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN: 'valid-client-token-123456'
      });

      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('DIRECTUS_STATIC_TOKEN is required for server-side API calls');

      restoreEnv();
    });

    it('should fail when NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN is missing', () => {
      const restoreEnv = mockEnv({
        DIRECTUS_URL: 'https://directus.example.com',
        DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456'
      });

      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN is required for client-side API calls');

      restoreEnv();
    });

    it('should warn when client and server tokens differ', () => {
      const restoreEnv = mockEnv({
        DIRECTUS_URL: 'https://directus.example.com',
        DIRECTUS_STATIC_TOKEN: 'server-token-123456',
        NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN: 'client-token-789012'
      });

      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Client and server static tokens differ - this may cause authentication issues');

      restoreEnv();
    });

    it('should reject invalid URL format', () => {
      const restoreEnv = mockEnv({
        DIRECTUS_URL: 'invalid-url',
        DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456',
        NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456'
      });

      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid Directus URL format: invalid-url');

      restoreEnv();
    });

    it('should reject short tokens', () => {
      const restoreEnv = mockEnv({
        DIRECTUS_URL: 'https://directus.example.com',
        DIRECTUS_STATIC_TOKEN: 'short',
        NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN: 'short'
      });

      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('DIRECTUS_STATIC_TOKEN appears to be too short (min 10 chars)');

      restoreEnv();
    });

    it('should warn about HTTP in production', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'production',
        DIRECTUS_URL: 'http://directus.example.com',
        DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456789012',
        NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456789012'
      });

      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Production environment should use HTTPS for Directus URL');

      restoreEnv();
    });
  });

  describe('AuthError', () => {
    it('should create AuthError with correct properties', () => {
      const error = new AuthError(
        AuthErrorType.MISSING_SERVER_TOKEN,
        'Test error message',
        { details: 'test' }
      );

      expect(error.name).toBe('AuthError');
      expect(error.type).toBe(AuthErrorType.MISSING_SERVER_TOKEN);
      expect(error.message).toBe('Test error message');
      expect(error.details).toEqual({ details: 'test' });
    });
  });

  describe('performAuthHealthCheck', () => {
    it('should return healthy status with valid configuration', async () => {
      const restoreEnv = mockEnv({
        DIRECTUS_URL: 'https://directus.example.com',
        DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456',
        NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456'
      });

      // Mock fetch to simulate successful API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true
      });

      const result = await performAuthHealthCheck();
      
      expect(result.status).toBe('healthy');
      expect(result.checks.serverToken).toBe(true);
      expect(result.checks.clientToken).toBe(true);
      expect(result.checks.directusUrl).toBe(true);
      expect(result.checks.apiConnectivity).toBe(true);

      restoreEnv();
    });

    it('should return critical status with missing configuration', async () => {
      const restoreEnv = mockEnv({});

      const result = await performAuthHealthCheck();
      
      expect(result.status).toBe('critical');
      expect(result.checks.serverToken).toBe(false);
      expect(result.checks.clientToken).toBe(false);
      expect(result.checks.directusUrl).toBe(false);
      expect(result.checks.apiConnectivity).toBe(false);

      restoreEnv();
    });

    it('should handle API connectivity failures', async () => {
      const restoreEnv = mockEnv({
        DIRECTUS_URL: 'https://directus.example.com',
        DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456',
        NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456'
      });

      // Mock fetch to simulate API failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await performAuthHealthCheck();
      
      expect(result.status).toBe('degraded');
      expect(result.checks.serverToken).toBe(true);
      expect(result.checks.clientToken).toBe(true);
      expect(result.checks.directusUrl).toBe(true);
      expect(result.checks.apiConnectivity).toBe(false);

      restoreEnv();
    });
  });
});

describe('Authentication Integration Tests', () => {
  it('should prevent infinite loading scenario', () => {
    // This test simulates the exact scenario that caused infinite loading
    const restoreEnv = mockEnv({
      DIRECTUS_URL: 'https://directus.example.com',
      DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456',
      // NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN is missing - this was the bug
    });

    const result = validateAuthConfig();
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN is required for client-side API calls');

    restoreEnv();
  });

  it('should detect proxy authentication issues', () => {
    const restoreEnv = mockEnv({
      DIRECTUS_URL: 'https://directus.example.com',
      DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456',
      NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN: 'valid-server-token-123456'
    });

    const result = validateAuthConfig();
    
    expect(result.isValid).toBe(true);
    // The proxy should use the same token format (no "Bearer" prefix)
    expect(result.config.staticToken).toBe(result.config.publicStaticToken);

    restoreEnv();
  });
});
