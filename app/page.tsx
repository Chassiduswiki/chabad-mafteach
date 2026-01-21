'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { MobileHome } from '@/components/mobile/MobileHome';
import { GlobalNav } from '@/components/layout/GlobalNav';
import { Sparkles, Zap, Globe } from 'lucide-react';

// Lazy load below-fold components
const ContentDiscovery = dynamic(() => import('@/components/features/home/ContentDiscovery').then(mod => ({ default: mod.ContentDiscovery })), {
  ssr: false,
  loading: () => <div className="h-48 bg-muted/20 animate-pulse rounded-2xl" />
});

const FeaturedTopics = dynamic(() => import('@/components/features/home/FeaturedTopics').then(mod => ({ default: mod.FeaturedTopics })), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-2xl" />
});

// Lazy load heavy background component
const FloatingHebrewLetters = dynamic(() => import('@/components/ui/FloatingHebrewLetters').then(mod => ({ default: mod.FloatingHebrewLetters })), {
  ssr: false,
  loading: () => null
});

// Lazy load animated text component
const WordRotate = dynamic(() => import('@/components/ui/WordRotate').then(mod => ({ default: mod.WordRotate })), {
  ssr: false,
  loading: () => <div className="h-12 bg-muted animate-pulse rounded"></div>
});

// Lazy load command menu
const CommandMenuTrigger = dynamic(() => import('@/components/features/search/CommandMenuTrigger').then(mod => ({ default: mod.CommandMenuTrigger })), {
  ssr: false,
  loading: () => <div className="h-10 bg-muted animate-pulse rounded-lg"></div>
});

export default function Home() {
  return (
    <>
      <Head>
        <title>Chabad Maftaiach - Master Index of Chassidic Wisdom</title>
        <meta name="description" content="Explore Chassidic concepts and discover sources. A comprehensive index connecting topics to their sources across all Chabad literature." />
        <meta name="keywords" content="Chassidus, Chabad, Torah, Jewish wisdom, Chassidic concepts, Tanya, Kabbalah" />
        <meta property="og:title" content="Chabad Maftaiach - Master Index of Chassidic Wisdom" />
        <meta property="og:description" content="Explore Chassidic concepts and discover sources across all Chabad literature." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chabad Maftaiach" />
        <meta name="twitter:description" content="Master Index of Chassidic Wisdom" />
      </Head>
      <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">

      {/* Background - Subtle accent */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Subtle top glow */}
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

        {/* Floating Hebrew Letters */}
        <FloatingHebrewLetters />
      </div>

      {/* Global Navigation */}
      <GlobalNav transparent />

      {/* Mobile Homepage - App-like Dashboard (Task 2.11) */}
      <div className="lg:hidden">
        <MobileHome />
      </div>

      {/* Desktop Homepage - Google-like Hero (Original) */}
      <main id="main-content" className="hidden lg:flex relative z-10 mx-auto max-w-6xl flex-col items-center px-6 pt-16 sm:px-8 sm:pt-20 lg:pt-24">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-12 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-md"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span>v2.0 Now Available</span>
        </motion.div>

        {/* Hero Title */}
        <div className="flex flex-col items-center justify-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
            className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1]"
          >
            Master Index of
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="mt-2"
          >
            <WordRotate
              words={["Chassidic Wisdom", "Divine Truth", "Inner Light", "Torah Knowledge"]}
              className="text-primary text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]"
            />
          </motion.div>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="mt-8 max-w-2xl text-center text-base text-muted-foreground sm:text-lg leading-relaxed"
        >
          Explore concepts, discover sources. A comprehensive index connecting Chassidic topics to their sources across all Chabad literature.
        </motion.p>

        {/* Command Palette Trigger Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="mt-12 w-full max-w-2xl"
        >
          <CommandMenuTrigger />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted-foreground sm:gap-8">
            <span className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> AI-Powered
            </span>
            <span className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1">
              <Zap className="h-3.5 w-3.5 text-blue-500" /> Instant Results
            </span>
            <span className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1">
              <Globe className="h-3.5 w-3.5 text-emerald-500" /> Bi-Lingual
            </span>
          </div>
        </motion.div>

        {/* Content Discovery Section - Moved up for above-fold visibility */}
        <div className="mt-24 w-full" data-onboarding="explore-section">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground">
            Discover Content
          </h2>
          <ContentDiscovery />
        </div>

        {/* Featured Topics - Real Content (Task 2.13) */}
        <div className="mt-24 w-full">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground">
            Explore Topics
          </h2>
          <FeaturedTopics />
        </div>

        {/* Spacer */}
        <div className="pb-32" />

      </main>
      </div>
    </>
  );
}
