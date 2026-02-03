/**
 * Authentication Health Check API Endpoint
 * Provides real-time authentication system status
 */

import { NextRequest, NextResponse } from 'next/server';
import { performAuthHealthCheck, validateAuthConfig } from '@/lib/auth/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/health
 * Returns authentication system health status
 */
export async function GET(request: NextRequest) {
  try {
    // Perform comprehensive health check
    const [healthCheck, configValidation] = await Promise.all([
      performAuthHealthCheck(),
      Promise.resolve(validateAuthConfig())
    ]);

    // Determine HTTP status based on health
    let statusCode = 200;
    if (healthCheck.status === 'critical') {
      statusCode = 503; // Service Unavailable
    } else if (healthCheck.status === 'degraded') {
      statusCode = 200; // Still serve, but indicate issues
    } else if (!configValidation.isValid) {
      statusCode = 500; // Configuration error
    }

    const response = {
      status: healthCheck.status,
      healthy: healthCheck.status === 'healthy',
      checks: healthCheck.checks,
      config: {
        valid: configValidation.isValid,
        errors: configValidation.errors,
        warnings: configValidation.warnings,
        hasDirectusUrl: !!configValidation.config.directusUrl,
        hasServerToken: !!configValidation.config.staticToken,
        hasClientToken: !!configValidation.config.publicStaticToken
      },
      timestamp: healthCheck.timestamp,
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    };

    return NextResponse.json(response, { status: statusCode });
    
  } catch (error) {
    console.error('Auth health check failed:', error);
    
    return NextResponse.json({
      status: 'critical',
      healthy: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

/**
 * POST /api/auth/health/test
 * Tests authentication connectivity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType = 'connectivity' } = body;

    let testResult;
    
    switch (testType) {
      case 'connectivity':
        testResult = await performAuthHealthCheck();
        break;
      
      case 'configuration':
        testResult = validateAuthConfig();
        break;
      
      default:
        return NextResponse.json({
          error: 'Invalid test type',
          validTypes: ['connectivity', 'configuration']
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      testType,
      result: testResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Auth test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
