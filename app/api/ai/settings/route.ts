import { NextRequest, NextResponse } from 'next/server';
import { getDirectus } from '@/lib/directus';
import { readSingleton, updateSingleton } from '@directus/sdk';

// This endpoint manages AI settings stored in Directus
// Settings are stored in a singleton collection called 'ai_settings'

export async function GET() {
  try {
    const directus = getDirectus();
    
    const settings = await directus.request(
      readSingleton('ai_settings')
    );

    // Return settings or defaults if fields are empty
    return NextResponse.json({
      provider: settings.provider || 'openrouter',
      api_key: settings.api_key || process.env.OPENROUTER_API_KEY || '',
      primary_model: settings.primary_model || 'qwen/qwen3-next-80b-a3b-instruct:free',
      fallback_model: settings.fallback_model || 'anthropic/claude-3.5-sonnet',
      quality_threshold: settings.quality_threshold ?? 0.8,
      auto_approval_threshold: settings.auto_approval_threshold ?? 0.95,
    });
  } catch (error) {
    console.error('Failed to fetch AI settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const directus = getDirectus();
    const body = await req.json();

    // For singleton collections, we always update (no need to check if exists)
    const result = await directus.request(
      updateSingleton('ai_settings', body)
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to save AI settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
