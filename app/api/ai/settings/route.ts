import { NextRequest, NextResponse } from 'next/server';
import { getDirectus } from '@/lib/directus';
import { DEFAULT_AI_MODEL } from '@/lib/ai/config';
import { readSingleton, updateSingleton } from '@directus/sdk';
import { requirePermission } from '@/lib/security/permissions';
import { decryptString, encryptString, isEncrypted } from '@/lib/security/encryption';
import { adminReadRateLimit, adminWriteRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';
import { withAudit } from '@/lib/security/audit';

// This endpoint manages AI settings stored in Directus
// Settings are stored in a singleton collection called 'ai_settings'

export const GET = requirePermission('canAccessAnalytics', withAudit('read', 'admin.ai-settings', async (request: NextRequest) => {
  const rateLimited = enforceRateLimit(request, adminReadRateLimit);
  if (rateLimited) return rateLimited;

  try {
    const directus = getDirectus();

    // @ts-ignore - Directus SDK typing issue with untyped client
    const settings = await directus.request(
      readSingleton('ai_settings')
    );

    const rawApiKey = settings.api_key || process.env.OPENROUTER_API_KEY || '';
    const apiKey = rawApiKey && isEncrypted(rawApiKey) ? decryptString(rawApiKey) : rawApiKey;

    // Return settings or defaults if fields are empty
    return NextResponse.json({
      provider: settings.provider || 'openrouter',
      api_key: apiKey,
      primary_model: settings.primary_model || DEFAULT_AI_MODEL,
      fallback_model: settings.fallback_model || 'anthropic/claude-3.5-sonnet',
      quality_threshold: settings.quality_threshold ?? 0.8,
      auto_approval_threshold: settings.auto_approval_threshold ?? 0.95,
    });
  } catch (error) {
    console.error('Failed to fetch AI settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}));

export const POST = requirePermission('canAccessAnalytics', withAudit('update', 'admin.ai-settings', async (req: NextRequest) => {
  const rateLimited = enforceRateLimit(req, adminWriteRateLimit);
  if (rateLimited) return rateLimited;

  try {
    const directus = getDirectus();
    const body = await req.json();

    const apiKey = typeof body.api_key === 'string' && body.api_key.length > 0
      ? encryptString(body.api_key)
      : body.api_key;

    const payload = {
      ...body,
      ...(typeof body.api_key !== 'undefined' ? { api_key: apiKey } : {})
    };

    // For singleton collections, we always update (no need to check if exists)
    // @ts-ignore - Directus SDK typing issue with untyped client
    const result = await directus.request(
      updateSingleton('ai_settings', payload)
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to save AI settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}));
