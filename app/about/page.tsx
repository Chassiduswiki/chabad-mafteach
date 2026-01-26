import { Metadata } from 'next';
import { createClient } from '@/lib/directus';
import { readSingleton } from '@directus/sdk';
import { AboutClient } from '@/components/features/about/AboutClient';
import { copy } from '@/lib/copy';

export const dynamic = 'force-dynamic';

async function getSettings() {
  try {
    const directus = createClient();
    const settings = await directus.request(readSingleton('site_settings'));
    return settings;
  } catch (error) {
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) {
      const err: any = error;
      const message =
        err?.errors?.[0]?.message ||
        err?.message ||
        (typeof err === 'string' ? err : 'Unknown error');
      const status = err?.response?.status || err?.status;
      console.error('Error fetching settings for about metadata:', {
        message,
        status,
        hasDirectusUrl: !!(process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL),
        hasStaticToken: !!process.env.DIRECTUS_STATIC_TOKEN
      });
    }
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings() as any;
  
  return {
    title: `${settings?.about_title || 'About'} | ${settings?.site_name || 'Chabad Mafteach'}`,
    description: copy.meta.defaultDescription,
    openGraph: {
      title: `${settings?.about_title || 'About'} | ${settings?.site_name || 'Chabad Mafteach'}`,
      description: copy.meta.defaultDescription,
    }
  };
}

export default async function AboutPage() {
  const settings = await getSettings();
  
  return <AboutClient settings={settings as any} />;
}
