'use client';

import React, { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GlobalBanner() {
  const [branding, setBranding] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/branding');
        if (res.ok) {
          const data = await res.json();
          setBranding(data);
          // Only show if enabled and has text
          if (data.bannerEnabled && data.bannerText) {
            // Check if this specific message was already dismissed in this session
            const dismissed = sessionStorage.getItem('mafteach_banner_dismissed');
            if (dismissed !== data.bannerText) {
              setIsVisible(true);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch banner settings:', error);
      }
    };

    fetchBranding();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (branding?.bannerText) {
      sessionStorage.setItem('mafteach_banner_dismissed', branding.bannerText);
    }
  };

  if (!isVisible || !branding?.bannerText) return null;

  return (
    <div 
      className={cn(
        "relative w-full py-2.5 px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-in-out z-[100] border-b",
        "bg-primary text-primary-foreground shadow-md"
      )}
      style={{ 
        backgroundColor: branding.primaryColor,
        borderColor: `${branding.primaryColor}20`
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-center gap-3">
          <span className="flex p-1.5 rounded-lg bg-white/20 backdrop-blur-sm shadow-inner shrink-0">
            <Megaphone className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium leading-tight">
            {branding.bannerText}
          </p>
        </div>
        <div className="shrink-0 flex items-center">
          <button
            type="button"
            className="-mr-1 flex p-1.5 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
            onClick={handleDismiss}
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-4 w-4 text-white" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
