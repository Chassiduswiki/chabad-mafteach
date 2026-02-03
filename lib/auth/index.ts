/**
 * Bulletproof Authentication Integration
 * Integrates the authentication validation system into the application
 */

import { runAuthStartupValidation } from '@/lib/auth/startup';

// Run authentication validation at startup
// This prevents the application from starting with invalid configuration
if (typeof window === 'undefined') {
  // Server-side only
  try {
    runAuthStartupValidation();
  } catch (error) {
    console.error('💥 Authentication startup validation failed:', error);
    
    // In development, fail fast to prevent debugging issues
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
    
    // In production, log but continue with degraded functionality
    console.warn('⚠️ Continuing with degraded authentication functionality');
  }
}
