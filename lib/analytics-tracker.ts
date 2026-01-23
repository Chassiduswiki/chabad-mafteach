'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface AnalyticsEvent {
  type: 'page_view' | 'search' | 'click' | 'session_start';
  data: Record<string, any>;
  timestamp: number;
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private sessionId: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.initSession();
  }

  private initSession() {
    // Check for existing session
    this.sessionId = sessionStorage.getItem('analytics_session_id');
    
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', this.sessionId);
      this.track('session_start', { newSession: true });
    }
  }

  track(type: AnalyticsEvent['type'], data: Record<string, any>) {
    const event: AnalyticsEvent = {
      type,
      data: {
        ...data,
        sessionId: this.sessionId,
        userId: this.userId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    this.events.push(event);
    
    // Send events in batch
    this.flushEvents();
  }

  private async flushEvents() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
      });
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-add events on failure
      this.events.unshift(...eventsToSend);
    }
  }

  pageView(path: string, title?: string) {
    this.track('page_view', { path, title });
  }

  search(query: string, resultsCount?: number) {
    this.track('search', { query, resultsCount });
  }

  click(element: string, properties?: Record<string, any>) {
    this.track('click', { element, ...properties });
  }

  setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('analytics_user_id', userId);
  }
}

// Create singleton instance
const analytics = new AnalyticsTracker();

// React hook for analytics
export function useAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page views
    analytics.pageView(pathname, document.title);
  }, [pathname]);

  return {
    track: analytics.track.bind(analytics),
    search: analytics.search.bind(analytics),
    click: analytics.click.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
  };
}

// Analytics component for automatic page tracking
export function AnalyticsTracker({ path, title }: { path: string; title?: string }) {
  useEffect(() => {
    analytics.pageView(path, title);
  }, [path, title]);

  return null;
}

export default analytics;
