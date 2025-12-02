import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PopupProvider } from "@/lib/popup-context";
import { GlobalPopupRenderer } from "@/components/GlobalPopupRenderer";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <PopupProvider>
          {children}
          <GlobalPopupRenderer />
        </PopupProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
