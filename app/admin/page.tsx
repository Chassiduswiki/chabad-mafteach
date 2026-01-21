'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  User,
  FileText,
  Layers,
  BarChart3,
  Settings,
  Plus,
  ArrowRight,
  Loader2,
  TrendingUp,
  Eye,
  Clock
} from 'lucide-react';

interface Stats {
  books: number;
  authors: number;
  topics: number;
  statements: number;
}

interface PopularTopic {
  id: number;
  canonical_title: string;
  slug: string;
  topic_type?: string;
  views: number;
  last_viewed?: string;
}

interface ContentHealth {
  score: number;
  metrics: {
    topicsWithSources: number;
    statementsTagged: number;
  };
  issues: {
    topicsWithoutSources: number;
    untaggedStatements: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ books: 0, authors: 0, topics: 0, statements: 0 });
  const [popularTopics, setPopularTopics] = useState<PopularTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [contentHealth, setContentHealth] = useState<ContentHealth | null>(null);

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Use new aggregate dashboard endpoint for better performance
      const response = await fetch('/api/analytics/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats({
          books: data.counts.sources || 0,
          authors: data.counts.authors || 0,
          topics: data.counts.topics || 0,
          statements: data.counts.statements || 0,
        });
        setContentHealth(data.contentHealth);
        // Store additional metrics for future use
        (window as any).__dashboardMetrics = data;
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // Analytics are now fetched with dashboard endpoint
      // Check if we already have the data
      const dashboardData = (window as any).__dashboardMetrics;
      if (dashboardData?.popularTopics) {
        setPopularTopics(dashboardData.popularTopics);
      } else {
        // Fallback to separate endpoint if needed
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const data = await response.json();
          setPopularTopics(data.topics || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const sections = [
    {
      title: 'Books',
      description: 'Manage your library of seforim and sources',
      icon: BookOpen,
      href: '/admin/books',
      newHref: '/admin/books/new',
      count: stats.books,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Authors',
      description: 'Manage authors and their biographical info',
      icon: User,
      href: '/admin/authors',
      newHref: '/admin/authors/new',
      count: stats.authors,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Topics',
      description: 'Browse and manage topic entries',
      icon: FileText,
      href: '/editor/topics',
      newHref: '/editor/topics/new',
      count: stats.topics,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Topic Collections',
      description: 'Organize topics into collections',
      icon: Layers,
      href: '/admin/topic-collections',
      newHref: null,
      count: null,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const quickLinks = [
    { label: 'Add New Book', href: '/admin/books/new', icon: BookOpen },
    { label: 'Add New Author', href: '/admin/authors/new', icon: User },
    { label: 'Create Topic', href: '/editor/topics/new', icon: FileText },
    { label: 'Import Content', href: '/editor/import', icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your content library and data
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {sections.map((section) => (
            <div
              key={section.title}
              className="p-6 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${section.bgColor}`}>
                  <section.icon className={`w-6 h-6 ${section.color}`} />
                </div>
                {section.count !== null && (
                  <span className="text-2xl font-bold text-foreground">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      section.count
                    )}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-1">
                {section.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {section.description}
              </p>

              <div className="flex items-center gap-3">
                <Link
                  href={section.href}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View all
                  <ArrowRight className="w-3 h-3" />
                </Link>
                {section.newHref && (
                  <Link
                    href={section.newHref}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-3 h-3" />
                    Add new
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Content Health Score Widget */}
        {contentHealth && (
          <div className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Content Health Score
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Overall quality and completeness of your content
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  {contentHealth.score}
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {contentHealth.score >= 80 ? '🎉 Excellent' :
                    contentHealth.score >= 60 ? '👍 Good' :
                      contentHealth.score >= 40 ? '⚠️ Needs Work' : '🚨 Critical'}
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Topics with Sources</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {contentHealth.metrics.topicsWithSources}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${contentHealth.metrics.topicsWithSources}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Statements Tagged</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {contentHealth.metrics.statementsTagged}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${contentHealth.metrics.statementsTagged}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Items */}
            {(contentHealth.issues.topicsWithoutSources > 0 || contentHealth.issues.untaggedStatements > 0) && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Action Items
                </h3>
                <div className="space-y-2">
                  {contentHealth.issues.topicsWithoutSources > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-700 dark:text-yellow-300">
                        📚 Add sources to {contentHealth.issues.topicsWithoutSources} topics
                      </span>
                      <Link
                        href="/editor/topics"
                        className="text-primary hover:underline font-medium"
                      >
                        Fix →
                      </Link>
                    </div>
                  )}
                  {contentHealth.issues.untaggedStatements > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-700 dark:text-yellow-300">
                        🏷️ Tag {contentHealth.issues.untaggedStatements} statements
                      </span>
                      <Link
                        href="/editor/topics"
                        className="text-primary hover:underline font-medium"
                      >
                        Fix →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Overview */}
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Popular Topics</h2>
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : popularTopics.length > 0 ? (
            <div className="space-y-3">
              {popularTopics.map((topic, index) => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.slug}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <div>
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {topic.canonical_title}
                      </h3>
                      {topic.topic_type && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {topic.topic_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span>{topic.views}</span>
                    </div>
                    {topic.last_viewed && (
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(topic.last_viewed)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              No analytics data available yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
