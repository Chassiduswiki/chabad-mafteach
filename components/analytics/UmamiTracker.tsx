'use client';

import Script from 'next/script';

interface UmamiTrackerProps {
  websiteId: string;
  host?: string;
  scriptSrc?: string;
  domains?: string[];
}

export function UmamiTracker({
  websiteId,
  host = 'http://localhost:3000',
  scriptSrc,
  domains
}: UmamiTrackerProps) {
  const src = scriptSrc || `${host}/analytics.js`;

  return (
    <Script
      src={src}
      data-website-id={websiteId}
      data-domains={domains?.join(',')}
      strategy="afterInteractive"
      onError={(e) => {
        console.warn('Failed to load Umami tracker:', e);
      }}
    />
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: any) => void;
    };
  }
}
