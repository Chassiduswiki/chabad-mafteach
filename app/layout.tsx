import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PopupProvider } from "@/lib/popup-context";
import { GlobalPopupRenderer } from "@/components/features/popups/GlobalPopupRenderer";
import { SearchProvider } from "@/lib/search-context";
import { CommandMenu } from "@/components/features/search/CommandMenu";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

import { OnboardingProvider } from "@/lib/hooks/useOnboarding";
import { OnboardingManager } from "@/components/onboarding/OnboardingManager";

import { MobileNav } from "@/components/mobile/MobileNav";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://beta.chassiduswiki.com'),
  title: {
    default: "Chabad Mafteach - Chassidic Concepts Explorer",
    template: "%s | Chabad Mafteach"
  },
  description: "Explore Chassidic concepts with citations and sources from Chabad literature. Discover the depth of Jewish mysticism, ethics, and philosophy through our comprehensive index.",
  keywords: ["Chassidus", "Chabad", "Jewish", "Kabbalah", "Torah", "Mysticism", "Philosophy", "Ethics", "Lubavitch", "Rebbe"],
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
    title: 'Chabad Mafteach - Chassidic Concepts Explorer',
    description: 'Explore Chassidic concepts with citations and sources from Chabad literature. Discover the depth of Jewish mysticism, ethics, and philosophy.',
    siteName: 'Chabad Mafteach',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Chabad Mafteach - Chassidic Concepts Explorer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chabad Mafteach - Chassidic Concepts Explorer',
    description: 'Explore Chassidic concepts with citations and sources from Chabad literature.',
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
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
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

