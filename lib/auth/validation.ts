/**
 * Bulletproof Authentication Validation System
 * Prevents infinite loading and API failures by validating auth configuration
 */

export interface AuthConfig {
  directusUrl: string;
  staticToken: string;
  publicStaticToken: string;
}

export interface AuthValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Partial<AuthConfig>;
}

export interface AuthHealthCheck {
  status: 'healthy' | 'degraded' | 'critical';
  checks: {
    serverToken: boolean;
    clientToken: boolean;
    directusUrl: boolean;
    apiConnectivity: boolean;
  };
  timestamp: string;
}

/**
 * Validates authentication configuration
 */
export function validateAuthConfig(): AuthValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: Partial<AuthConfig> = {};

  // Check Directus URL
  const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
  if (!directusUrl) {
    errors.push('DIRECTUS_URL or NEXT_PUBLIC_DIRECTUS_URL is required');
  } else {
    config.directusUrl = directusUrl;
    try {
      new URL(directusUrl);
    } catch {
      errors.push(`Invalid Directus URL format: ${directusUrl}`);
    }
  }

  // Check server-side static token
  const staticToken = process.env.DIRECTUS_STATIC_TOKEN;
  if (!staticToken) {
    errors.push('DIRECTUS_STATIC_TOKEN is required for server-side API calls');
  } else if (staticToken.length < 10) {
    errors.push('DIRECTUS_STATIC_TOKEN appears to be too short (min 10 chars)');
  } else {
    config.staticToken = staticToken;
  }

  // Check client-side static token
  const publicStaticToken = process.env.NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN;
  if (!publicStaticToken) {
    errors.push('NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN is required for client-side API calls');
  } else if (publicStaticToken !== staticToken) {
    warnings.push('Client and server static tokens differ - this may cause authentication issues');
  } else {
    config.publicStaticToken = publicStaticToken;
  }

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    if (!directusUrl?.startsWith('https://')) {
      warnings.push('Production environment should use HTTPS for Directus URL');
    }
    
    if (staticToken && publicStaticToken && staticToken === publicStaticToken && staticToken.length < 20) {
      warnings.push('Consider using longer tokens in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
}

/**
 * Performs comprehensive authentication health check
 */
export async function performAuthHealthCheck(): Promise<AuthHealthCheck> {
  const checks = {
    serverToken: false,
    clientToken: false,
    directusUrl: false,
    apiConnectivity: false
  };

  // Check server token
  checks.serverToken = !!process.env.DIRECTUS_STATIC_TOKEN;

  // Check client token
  checks.clientToken = !!process.env.NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN;

  // Check Directus URL
  const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
  checks.directusUrl = !!directusUrl && isValidUrl(directusUrl);

  // Check API connectivity (only if URL is valid)
  if (checks.directusUrl && directusUrl) {
    try {
      const response = await fetch(`${directusUrl}/server/info`, {
        method: 'GET',
        headers: {
          'Authorization': process.env.DIRECTUS_STATIC_TOKEN || '',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      checks.apiConnectivity = response.ok;
    } catch {
      checks.apiConnectivity = false;
    }
  }

  // Determine overall status
  const failedChecks = Object.values(checks).filter(check => !check).length;
  let status: 'healthy' | 'degraded' | 'critical';

  if (failedChecks === 0) {
    status = 'healthy';
  } else if (failedChecks <= 2) {
    status = 'degraded';
  } else {
    status = 'critical';
  }

  return {
    status,
    checks,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validates URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets authentication configuration with fallbacks
 */
export function getAuthConfig(): AuthConfig {
  const validation = validateAuthConfig();
  
  if (!validation.isValid) {
    console.error('[Auth] Configuration validation failed:', validation.errors);
  }

  if (validation.warnings.length > 0) {
    console.warn('[Auth] Configuration warnings:', validation.warnings);
  }

  return {
    directusUrl: validation.config.directusUrl || 'http://localhost:8055',
    staticToken: validation.config.staticToken || '',
    publicStaticToken: validation.config.publicStaticToken || ''
  };
}

/**
 * Authentication error types for better debugging
 */
export enum AuthErrorType {
  MISSING_SERVER_TOKEN = 'MISSING_SERVER_TOKEN',
  MISSING_CLIENT_TOKEN = 'MISSING_CLIENT_TOKEN',
  INVALID_URL = 'INVALID_URL',
  API_CONNECTIVITY_FAILED = 'API_CONNECTIVITY_FAILED',
  TOKEN_MISMATCH = 'TOKEN_MISMATCH',
  PROXY_AUTH_FAILED = 'PROXY_AUTH_FAILED'
}

export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Enhanced error handling for authentication failures
 */
export function handleAuthError(error: any, context: string): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  // Analyze error patterns to determine type
  const errorMessage = error?.message || String(error);
  
  if (errorMessage.includes('token') || errorMessage.includes('unauthorized')) {
    return new AuthError(
      AuthErrorType.PROXY_AUTH_FAILED,
      `Authentication failed in ${context}: ${errorMessage}`,
      { originalError: error }
    );
  }

  if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return new AuthError(
      AuthErrorType.API_CONNECTIVITY_FAILED,
      `API connectivity failed in ${context}: ${errorMessage}`,
      { originalError: error }
    );
  }

  return new AuthError(
    AuthErrorType.API_CONNECTIVITY_FAILED,
    `Unknown authentication error in ${context}: ${errorMessage}`,
    { originalError: error }
  );
}
