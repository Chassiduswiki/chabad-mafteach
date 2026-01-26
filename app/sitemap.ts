import { MetadataRoute } from 'next';
import { getAllTopics } from '@/lib/api/topics';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.chassiduswiki.com';

  // Static routes
  const routes = [
    '',
    '/about',
    '/topics',
    '/explore',
    '/collections',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic topic routes
  try {
    const topics = await getAllTopics();
    const topicRoutes = topics.map((topic) => ({
      url: `${baseUrl}/topics/${topic.slug}`,
      lastModified: new Date(topic.date_updated || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...routes, ...topicRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return routes;
  }
}
