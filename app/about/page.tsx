'use client';

import { motion } from 'framer-motion';
import { BookOpen, Search, Users, Heart, Sparkles } from 'lucide-react';
import { GlobalNav } from '@/components/layout/GlobalNav';

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

                {/* Header */}
                <div className="mb-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10"
                    >
                        <BookOpen className="h-8 w-8" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                    >
                        About <span className="text-primary">Chabad Maftaiach</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl"
                    >
                        Bridging the gap between profound Chassidic concepts and the sources that illuminate them.
                    </motion.p>
                </div>

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
                            <h2 className="mb-6 text-3xl font-bold">Our Mission</h2>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>
                                    The depth of Chassidic philosophy is vast, spanning thousands of volumes and centuries of scholarship. For students and researchers, finding the precise source for a specific concept can often feel like searching for a needle in a haystack.
                                </p>
                                <p>
                                    Chabad Maftaiach was created to solve this challenge. We are building a comprehensive, intelligent index that maps the interconnected world of Chassidus.
                                </p>
                                <p>
                                    Our goal is to make these timeless teachings accessible to everyone, from the beginner exploring their first Maamar to the scholar conducting deep research.
                                </p>
                            </div>
                        </div>
                        <div className="relative rounded-3xl border border-border bg-card/50 p-2 backdrop-blur-sm">
                            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/20 via-blue-400/20 to-primary/20 opacity-50 blur-xl" />
                            <div className="relative overflow-hidden rounded-2xl bg-muted/50 aspect-video flex items-center justify-center">
                                {/* Placeholder for an image or graphic */}
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
                    <div className="grid gap-6 sm:grid-cols-3">
                        {[
                            {
                                icon: Search,
                                title: "Intelligent Search",
                                description: "Find concepts even if you don't know the exact wording, thanks to our semantic understanding engine."
                            },
                            {
                                icon: Users,
                                title: "Community Driven",
                                description: "Built by researchers, for researchers. We understand the nuances of how you study."
                            },
                            {
                                icon: Heart,
                                title: "Labor of Love",
                                description: "A non-profit initiative dedicated to spreading the wellsprings of Chassidus outward."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="rounded-2xl border border-border bg-card/30 p-8 transition-colors hover:bg-card/50">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
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
                    className="rounded-3xl border border-primary/20 bg-primary/5 p-12 text-center"
                >
                    <h2 className="mb-4 text-3xl font-bold">Get Involved</h2>
                    <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
                        We are constantly expanding our database. If you would like to contribute sources, suggest features, or report issues, we'd love to hear from you.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button className="rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-transform hover:scale-105 active:scale-95">
                            Contact Us
                        </button>
                        <button className="rounded-full border border-border bg-background px-8 py-3 font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                            Submit a Source
                        </button>
                    </div>
                </motion.section>
                </main>
            </div>
        </>
    );
}
