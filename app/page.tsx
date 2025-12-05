'use client';

import { motion } from 'framer-motion';
import { CommandMenuTrigger } from '@/components/CommandMenuTrigger';
import Link from 'next/link';
import { Sparkles, ArrowRight, BookOpen, Search, Zap, Globe } from 'lucide-react';
import { FloatingHebrewLetters } from '@/components/ui/FloatingHebrewLetters';
import { WordRotate } from '@/components/ui/WordRotate';
import { ThemeToggleCompact } from '@/components/ThemeToggle';
import { ContentDiscovery } from '@/components/ContentDiscovery';
import { MobileHome } from '@/components/mobile/MobileHome';
import { FeaturedTopics } from '@/components/FeaturedTopics';

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">

      {/* Background Gradients - Premium Blue Theme */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Top Center Glow */}
        <div className="hero-glow absolute left-1/2 top-[-10%] h-[800px] w-[800px] -translate-x-1/2 rounded-full opacity-60" />

        {/* Floating Hebrew Letters */}
        <FloatingHebrewLetters />
      </div>

      {/* Navigation - Enhanced prominence per Task 2.5 */}
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-base font-bold tracking-tight">Chabad Maftaiach</span>
        </Link>

        {/* Primary Navigation - Enhanced visibility */}
        <div className="hidden items-center gap-2 sm:flex">
          {/* Main nav links - larger, bolder, higher contrast */}
          <div className="flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1">
            <Link
              href="/topics"
              className="rounded-full px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Topics
            </Link>
            <Link
              href="/seforim"
              className="rounded-full px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Sources
            </Link>
            <Link
              href="/explore"
              className="rounded-full px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Explore
            </Link>
          </div>

          {/* Utility links - separated from primary nav */}
          <div className="ml-4 flex items-center gap-2">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <div className="h-4 w-px bg-border" />
            <ThemeToggleCompact />
          </div>
        </div>
      </nav>

      {/* Mobile Homepage - App-like Dashboard (Task 2.11) */}
      <div className="lg:hidden">
        <MobileHome />
      </div>

      {/* Desktop Homepage - Google-like Hero (Original) */}
      <main className="hidden lg:flex relative z-10 mx-auto max-w-6xl flex-col items-center px-6 pt-16 sm:px-8 sm:pt-20 lg:pt-24">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-md"
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
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1]"
          >
            Master Index of
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="mt-2"
          >
            <WordRotate
              words={["Chassidic Wisdom", "Divine Truth", "Inner Light", "Torah Knowledge"]}
              className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]"
            />
          </motion.div>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mt-4 max-w-2xl text-center text-base text-muted-foreground sm:text-lg leading-relaxed"
        >
          Explore concepts, discover sources. A comprehensive index connecting Chassidic topics to their sources across all Chabad literature.
        </motion.p>

        {/* Command Palette Trigger Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          className="mt-8 w-full max-w-2xl"
        >
          <div className="relative group">
            {/* Glow effect behind search */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 via-blue-400/30 to-primary/30 opacity-40 blur-2xl transition duration-500 group-hover:opacity-60" />
            <CommandMenuTrigger />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted-foreground sm:gap-8">
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
        <div className="mt-16 w-full">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Discover Content
          </h2>
          <ContentDiscovery />
        </div>

        {/* Featured Topics - Real Content (Task 2.13) */}
        <div className="mt-16 w-full">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Explore Topics
          </h2>
          <FeaturedTopics />
        </div>

        {/* Spacer */}
        <div className="pb-32" />

      </main>
    </div>
  );
}
