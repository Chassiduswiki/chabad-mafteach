/**
 * Authentication Debugging Utilities
 * Helps diagnose and troubleshoot authentication issues
 */

import { validateAuthConfig, performAuthHealthCheck, handleAuthError, AuthErrorType } from './validation';

export interface DebugInfo {
  timestamp: string;
  environment: string;
  config: {
    directusUrl?: string;
    hasServerToken: boolean;
    hasClientToken: boolean;
    tokenMatch: boolean;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  health?: {
    status: string;
    checks: Record<string, boolean>;
  };
  tests: {
    urlFormat: boolean;
    tokenLength: boolean;
    tokenConsistency: boolean;
  };
}

/**
 * Generates comprehensive authentication debug information
 */
export async function generateAuthDebugInfo(): Promise<DebugInfo> {
  const timestamp = new Date().toISOString();
  const environment = process.env.NODE_ENV || 'unknown';
  
  // Get configuration
  const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
  const serverToken = process.env.DIRECTUS_STATIC_TOKEN;
  const clientToken = process.env.NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN;
  
  const config = {
    directusUrl,
    hasServerToken: !!serverToken,
    hasClientToken: !!clientToken,
    tokenMatch: serverToken === clientToken
  };
  
  // Run validation
  const validation = validateAuthConfig();
  
  // Run health check (only if basic config is valid)
  let health;
  if (validation.isValid && directusUrl) {
    try {
      health = await performAuthHealthCheck();
    } catch (error) {
      health = {
        status: 'error',
        checks: {
          serverToken: config.hasServerToken,
          clientToken: config.hasClientToken,
          directusUrl: !!directusUrl,
          apiConnectivity: false
        }
      };
    }
  }
  
  // Run specific tests
  const tests = {
    urlFormat: isValidUrl(directusUrl || ''),
    tokenLength: (serverToken?.length || 0) >= 10,
    tokenConsistency: serverToken === clientToken
  };
  
  return {
    timestamp,
    environment,
    config,
    validation,
    health,
    tests
  };
}

/**
 * Logs authentication debug information to console
 */
export async function logAuthDebugInfo(): Promise<void> {
  const debugInfo = await generateAuthDebugInfo();
  
  console.group('🔍 Authentication Debug Information');
  console.log('Timestamp:', debugInfo.timestamp);
  console.log('Environment:', debugInfo.environment);
  
  console.group('📋 Configuration');
  console.log('Directus URL:', debugInfo.config.directusUrl);
  console.log('Server Token:', debugInfo.config.hasServerToken ? '✅ Present' : '❌ Missing');
  console.log('Client Token:', debugInfo.config.hasClientToken ? '✅ Present' : '❌ Missing');
  console.log('Token Match:', debugInfo.config.tokenMatch ? '✅ Yes' : '⚠️ No');
  console.groupEnd();
  
  console.group('✅ Validation Results');
  console.log('Valid:', debugInfo.validation.isValid ? '✅ Yes' : '❌ No');
  if (debugInfo.validation.errors.length > 0) {
    console.error('Errors:', debugInfo.validation.errors);
  }
  if (debugInfo.validation.warnings.length > 0) {
    console.warn('Warnings:', debugInfo.validation.warnings);
  }
  console.groupEnd();
  
  if (debugInfo.health) {
    console.group('🏥 Health Check');
    console.log('Status:', debugInfo.health.status);
    console.log('Checks:', debugInfo.health.checks);
    console.groupEnd();
  }
  
  console.group('🧪 Specific Tests');
  console.log('URL Format:', debugInfo.tests.urlFormat ? '✅ Valid' : '❌ Invalid');
  console.log('Token Length:', debugInfo.tests.tokenLength ? '✅ Valid' : '❌ Too short');
  console.log('Token Consistency:', debugInfo.tests.tokenConsistency ? '✅ Match' : '⚠️ Differ');
  console.groupEnd();
  
  console.groupEnd();
}

/**
 * Tests API connectivity with detailed error reporting
 */
export async function testApiConnectivity(): Promise<{
  success: boolean;
  error?: string;
  details: {
    url: string;
    method: string;
    headers: Record<string, string>;
    status?: number;
    statusText?: string;
    responseTime?: number;
  }
}> {
  const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
  const token = process.env.DIRECTUS_STATIC_TOKEN;
  
  if (!directusUrl || !token) {
    return {
      success: false,
      error: 'Missing Directus URL or token',
      details: {
        url: directusUrl || 'missing',
        method: 'GET',
        headers: { Authorization: token ? 'present' : 'missing' }
      }
    };
  }
  
  const startTime = Date.now();
  const testUrl = `${directusUrl}/server/info`;
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      details: {
        url: testUrl,
        method: 'GET',
        headers: {
          'Authorization': 'present',
          'Content-Type': 'application/json'
        },
        status: response.status,
        statusText: response.statusText,
        responseTime
      }
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        url: testUrl,
        method: 'GET',
        headers: {
          'Authorization': 'present',
          'Content-Type': 'application/json'
        },
        responseTime
      }
    };
  }
}

/**
 * Simulates the exact infinite loading scenario
 */
export function simulateInfiniteLoadingScenario(): {
  wouldCauseInfiniteLoading: boolean;
  reason: string;
  fix: string;
} {
  const validation = validateAuthConfig();
  
  // Check for the exact conditions that caused infinite loading
  const hasServerToken = !!process.env.DIRECTUS_STATIC_TOKEN;
  const hasClientToken = !!process.env.NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN;
  const hasDirectusUrl = !!(process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL);
  
  if (!hasClientToken && hasServerToken && hasDirectusUrl) {
    return {
      wouldCauseInfiniteLoading: true,
      reason: 'Client-side components have no authentication token while server-side API calls work',
      fix: 'Add NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN environment variable with the same value as DIRECTUS_STATIC_TOKEN'
    };
  }
  
  if (!hasServerToken && hasClientToken) {
    return {
      wouldCauseInfiniteLoading: true,
      reason: 'Server-side API routes have no authentication token while client-side expects them to work',
      fix: 'Add DIRECTUS_STATIC_TOKEN environment variable with the same value as NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN'
    };
  }
  
  return {
    wouldCauseInfiniteLoading: false,
    reason: 'Authentication configuration appears sufficient',
    fix: 'No fix needed'
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
 * Quick authentication check for development
 */
export function quickAuthCheck(): {
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
} {
  const serverToken = process.env.DIRECTUS_STATIC_TOKEN;
  const clientToken = process.env.NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN;
  const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
  
  if (!serverToken || !clientToken || !directusUrl) {
    return {
      status: 'error',
      message: 'Critical authentication configuration missing',
      details: `Missing: ${[
        !serverToken && 'DIRECTUS_STATIC_TOKEN',
        !clientToken && 'NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN',
        !directusUrl && 'DIRECTUS_URL'
      ].filter(Boolean).join(', ')}`
    };
  }
  
  if (serverToken !== clientToken) {
    return {
      status: 'warning',
      message: 'Server and client tokens differ',
      details: 'This may cause authentication issues in some scenarios'
    };
  }
  
  if (!isValidUrl(directusUrl)) {
    return {
      status: 'error',
      message: 'Invalid Directus URL format',
      details: `URL: ${directusUrl}`
    };
  }
  
  return {
    status: 'ok',
    message: 'Authentication configuration looks good'
  };
}
