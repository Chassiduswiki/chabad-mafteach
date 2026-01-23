"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Upload, User, Settings, Edit3, Search, Layers, Sparkles, Brain, ArrowRight, LogOut } from 'lucide-react';
import Link from "next/link";
import { cn } from "@/lib/utils";

// --- Type Definitions ---
interface DashboardHeaderProps {
  user: any;
  onLogout: () => void;
}

interface DashboardCardProps {
  href: string;
  icon: React.ComponentType<any>;
  title: string;
  children: React.ReactNode;
  className?: string;
  iconClassName: string;
}

interface SectionHeaderProps {
  icon: React.ComponentType<any>;
  title: string;
}

// --- Refactored Components ---

const DashboardHeader = ({ user, onLogout }: DashboardHeaderProps) => (
  <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Content Editor</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
        >
          <LogOut className="h-3.5 w-3.5"/>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  </header>
);

const HeroAction = () => (
  <div className="relative rounded-2xl border bg-card p-6 md:p-8 overflow-hidden">
    <div className="absolute -inset-x-20 top-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent h-20 opacity-50 blur-3xl" />
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg ring-1 ring-primary/30">
            <Edit3 className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Write & Learn</h2>
        </div>
        <p className="text-muted-foreground max-w-lg">
          Create articles, explanations, and personal insights with AI assistance. Access the rich editor, Hebrew OCR, smart citations, and AI processing tools.
        </p>
      </div>
      <Link
        href="/editor/write"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span>Start Writing</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </div>
);

const DashboardCard = ({ href, icon: Icon, title, children, className, iconClassName }: DashboardCardProps) => (
  <Link
    href={href}
    className={cn(
      "group relative rounded-xl border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:-translate-y-1",
      className
    )}
  >
    <div className="flex items-center gap-4 mb-2">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg transition-colors group-hover:bg-primary/20", iconClassName)}>
        <Icon className="h-5 w-5 transition-colors group-hover:text-primary" />
      </div>
      <h3 className="font-semibold text-foreground text-base transition-colors group-hover:text-primary">{title}</h3>
    </div>
    <p className="text-sm text-muted-foreground pl-13">
      {children}
    </p>
  </Link>
);

const SectionHeader = ({ icon: Icon, title }: SectionHeaderProps) => (
  <div className="flex items-center gap-3 mb-5">
    <Icon className="w-5 h-5 text-primary/80" />
    <h2 className="text-xl font-semibold text-foreground tracking-tight">{title}</h2>
  </div>
);

// --- Main Page Component ---

export default function EditorPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }
    try {
      setUser({ role: 'editor', name: 'Editor User' });
    } catch (error) {
      localStorage.removeItem('auth_token');
      router.push('/auth/signin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-12">
          
          {/* Main Actions */}
          <section className="space-y-6">
            <HeroAction />
            <div className="grid gap-6 md:grid-cols-2">
              <DashboardCard href="/editor/topics" icon={Search} title="Research Topics" iconClassName="bg-green-500/10 text-green-600" className="">
                Explore and improve topic definitions, boundaries, and explanations.
              </DashboardCard>
              <DashboardCard href="/editor/import" icon={Upload} title="Import Content" iconClassName="bg-orange-500/10 text-orange-600" className="">
                Add seforim from Sefaria, upload PDFs, or import text files.
              </DashboardCard>
            </div>
          </section>

          {/* AI Tools */}
          <section>
            <SectionHeader icon={Sparkles} title="AI-Powered Tools" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <DashboardCard href="/admin/ai-settings" icon={Settings} title="AI Settings" iconClassName="bg-blue-500/10 text-blue-600" className="">
                Configure OpenRouter API and translation models.
              </DashboardCard>
              <DashboardCard href="#" icon={Brain} title="AI Translation" iconClassName="bg-purple-500/10 text-purple-600" className="">
                Available in topic editors and writing tools.
              </DashboardCard>
              <DashboardCard href="#" icon={Sparkles} title="Content Enhancement" iconClassName="bg-teal-500/10 text-teal-600" className="">
                AI-powered writing assistance and improvements.
              </DashboardCard>
            </div>
          </section>

          {/* Library Management */}
          <section>
            <SectionHeader icon={BookOpen} title="Library Management" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <DashboardCard href="/admin/books" icon={BookOpen} title="Books" iconClassName="bg-sky-500/10 text-sky-600" className="">
                Manage seforim and sources in your library.
              </DashboardCard>
              <DashboardCard href="/admin/authors" icon={User} title="Authors" iconClassName="bg-indigo-500/10 text-indigo-600" className="">
                Manage authors and biographical info.
              </DashboardCard>
              <DashboardCard href="/admin/topic-collections" icon={Layers} title="Collections" iconClassName="bg-amber-500/10 text-amber-600" className="">
                Organize topics into collections.
              </DashboardCard>
              <DashboardCard href="/admin" icon={Settings} title="Admin" iconClassName="bg-slate-500/10 text-slate-600" className="">
                Full admin dashboard & stats.
              </DashboardCard>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
