import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PopupProvider } from "@/lib/popup-context";
import { GlobalPopupRenderer } from "@/components/features/popups/GlobalPopupRenderer";
import { SearchProvider } from "@/lib/search-context";
import { CommandMenu } from "@/components/features/search/CommandMenu";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

import { MobileNav } from "@/components/mobile/MobileNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chabad Mafteach - Chassidic Concepts Explorer",
  description: "Explore Chassidic concepts with citations and sources",
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
              <PopupProvider>
                {children}
                <GlobalPopupRenderer />
                <CommandMenu />
                <MobileNav />
              </PopupProvider>
            </SearchProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

