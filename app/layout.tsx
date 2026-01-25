import type { Metadata } from "next";
import { Inter } from "next/font/google";
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

import { MobileNav } from "@/components/mobile/MobileNav";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { UserMenu } from "@/components/auth/UserMenu";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <AnalyticsTrackerComp />
        {/* Skip to content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <QueryProvider>
            <SearchProvider>
              <OnboardingProvider>
                <PopupProvider>
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                  <GlobalPopupRenderer />
                  <CommandMenu />
                  <MobileNav />
                  <OnboardingManager />
                </PopupProvider>
              </OnboardingProvider>
            </SearchProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

