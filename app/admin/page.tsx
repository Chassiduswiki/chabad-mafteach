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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ books: 0, authors: 0, topics: 0, statements: 0 });
  const [popularTopics, setPopularTopics] = useState<PopularTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [booksRes, authorsRes, topicsRes] = await Promise.all([
        fetch('/api/sources?limit=1'),
        fetch('/api/authors?limit=1'),
        fetch('/api/topics?limit=1'),
      ]);

      const [booksData, authorsData, topicsData] = await Promise.all([
        booksRes.json(),
        authorsRes.json(),
        topicsRes.json(),
      ]);

      setStats({
        books: booksData.data?.length || 0,
        authors: authorsData.data?.length || 0,
        topics: topicsData.data?.length || 0,
        statements: 0,
      });

      // Fetch actual counts with higher limits for accuracy
      const [booksFullRes, authorsFullRes, topicsFullRes] = await Promise.all([
        fetch('/api/sources?limit=1000'),
        fetch('/api/authors?limit=1000'),
        fetch('/api/topics?limit=1000'),
      ]);

      const [booksFullData, authorsFullData, topicsFullData] = await Promise.all([
        booksFullRes.json(),
        authorsFullRes.json(),
        topicsFullRes.json(),
      ]);

      setStats({
        books: booksFullData.data?.length || 0,
        authors: authorsFullData.data?.length || 0,
        topics: topicsFullData.data?.length || 0,
        statements: 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setPopularTopics(data.topics || []);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never';
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

        {/* Stats Overview */}
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Content Overview</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Books</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '...' : stats.books}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Authors</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '...' : stats.authors}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Topics</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '...' : stats.topics}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Database Status</p>
              <p className="text-sm font-medium text-green-500">Connected</p>
            </div>
          </div>
        </div>

        {/* Popular Topics Analytics */}
        <div className="mt-8 p-6 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Popular Topics</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              Based on page views
            </span>
          </div>
          
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : popularTopics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No analytics data yet</p>
              <p className="text-xs mt-1">Views will appear here as users browse topics</p>
            </div>
          ) : (
            <div className="space-y-3">
              {popularTopics.slice(0, 10).map((topic, index) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div>
                      <Link
                        href={`/topics/${topic.slug}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {topic.canonical_title}
                      </Link>
                      {topic.topic_type && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground capitalize">
                          {topic.topic_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">{topic.views}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(topic.last_viewed)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/editor" className="text-muted-foreground hover:text-foreground">
              Editor
            </Link>
            <Link href="/explore" className="text-muted-foreground hover:text-foreground">
              Explore
            </Link>
            <Link href="/seforim" className="text-muted-foreground hover:text-foreground">
              Seforim Reader
            </Link>
            <Link href="/topics" className="text-muted-foreground hover:text-foreground">
              Topics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
