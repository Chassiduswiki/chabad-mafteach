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
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) {
      const err: any = error;
      const message =
        err?.errors?.[0]?.message ||
        err?.message ||
        (typeof err === 'string' ? err : 'Unknown error');
      const status = err?.response?.status || err?.status;
      console.error('Error fetching settings for metadata:', {
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
