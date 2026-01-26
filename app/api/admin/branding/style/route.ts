import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readSingleton, updateSingleton } from '@directus/sdk';
import { verifyAuth } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

/**
 * Branding Style Settings API
 * 
 * Provides robust persistence for design tokens with multiple fallback layers:
 * 1. Directus `site_settings` singleton (primary, if available)
 * 2. Local JSON file (fallback, always works)
 * 3. In-memory cache (performance optimization)
 * 
 * This ensures the branding UI always works, even if Directus is misconfigured.
 */

interface StyleSettings {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  darkModeDefault: boolean;
}

const defaultSettings: StyleSettings = {
  primaryColor: '#2563eb',
  accentColor: '#8b5cf6',
  fontFamily: 'system',
  borderRadius: 'lg',
  darkModeDefault: false,
};

// In-memory cache for performance
let settingsCache: StyleSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

// File-based fallback path (works in all environments)
const getSettingsFilePath = () => {
  // Use a consistent path relative to the project root
  // This file is gitignored and environment-specific
  return path.join(process.cwd(), '.data', 'branding-style.json');
};

/**
 * Ensure the .data directory exists for file-based storage
 */
async function ensureDataDir(): Promise<void> {
  const dataDir = path.join(process.cwd(), '.data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory may already exist, ignore
  }
}

/**
 * Read settings from local file fallback
 */
async function readFromFile(): Promise<StyleSettings | null> {
  try {
    const filePath = getSettingsFilePath();
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as StyleSettings;
  } catch {
    return null;
  }
}

/**
 * Write settings to local file fallback
 */
async function writeToFile(settings: StyleSettings): Promise<boolean> {
  try {
    await ensureDataDir();
    const filePath = getSettingsFilePath();
    await fs.writeFile(filePath, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[Branding] Failed to write to file fallback:', error);
    return false;
  }
}

/**
 * Attempt to read from Directus singleton
 */
async function readFromDirectus(): Promise<StyleSettings | null> {
  try {
    const directus = createClient();
    const settings = await directus.request(readSingleton('site_settings' as any));
    if (settings && (settings as any).style_settings) {
      const parsed = typeof (settings as any).style_settings === 'string'
        ? JSON.parse((settings as any).style_settings)
        : (settings as any).style_settings;
      return parsed as StyleSettings;
    }
    return null;
  } catch {
    // Directus collection may not exist - this is expected, use fallback
    return null;
  }
}

/**
 * Attempt to write to Directus singleton
 */
async function writeToDirectus(settings: StyleSettings): Promise<boolean> {
  try {
    const directus = createClient();
    await directus.request(updateSingleton('site_settings' as any, {
      style_settings: JSON.stringify(settings)
    }));
    return true;
  } catch {
    // Directus collection may not exist - this is expected
    return false;
  }
}

/**
 * GET /api/admin/branding/style
 * Returns current branding settings with intelligent fallback
 */
export async function GET(req: NextRequest) {
  try {
    // Check cache first for performance
    const now = Date.now();
    if (settingsCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
      return NextResponse.json({
        settings: settingsCache,
        source: 'cache'
      });
    }

    // Try Directus first (primary source)
    const directusSettings = await readFromDirectus();
    if (directusSettings) {
      settingsCache = directusSettings;
      cacheTimestamp = now;
      return NextResponse.json({
        settings: directusSettings,
        source: 'directus'
      });
    }

    // Try file fallback
    const fileSettings = await readFromFile();
    if (fileSettings) {
      settingsCache = fileSettings;
      cacheTimestamp = now;
      return NextResponse.json({
        settings: fileSettings,
        source: 'file'
      });
    }

    // Return defaults if nothing is persisted yet
    return NextResponse.json({
      settings: defaultSettings,
      source: 'default'
    });
  } catch (error) {
    console.error('[Branding] Error fetching style settings:', error);
    return NextResponse.json({
      settings: defaultSettings,
      source: 'error-fallback'
    });
  }
}

/**
 * POST /api/admin/branding/style
 * Saves branding settings with multi-layer persistence
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const auth = verifyAuth(req);
    const isDev = process.env.NODE_ENV === 'development';

    if (!auth && !isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth && auth.role !== 'admin' && !isDev) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { settings } = await req.json();

    if (!settings) {
      return NextResponse.json({ error: 'Settings required' }, { status: 400 });
    }

    // Validate settings structure
    const validatedSettings: StyleSettings = {
      primaryColor: settings.primaryColor || defaultSettings.primaryColor,
      accentColor: settings.accentColor || defaultSettings.accentColor,
      fontFamily: settings.fontFamily || defaultSettings.fontFamily,
      borderRadius: settings.borderRadius || defaultSettings.borderRadius,
      darkModeDefault: typeof settings.darkModeDefault === 'boolean'
        ? settings.darkModeDefault
        : defaultSettings.darkModeDefault,
    };

    // Update cache immediately
    settingsCache = validatedSettings;
    cacheTimestamp = Date.now();

    // Attempt to save to Directus (primary)
    const directusSaved = await writeToDirectus(validatedSettings);

    // Always save to file fallback for reliability
    const fileSaved = await writeToFile(validatedSettings);

    // Determine response based on what succeeded
    const persistenceLayers: string[] = [];
    if (directusSaved) persistenceLayers.push('directus');
    if (fileSaved) persistenceLayers.push('file');
    persistenceLayers.push('cache'); // Cache is always updated

    if (!directusSaved && !fileSaved) {
      // Both persistence layers failed, but cache still works
      console.warn('[Branding] All persistence layers failed, settings only in memory');
      return NextResponse.json({
        success: true,
        settings: validatedSettings,
        warning: 'Settings saved to memory only. They will be lost on restart.',
        persistedTo: ['cache']
      });
    }

    return NextResponse.json({
      success: true,
      settings: validatedSettings,
      persistedTo: persistenceLayers
    });

  } catch (error) {
    console.error('[Branding] Error saving style settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
