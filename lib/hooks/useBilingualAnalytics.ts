'use client';

import { useEffect, useRef } from 'react';
import {
  trackBilingualTopicView,
  trackLanguageSwitch,
  trackHebrewContentEngagement,
  detectLanguage
} from '@/lib/analytics';

export function useBilingualTopicTracking(topicId: string, topicName: string, languageUsed: 'he' | 'en' | 'transliteration') {
  const viewStartTime = useRef<number>(Date.now());
  const hasTrackedView = useRef<boolean>(false);

  useEffect(() => {
    if (!hasTrackedView.current) {
      // Track initial topic view
      trackBilingualTopicView(
        topicId,
        topicName,
        languageUsed,
        true // Assume translation available since we're using bilingual display
      );
      hasTrackedView.current = true;
    }

    // Track time spent on topic
    return () => {
      const timeSpent = Math.round((Date.now() - viewStartTime.current) / 1000);
      trackHebrewContentEngagement(
        'topic_description',
        topicId,
        'read',
        timeSpent
      );
    };
  }, [topicId, topicName, languageUsed]);
}

export function useLanguageSwitchTracking(topicId: string) {
  const lastLanguage = useRef<'he' | 'en' | 'transliteration'>('en');

  const trackSwitch = (newLanguage: 'he' | 'en' | 'transliteration', reason: 'accessibility' | 'preference' | 'curiosity' | 'comparison' | 'user_initiated' = 'user_initiated') => {
    if (lastLanguage.current !== newLanguage) {
      trackLanguageSwitch(topicId, lastLanguage.current, newLanguage, reason);
      lastLanguage.current = newLanguage;
    }
  };

  return { trackSwitch };
}

export function useContentLanguageDetection() {
  const detect = (text: string) => {
    return detectLanguage(text);
  };

  return { detect };
}

export function useBilingualAnalytics() {
  return {
    trackBilingualTopicView,
    trackLanguageSwitch,
    trackHebrewContentEngagement,
    detectLanguage,
  };
}
