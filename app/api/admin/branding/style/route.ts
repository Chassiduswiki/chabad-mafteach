import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readSingleton, updateSingleton, readItems, updateItem, createItem } from '@directus/sdk';
import { verifyAuth } from '@/lib/auth';

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

export async function GET(req: NextRequest) {
  try {
    const directus = createClient();

    // Try to read from site_settings singleton or a dedicated settings collection
    try {
      const settings = await directus.request(readSingleton('site_settings' as any));
      if (settings && (settings as any).style_settings) {
        return NextResponse.json({ 
          settings: JSON.parse((settings as any).style_settings) 
        });
      }
    } catch {
      // Collection might not exist, return defaults
    }

    return NextResponse.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Error fetching style settings:', error);
    return NextResponse.json({ settings: defaultSettings });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = verifyAuth(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { settings } = await req.json();

    if (!settings) {
      return NextResponse.json({ error: 'Settings required' }, { status: 400 });
    }

    const directus = createClient();

    // Try to save to site_settings singleton
    try {
      await directus.request(updateSingleton('site_settings' as any, {
        style_settings: JSON.stringify(settings)
      }));
      return NextResponse.json({ success: true, settings });
    } catch (e) {
      // If singleton doesn't exist, log the issue
      console.warn('site_settings collection not found. Style settings not persisted.');
      console.warn('Create a singleton collection "site_settings" with a "style_settings" JSON field to persist these settings.');
      
      // Return success anyway - settings would need to be stored in localStorage on client
      return NextResponse.json({ 
        success: true, 
        settings,
        warning: 'Settings not persisted to database. Create site_settings collection to enable persistence.'
      });
    }
  } catch (error) {
    console.error('Error saving style settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
