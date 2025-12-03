'use client';

import { motion } from 'framer-motion';
import { CommandMenuTrigger } from '@/components/CommandMenuTrigger';
import Link from 'next/link';
import { Sparkles, ArrowRight, BookOpen, Search, Zap, Globe, Share2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">

      {/* Background Gradients - Premium Blue Theme */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Top Center Glow */}
        <div className="hero-glow absolute left-1/2 top-[-10%] h-[800px] w-[800px] -translate-x-1/2 rounded-full opacity-60" />

        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-base font-bold tracking-tight">Chabad Maftaiach</span>
        </div>
        <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground sm:flex">
          <Link href="/topics" className="hover:text-primary transition-colors cursor-pointer">Topics</Link>
          <Link href="/seforim" className="hover:text-primary transition-colors cursor-pointer">Sources</Link>
          <Link href="/about" className="hover:text-primary transition-colors cursor-pointer">About</Link>
          <div className="h-4 w-px bg-border" />
          <button onClick={() => alert('Sign in flow coming soon!')} className="text-foreground hover:text-primary transition-colors cursor-pointer">Sign in</button>
        </div>
      </nav>

      {/* Main Hero Content */}
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-center px-6 pt-24 sm:px-8 sm:pt-32 lg:pt-40">

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
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="max-w-4xl text-center text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-[5.5rem] leading-[1.1]"
        >
          Master Index of
          <span className="block bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Chassidic Wisdom
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mt-6 max-w-2xl text-center text-lg text-muted-foreground sm:text-xl leading-relaxed"
        >
          Explore concepts, discover sources. A comprehensive index connecting Chassidic topics to their sources across all Chabad literature.
        </motion.p>

        {/* Command Palette Trigger Area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mt-12 w-full max-w-2xl"
        >
          <div className="relative group">
            {/* Glow effect behind search */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 via-blue-400/30 to-primary/30 opacity-40 blur-2xl transition duration-500 group-hover:opacity-60" />
            <CommandMenuTrigger />
          </div>

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

        {/* Feature Grid - Modern Bento Style */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-32 grid w-full grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6"
        >
          {[
            {
              icon: Search,
              title: 'Bi-Lingual Search',
              desc: 'Seamlessly search across Hebrew and English concepts with fuzzy matching.',
              color: 'text-blue-500',
              bg: 'bg-blue-500/10'
            },
            {
              icon: BookOpen,
              title: 'Deep Knowledge Graph',
              desc: 'Visualize connections between thousands of concepts and sources.',
              color: 'text-indigo-500',
              bg: 'bg-indigo-500/10'
            },
            {
              icon: Zap,
              title: 'Lightning Fast',
              desc: 'Instant results powered by edge caching and optimized indexing.',
              color: 'text-amber-500',
              bg: 'bg-amber-500/10'
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-border bg-background/40 p-8 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:bg-background/60 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>

              <div className="absolute bottom-6 right-6 opacity-0 transition-opacity transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
            </div>
          ))}
        </motion.div>

      </main>
    </div>
  );
}
