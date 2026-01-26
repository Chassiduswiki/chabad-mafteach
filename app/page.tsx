import { Metadata } from 'next';
import { createClient } from '@/lib/directus';
import { readSingleton } from '@directus/sdk';
import { HomeClient } from '@/components/features/home/HomeClient';
import { copy } from '@/lib/copy';

export const dynamic = 'force-dynamic';

async function getSettings() {
  try {
    const directus = createClient();
    const settings = await directus.request(readSingleton('site_settings'));
    return settings;
  } catch (error) {
    console.error('Error fetching settings for metadata:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings() as any;
  
  return {
    title: settings?.site_name || copy.meta.defaultTitle,
    description: copy.meta.defaultDescription,
    keywords: [...copy.meta.keywords],
    openGraph: {
      title: settings?.site_name || copy.meta.ogTitle,
      description: copy.meta.ogDescription,
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: settings?.site_name || copy.meta.twitterTitle,
      description: copy.meta.twitterDescription,
      images: ['/og-image.png'],
    }
  };
}

export default async function HomePage() {
  const settings = await getSettings();
  
  return <HomeClient settings={settings as any} />;
}
