'use client';

import { useCallback } from 'react';

export function useUmamiAnalytics() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  const track = useCallback((event: string, data?: Record<string, any>) => {
    if (!websiteId) return;
    if (typeof window === 'undefined') return;
    if (!window.umami?.track) return;

    window.umami.track(event, data);
  }, [websiteId]);

  const trackSearch = useCallback((query: string, resultsCount?: number) => {
    if (!websiteId) return;

    track('search', {
      query,
      resultsCount,
      timestamp: new Date().toISOString()
    });
  }, [track, websiteId]);

  const trackCitationClick = useCallback((sourceId: string, sourceTitle: string) => {
    if (!websiteId) return;

    track('citation_click', {
      sourceId,
      sourceTitle,
      timestamp: new Date().toISOString()
    });
  }, [track, websiteId]);

  const trackTopicExport = useCallback((topicId: string, topicTitle: string, format: string) => {
    if (!websiteId) return;

    track('topic_export', {
      topicId,
      topicTitle,
      format,
      timestamp: new Date().toISOString()
    });
  }, [track, websiteId]);

  const trackUserAction = useCallback((action: string, properties?: Record<string, any>) => {
    if (!websiteId) return;

    track(action, {
      ...properties,
      timestamp: new Date().toISOString()
    });
  }, [track, websiteId]);

  const trackContentEngagement = useCallback((contentType: string, contentId: string, action: string) => {
    if (!websiteId) return;

    track('content_engagement', {
      contentType,
      contentId,
      action, // 'view', 'share', 'bookmark', etc.
      timestamp: new Date().toISOString()
    });
  }, [track, websiteId]);

  const trackAdminAction = useCallback((action: string, details?: Record<string, any>) => {
    if (!websiteId) return;

    track('admin_action', {
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }, [track, websiteId]);

  return {
    trackSearch,
    trackCitationClick,
    trackTopicExport,
    trackUserAction,
    trackContentEngagement,
    trackAdminAction
  };
}
