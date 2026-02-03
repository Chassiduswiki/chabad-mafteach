import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.chassiduswiki.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/'], // Only expose admin, remove other sensitive paths
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
