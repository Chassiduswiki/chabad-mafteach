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
    console.error('Error fetching settings for about metadata:', error);
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
