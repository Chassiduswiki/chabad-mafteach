'use client';

import { useEffect } from 'react';
import { useBranding } from '@/contexts/BrandingContext';

interface BrandingInjectorProps {
  children: React.ReactNode;
}

export function BrandingInjector({ children }: BrandingInjectorProps) {
  const { preferences } = useBranding();

  useEffect(() => {
    // Apply custom CSS
    if (preferences.customCSS) {
      // Remove existing custom CSS if any
      const existingStyle = document.getElementById('user-custom-css');
      if (existingStyle) {
        existingStyle.remove();
      }

      // Add new custom CSS
      const style = document.createElement('style');
      style.id = 'user-custom-css';
      style.textContent = preferences.customCSS;
      document.head.appendChild(style);
    }

    // Apply custom JS
    if (preferences.customJS) {
      // Remove existing custom JS if any
      const existingScript = document.getElementById('user-custom-js');
      if (existingScript) {
        existingScript.remove();
      }

      // Add new custom JS
      const script = document.createElement('script');
      script.id = 'user-custom-js';
      script.textContent = preferences.customJS;
      document.body.appendChild(script);
    }

    // Apply custom fonts
    if (preferences.fontSans || preferences.fontHebrew) {
      // Create font CSS
      let fontCSS = '';
      
      if (preferences.fontSans) {
        fontCSS += `
          body, .font-sans {
            font-family: "${preferences.fontSans}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }
        `;
      }
      
      if (preferences.fontHebrew) {
        fontCSS += `
          .font-hebrew, [lang="he"], [lang="he-il"] {
            font-family: "${preferences.fontHebrew}", "Frank Ruhl Libre", "Noto Sans Hebrew", sans-serif !important;
          }
        `;
      }

      // Remove existing font override if any
      const existingFontStyle = document.getElementById('user-font-override');
      if (existingFontStyle) {
        existingFontStyle.remove();
      }

      // Add new font CSS
      if (fontCSS) {
        const style = document.createElement('style');
        style.id = 'user-font-override';
        style.textContent = fontCSS;
        document.head.appendChild(style);
      }
    }

    // Apply primary color
    if (preferences.primaryColor) {
      // Remove existing color override if any
      const existingColorStyle = document.getElementById('user-color-override');
      if (existingColorStyle) {
        existingColorStyle.remove();
      }

      // Add new color CSS
      const colorCSS = `
        :root {
          --primary: ${preferences.primaryColor};
          --primary-foreground: ${getContrastColor(preferences.primaryColor)};
        }
        
        .bg-primary {
          background-color: ${preferences.primaryColor} !important;
        }
        
        .text-primary {
          color: ${preferences.primaryColor} !important;
        }
        
        .border-primary {
          border-color: ${preferences.primaryColor} !important;
        }
        
        .ring-primary {
          --tw-ring-color: ${preferences.primaryColor} !important;
        }
      `;

      const style = document.createElement('style');
      style.id = 'user-color-override';
      style.textContent = colorCSS;
      document.head.appendChild(style);
    }

    // Cleanup function
    return () => {
      const customStyle = document.getElementById('user-custom-css');
      const customScript = document.getElementById('user-custom-js');
      const fontStyle = document.getElementById('user-font-override');
      const colorStyle = document.getElementById('user-color-override');
      
      if (customStyle) customStyle.remove();
      if (customScript) customScript.remove();
      if (fontStyle) fontStyle.remove();
      if (colorStyle) colorStyle.remove();
    };
  }, [preferences]);

  // Site Banner
  useEffect(() => {
    if (preferences.bannerActive && preferences.siteBanner) {
      // Remove existing banner if any
      const existingBanner = document.getElementById('site-banner');
      if (existingBanner) {
        existingBanner.remove();
      }

      // Add new banner
      const banner = document.createElement('div');
      banner.id = 'site-banner';
      banner.className = 'bg-primary text-primary-foreground px-4 py-2 text-center font-medium z-50';
      banner.innerHTML = preferences.siteBanner;
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
      `;

      // Add space to body to account for banner
      document.body.style.paddingTop = '48px';
      document.body.insertBefore(banner, document.body.firstChild);

      return () => {
        banner.remove();
        document.body.style.paddingTop = '';
      };
    } else {
      // Remove banner if it exists
      const existingBanner = document.getElementById('site-banner');
      if (existingBanner) {
        existingBanner.remove();
        document.body.style.paddingTop = '';
      }
    }
  }, [preferences.bannerActive, preferences.siteBanner]);

  return <>{children}</>;
}

// Helper function to determine contrast color
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
