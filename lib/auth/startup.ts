/**
 * Startup Authentication Validation
 * Runs at application startup to prevent authentication issues
 */

import { validateAuthConfig, AuthErrorType, AuthError } from './validation';

/**
 * Validates authentication configuration at startup
 * Throws descriptive errors if configuration is invalid
 */
export function validateStartupAuth(): void {
  const validation = validateAuthConfig();
  
  if (!validation.isValid) {
    const errorMessage = `🚨 Authentication Configuration Error:\n${validation.errors.map(error => `  • ${error}`).join('\n')}`;
    
    // In development, throw an error to stop the server
    if (process.env.NODE_ENV === 'development') {
      throw new AuthError(
        AuthErrorType.MISSING_SERVER_TOKEN,
        errorMessage,
        { errors: validation.errors, warnings: validation.warnings }
      );
    }
    
    // In production, log but don't crash (with graceful degradation)
    console.error('🚨 Critical authentication configuration errors detected:', validation.errors);
    
    // Check if we can still function
    const hasBasicAuth = validation.config.staticToken && validation.config.directusUrl;
    if (!hasBasicAuth) {
      throw new AuthError(
        AuthErrorType.MISSING_SERVER_TOKEN,
        'Cannot start application without basic authentication configuration'
      );
    }
  }
  
  // Log warnings
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Authentication warnings:', validation.warnings);
  }
  
  console.log('✅ Authentication configuration validated successfully');
}

/**
 * Environment variable validation for deployment
 */
export function validateEnvironmentVariables(): void {
  const requiredVars = [
    'DIRECTUS_URL',
    'DIRECTUS_STATIC_TOKEN',
    'NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    const message = `Missing required environment variables: ${missingVars.join(', ')}`;
    throw new AuthError(
      AuthErrorType.MISSING_SERVER_TOKEN,
      message,
      { missingVars }
    );
  }
}

/**
 * Validates that client and server tokens match
 */
export function validateTokenConsistency(): void {
  const serverToken = process.env.DIRECTUS_STATIC_TOKEN;
  const clientToken = process.env.NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN;
  
  if (serverToken && clientToken && serverToken !== clientToken) {
    console.warn('⚠️ Server and client tokens differ. This may cause authentication issues.');
    console.warn(`Server token: ${serverToken.substring(0, 8)}...`);
    console.warn(`Client token: ${clientToken.substring(0, 8)}...`);
  }
}

/**
 * Comprehensive startup validation
 */
export function runAuthStartupValidation(): void {
  console.log('🔍 Running authentication startup validation...');
  
  try {
    validateEnvironmentVariables();
    validateTokenConsistency();
    validateStartupAuth();
    
    console.log('🎉 Authentication system ready');
  } catch (error) {
    console.error('💥 Authentication startup validation failed:', error);
    throw error;
  }
}
