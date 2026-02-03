import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/security/permissions';
import { withAudit } from '@/lib/security/audit';
import { adminReadRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';
import { debugDisabledResponse, isDebugEnabled } from '@/lib/monitoring/debug';

export const GET = requirePermission('canAccessDebug', withAudit('read', 'debug.ai-status', async (request: NextRequest) => {
  const rateLimited = enforceRateLimit(request, adminReadRateLimit);
  if (rateLimited) return rateLimited;
  if (!isDebugEnabled()) return debugDisabledResponse();
  try {
    // Check environment variables (without exposing actual values)
    const envStatus = {
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing',
      DIRECTUS_URL: process.env.DIRECTUS_URL ? '✅ Set' : '❌ Missing',
      DIRECTUS_STATIC_TOKEN: process.env.DIRECTUS_STATIC_TOKEN ? '✅ Set' : '❌ Missing',
    };

    // Test basic connectivity to OpenRouter
    let openRouterConnectivity = '❌ Not tested';
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
        });
        openRouterConnectivity = response.ok ? '✅ Connected' : `❌ Error (${response.status})`;
      } catch (error) {
        openRouterConnectivity = '❌ Connection failed';
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envStatus,
      services: {
        openRouter: openRouterConnectivity,
      },
      message: 'Debug information for troubleshooting AI services'
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}));
