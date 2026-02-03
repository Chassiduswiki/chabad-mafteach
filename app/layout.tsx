import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Hydrate } from '@/components/Hydrate';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { UmamiTracker } from '@/components/analytics/UmamiTracker';
import { LanguageSelector } from '@/components/LanguageSelector';
import { AnalyticsTracker } from '@/lib/analytics-tracker';
import '@/lib/auth'; // Initialize authentication validation
import { Settings } from "lucide-react";
import "./globals.css";
import { PopupProvider } from "@/lib/popup-context";
import { GlobalPopupRenderer } from "@/components/features/popups/GlobalPopupRenderer";
import { SearchProvider } from "@/lib/search-context";
import { CommandMenu } from "@/components/features/search/CommandMenu";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AnalyticsTrackerComp } from "@/lib/analytics-tracker";

import { OnboardingProvider } from "@/lib/hooks/useOnboarding";
import { OnboardingManager } from "@/components/onboarding/OnboardingManager";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

import { MobileNav } from "@/components/mobile/MobileNav";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { UserMenu } from "@/components/auth/UserMenu";
import { GlobalBanner } from "@/components/layout/GlobalBanner";
import { createClient } from "@/lib/directus";
import { readItems, readSingleton } from "@directus/sdk";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

async function getBrandingSettings() {
  const cacheKey = 'branding-settings';
  const cacheTime = 5 * 60 * 1000; // 5 minutes
  
  try {
    // In production, you could use Redis or another cache
    // For now, we'll optimize by making the call more efficient
    const directus = createClient();
    const settings = await directus.request(readItems('topics', {
      filter: { slug: { _eq: 'site-branding-settings' } },
      limit: 1,
      fields: ['metadata.branding']
    } as any));
    return (settings as any[])[0]?.metadata?.branding || {};
  } catch (error) {
    return {};
  }
}

async function getSiteSettings() {
  try {
    const directus = createClient();
    const settings = await directus.request(readSingleton('site_settings'));
    return settings as any;
  } catch (error) {
    return null;
  }
}

async function getMaintenanceStatus() {
  try {
    const directus = createClient();
    const topics = await directus.request(readItems('topics', {
      filter: { slug: { _eq: 'system-maintenance' } },
      fields: ['metadata.is_maintenance'],
      limit: 1
    } as any));
    return (topics as any[])[0]?.metadata?.is_maintenance || false;
  } catch (error) {
    return false;
  }
}

async function isAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return false;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    const { payload } = await jwtVerify(token, secret);
    return payload.role === 'admin' || payload.role === 'editor';
  } catch (error) {
    return false;
  }
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://beta.chassiduswiki.com'),
  title: {
    default: "Chabad Mafteach - Deepen Your Understanding",
    template: "%s | Chabad Mafteach"
  },
  description: "Explore Chassidic concepts and discover the sources that illuminate them. Your thinking space for Torah.",
  keywords: ["Chassidus", "Chabad", "Torah", "Jewish wisdom", "Kabbalah", "Tanya", "Mysticism"],
  authors: [{ name: "Chabad Mafteach Team" }],
  creator: "Chabad Mafteach",
  publisher: "Chabad Mafteach",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Chabad Mafteach - Deepen Your Understanding',
    description: 'Explore Chassidic concepts and discover connections across all Chabad literature.',
    siteName: 'Chabad Mafteach',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Chabad Mafteach - Deepen Your Understanding',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chabad Mafteach - Deepen Your Understanding',
    description: 'Your Torah thinking space. Explore concepts and discover connections.',
    images: ['/og-image.png'],
    creator: '@chabadmafteach',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chabad Mafteach',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Run all API calls in parallel for better performance
  const [branding, siteSettings, isMaintenanceActive, userIsAdmin] = await Promise.all([
    getBrandingSettings(),
    getSiteSettings(),
    getMaintenanceStatus(),
    isAdmin()
  ]);

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Performance Optimization: Preload critical assets for LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Custom Branding CSS Injection */}
        {branding.customCss && (
          <style dangerouslySetInnerHTML={{ __html: branding.customCss }} />
        )}

        {/* Custom Branding JS Injection */}
        {branding.customJs && (
          <script dangerouslySetInnerHTML={{ __html: branding.customJs }} />
        )}
      </head>
      <body className={inter.variable}>
        {/* Umami Analytics - only in production and when configured */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <UmamiTracker
            websiteId={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            scriptSrc={process.env.UMAMI_CLOUD_SCRIPT_SRC || 'https://cloud.umami.is/script.js'}
          />
        )}
        <AnalyticsTrackerComp />
        <GlobalBanner />
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <QueryProvider>
            <LanguageProvider>
              <SearchProvider>
                <OnboardingProvider>
                  <PopupProvider>
                  {isMaintenanceActive && !userIsAdmin ? (
                    <div className="min-h-screen flex items-center justify-center bg-background px-4">
                      <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20">
                          <Settings className="w-10 h-10 text-amber-600 animate-spin-slow" />
                        </div>
                        <div className="space-y-2">
                          <h1 className="text-3xl font-serif italic text-foreground tracking-tight">
                            {siteSettings?.site_name || 'Chabad Mafteach'}
                          </h1>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60">
                            {siteSettings?.tagline || 'System Refinement'}
                          </p>
                          <p className="text-muted-foreground font-light pt-2">
                            We are currently updating the encyclopedia engine to better serve your learning experience.
                            We'll be back online shortly.
                          </p>
                        </div>
                        <div className="pt-4 flex flex-col items-center gap-4">
                          <div className="px-4 py-1.5 rounded-full bg-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border/50">
                            Maintenance Mode Active
                          </div>
                          <Link href="/auth/signin" className="text-xs text-primary hover:underline">
                            Admin Login
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ErrorBoundary componentName="RootLayout">
                        {children}
                      </ErrorBoundary>
                      <GlobalPopupRenderer />
                      <CommandMenu />
                      <MobileNav />
                      <OnboardingManager />
                    </>
                  )}
                  </PopupProvider>
                </OnboardingProvider>
              </SearchProvider>
            </LanguageProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

