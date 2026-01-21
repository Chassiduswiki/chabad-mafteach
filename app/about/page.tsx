'use client';

import { motion } from 'framer-motion';
import { BookOpen, Search, Users, Heart, Sparkles, Shield, Layers, Zap, Globe } from 'lucide-react';
import { GlobalNav } from '@/components/layout/GlobalNav';
import { copy } from '@/lib/copy';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations';

export default function AboutPage() {
    return (
        <>
            <GlobalNav />
            <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
                {/* Background Gradients */}
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                    <div className="hero-glow absolute left-1/2 top-[-10%] h-[800px] w-[800px] -translate-x-1/2 rounded-full opacity-40" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03]" />
                </div>

                <main id="main-content" className="relative z-10 mx-auto max-w-5xl px-6 py-8 sm:px-8">

                {/* Manifesto Header */}
                <motion.div 
                    className="mb-20 text-center"
                    initial="hidden"
                    animate="show"
                    variants={staggerContainer}
                >
                    <motion.div
                        variants={staggerItem}
                        className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10"
                    >
                        <BookOpen className="h-8 w-8" />
                    </motion.div>
                    <motion.h1
                        variants={staggerItem}
                        className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                    >
                        Your Torah<br /><span className="text-primary">Thinking Space</span>
                    </motion.h1>
                    <motion.p
                        variants={staggerItem}
                        className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed"
                    >
                        We believe the depth of Chassidic wisdom should be <em>accessible</em>, <em>explorable</em>, and <em>yours</em> to discover.
                    </motion.p>
                </motion.div>

                {/* Manifesto Principles */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-24"
                >
                    <h2 className="text-center text-2xl font-bold mb-12">What We Believe</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        {[
                            {
                                icon: Shield,
                                title: "Yours",
                                description: "Your learning journey is personal. Save, annotate, and organize concepts your way.",
                                color: "text-blue-600 dark:text-blue-400",
                                bgColor: "bg-blue-500/10",
                            },
                            {
                                icon: Layers,
                                title: "Connected",
                                description: "Ideas don't exist in isolation. See how every concept relates to the broader tapestry of Torah.",
                                color: "text-purple-600 dark:text-purple-400",
                                bgColor: "bg-purple-500/10",
                            },
                            {
                                icon: Zap,
                                title: "Accessible",
                                description: "From beginner to scholar—depth reveals itself as you're ready for it.",
                                color: "text-amber-600 dark:text-amber-400",
                                bgColor: "bg-amber-500/10",
                            },
                            {
                                icon: Globe,
                                title: "Durable",
                                description: "Built on open standards. Your insights and annotations belong to you, always.",
                                color: "text-emerald-600 dark:text-emerald-400",
                                bgColor: "bg-emerald-500/10",
                            },
                        ].map((principle, i) => (
                            <div 
                                key={i} 
                                className="rounded-2xl border border-border bg-card/30 p-8 transition-all hover:bg-card/50 hover-lift"
                            >
                                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${principle.bgColor} ${principle.color}`}>
                                    <principle.icon className="h-6 w-6" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold">{principle.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{principle.description}</p>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Mission Section */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-24"
                >
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                        <div>
                            <h2 className="mb-6 text-3xl font-bold">The Challenge We're Solving</h2>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>
                                    Chassidic philosophy spans thousands of volumes and centuries of scholarship. Finding the precise source for a specific concept often feels like searching for a needle in a haystack.
                                </p>
                                <p>
                                    We're building an <strong className="text-foreground">intelligent index</strong> that maps the interconnected world of Chassidus—making timeless teachings accessible to everyone.
                                </p>
                                <p>
                                    Whether you're exploring your first Maamar or conducting deep research, this is your space to think, connect, and grow.
                                </p>
                            </div>
                        </div>
                        <div className="relative rounded-3xl border border-border bg-card/50 p-2 backdrop-blur-sm">
                            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/20 via-purple-400/20 to-primary/20 opacity-50 blur-xl" />
                            <div className="relative overflow-hidden rounded-2xl bg-muted/50 aspect-video flex items-center justify-center">
                                <Sparkles className="h-16 w-16 text-primary/20" />
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Features Grid */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-24"
                >
                    <h2 className="text-center text-2xl font-bold mb-12">How It Works</h2>
                    <div className="grid gap-6 sm:grid-cols-3">
                        {[
                            {
                                icon: Search,
                                title: "Discover",
                                description: "Search by concept, not just keywords. Our semantic engine understands what you're looking for."
                            },
                            {
                                icon: Layers,
                                title: "Connect",
                                description: "See how ideas relate. Every concept links to its sources, related topics, and deeper layers."
                            },
                            {
                                icon: Heart,
                                title: "Grow",
                                description: "Start simple, go deep. Content reveals complexity as you're ready for it."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="rounded-2xl border border-border bg-card/30 p-8 transition-all hover:bg-card/50 hover-lift">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Contact / CTA */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 p-12 text-center"
                >
                    <h2 className="mb-4 text-3xl font-bold">Join the Journey</h2>
                    <p className="mx-auto mb-8 max-w-2xl text-muted-foreground leading-relaxed">
                        We're constantly expanding. Contribute sources, suggest features, or just say hello—we'd love to hear from you.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button className="rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-all hover:scale-105 active:scale-95 hover-lift">
                            Get in Touch
                        </button>
                        <button className="rounded-full border border-border bg-background px-8 py-3 font-medium transition-all hover:bg-accent hover:text-accent-foreground hover-lift">
                            Submit a Source
                        </button>
                    </div>
                </motion.section>
                </main>
            </div>
        </>
    );
}
