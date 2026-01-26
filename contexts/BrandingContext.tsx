'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface BrandingPreferences {
  primaryColor?: string;
  fontSans?: string;
  fontHebrew?: string;
  customCSS?: string;
  customJS?: string;
  siteBanner?: string;
  bannerActive?: boolean;
}

interface BrandingContextType {
  preferences: BrandingPreferences;
  updatePreferences: (preferences: BrandingPreferences) => Promise<void>;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<BrandingPreferences>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/branding', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || {});
      }
    } catch (error) {
      console.error('Failed to load branding preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: BrandingPreferences) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ preferences: newPreferences }),
      });
      
      if (response.ok) {
        setPreferences(newPreferences);
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Failed to update branding preferences:', error);
      throw error;
    }
  };

  return (
    <BrandingContext.Provider value={{ preferences, updatePreferences, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
