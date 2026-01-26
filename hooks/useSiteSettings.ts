'use client';

import { useQuery } from '@tanstack/react-query';

export interface SiteSettings {
  id: string;
  site_name: string;
  tagline?: string;
  search_placeholder?: string;
  homepage_hero_title?: string;
  homepage_hero_subtitle?: string;
  about_title?: string;
  about_content?: string;
}

export function useSiteSettings() {
  return useQuery<SiteSettings>({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await fetch('/api/site-settings');
      if (!res.ok) throw new Error('Failed to fetch site settings');
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
