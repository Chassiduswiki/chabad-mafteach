"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Upload, User, Settings, Edit3, Search, Layers, Sparkles, Brain, ArrowRight, LogOut, Network, Link2, Compass } from 'lucide-react';
import Link from "next/link";
import { cn } from "@/lib/utils";
import { OnboardingModal, useOnboarding } from "@/components/onboarding/OnboardingModal";

// --- Type Definitions ---
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

interface DashboardHeaderProps {
  user: UserProfile;
  onLogout: () => void;
}

interface DashboardCardProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  className?: string;
  iconClassName: string;
}

interface SectionHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}

// --- Refactored Components ---

const DashboardHeader = ({ user, onLogout }: DashboardHeaderProps) => {
  const displayName = user.firstName || user.email?.split('@')[0] || 'Editor';

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Content Editor</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {displayName}</p>
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
};

const HeroAction = () => (
  <div className="relative rounded-2xl border bg-card p-6 md:p-8 overflow-hidden">
    <div className="absolute -inset-x-20 top-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent h-20 opacity-50 blur-3xl" />
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg ring-1 ring-primary/30">
            <Search className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Research Topics</h2>
        </div>
        <p className="text-muted-foreground max-w-lg">
          Explore and refine Chabad concepts, improve topic boundaries, and enhance explanations with AI assistance. Build the comprehensive knowledge base.
        </p>
      </div>
      <Link
        href="/editor/topics"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span>Explore Topics</span>
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showOnboarding, closeOnboarding, completeOnboarding } = useOnboarding();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/auth/profile');
        if (!response.ok) {
          router.push('/auth/signin');
          return;
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        router.push('/auth/signin');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    router.push('/');
  };

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Editor';

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Welcome Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Welcome back, {displayName}!
              </h2>
              <p className="text-muted-foreground">
                Continue your research and contribute to the Chabad Mafteach knowledge base.
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Your Role</div>
                <div className="font-medium text-foreground capitalize">{user?.role}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          
          {/* Main Actions */}
          <section className="space-y-6">
            <HeroAction />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <DashboardCard href="/editor/topics/new" icon={Edit3} title="Create Topic" iconClassName="bg-blue-500/10 text-blue-600" className="">
                Add new Chabad concepts and build the knowledge base.
              </DashboardCard>
              <DashboardCard href="/editor/import" icon={Upload} title="Import Content" iconClassName="bg-orange-500/10 text-orange-600" className="">
                Add seforim from Sefaria, upload PDFs, or import text files.
              </DashboardCard>
              <DashboardCard href="/chain-builder" icon={Link2} title="Idea Chains" iconClassName="bg-emerald-500/10 text-emerald-600" className="">
                Trace intellectual genealogy through Chassidic literature.
              </DashboardCard>
            </div>
          </section>

          {/* Exploration Tools */}
          <section>
            <SectionHeader icon={Compass} title="Exploration Tools" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <DashboardCard href="/explore" icon={Search} title="Explore" iconClassName="bg-violet-500/10 text-violet-600" className="">
                Browse topics and discover connections across the knowledge base.
              </DashboardCard>
              <DashboardCard href="/explore/graph" icon={Network} title="Graph View" iconClassName="bg-pink-500/10 text-pink-600" className="">
                Visualize relationships between topics and sources.
              </DashboardCard>
              <DashboardCard href="/collections" icon={Layers} title="Collections" iconClassName="bg-amber-500/10 text-amber-600" className="">
                Browse curated topic collections.
              </DashboardCard>
            </div>
          </section>

          {/* AI Tools */}
          <section>
            <SectionHeader icon={Sparkles} title="AI-Powered Tools" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <DashboardCard href="#" icon={Brain} title="AI Translation" iconClassName="bg-purple-500/10 text-purple-600" className="">
                Available in topic editors and writing tools.
              </DashboardCard>
              <DashboardCard href="#" icon={Sparkles} title="Content Enhancement" iconClassName="bg-teal-500/10 text-teal-600" className="">
                AI-powered writing assistance and improvements.
              </DashboardCard>
              {isAdmin && (
                <DashboardCard href="/admin/ai-settings" icon={Settings} title="AI Settings" iconClassName="bg-blue-500/10 text-blue-600" className="">
                  Configure OpenRouter API and translation models.
                </DashboardCard>
              )}
            </div>
          </section>

          {/* Admin Section - Only shown to admins */}
          {isAdmin && (
            <section>
              <SectionHeader icon={Settings} title="Administration" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <DashboardCard href="/admin" icon={Settings} title="Dashboard" iconClassName="bg-slate-500/10 text-slate-600" className="">
                  Full admin dashboard & stats.
                </DashboardCard>
                <DashboardCard href="/admin/books" icon={BookOpen} title="Books" iconClassName="bg-sky-500/10 text-sky-600" className="">
                  Manage seforim and sources in your library.
                </DashboardCard>
                <DashboardCard href="/admin/authors" icon={User} title="Authors" iconClassName="bg-indigo-500/10 text-indigo-600" className="">
                  Manage authors and biographical info.
                </DashboardCard>
                <DashboardCard href="/admin/topic-collections" icon={Layers} title="Topic Collections" iconClassName="bg-amber-500/10 text-amber-600" className="">
                  Organize topics into collections.
                </DashboardCard>
              </div>
            </section>
          )}

        </div>
      </main>

      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />
    </div>
  );
}
