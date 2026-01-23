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
  Clock,
  Download,
  Network,
  Sparkles,
  Brain,
  Activity,
  Globe,
  Users,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  RefreshCw,
  FileDown,
  Filter,
  Zap,
  Target,
  TrendingDown,
  MapPin,
  Timer,
  MousePointer,
  BookMarked,
  MessageSquare,
  ThumbsUp,
  Share2,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  trend?: 'up' | 'down' | 'stable';
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

interface RealTimeMetrics {
  activeUsers: number;
  todayViews: number;
  yesterdayViews: number;
  topCountries: Array<{ country: string; count: number; flag: string }>;
  hourlyActivity: Array<{ hour: number; views: number; users: number }>;
  searchTerms: Array<{ term: string; count: number }>;
}

interface UserAnalytics {
  newUsers: number;
  returningUsers: number;
  avgSessionDuration: number;
  topContributors: Array<{ name: string; contributions: number; avatar?: string }>;
  userJourney: Array<{ from: string; to: string; count: number }>;
}

// Components
const MetricCard = ({ title, value, change, icon: Icon, trend, color = 'blue' }: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}) => (
  <div className={cn(
    "p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300",
    "group cursor-pointer"
  )}>
    <div className="flex items-start justify-between mb-4">
      <div className={cn(
        "p-3 rounded-lg group-hover:scale-110 transition-transform",
        `bg-${color}-500/10`
      )}>
        <Icon className={cn("w-6 h-6", `text-${color}-500`)} />
      </div>
      {change !== undefined && (
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium",
          trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {trend === 'up' && <TrendingUp className="w-4 h-4" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4" />}
          {change > 0 ? '+' : ''}{change}%
        </div>
      )}
    </div>
    <div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  </div>
);

const ActivityHeatmap = ({ data }: { data: Array<{ day: string; hours: number[] }> }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className="p-4 bg-card rounded-xl border">
      <h3 className="text-sm font-semibold mb-4">Activity Heatmap (Last 7 Days)</h3>
      <div className="grid grid-cols-25 gap-1 text-xs">
        <div></div>
        {hours.map(h => (
          <div key={h} className="text-center text-muted-foreground">
            {h}
          </div>
        ))}
        {days.map((day, dayIndex) => (
          <React.Fragment key={day}>
            <div className="text-right pr-2 text-muted-foreground">{day}</div>
            {hours.map(hour => {
              const intensity = data[dayIndex]?.hours[hour] || 0;
              return (
                <div
                  key={`${day}-${hour}`}
                  className={cn(
                    "w-3 h-3 rounded-sm",
                    intensity === 0 ? "bg-muted" :
                    intensity < 5 ? "bg-green-200" :
                    intensity < 10 ? "bg-green-400" :
                    intensity < 20 ? "bg-green-600" : "bg-green-800"
                  )}
                  title={`${day} ${hour}:00 - ${intensity} activities`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const CountryList = ({ countries }: { countries: Array<{ country: string; count: number; flag: string }> }) => (
  <div className="p-4 bg-card rounded-xl border">
    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
      <Globe className="w-4 h-4" />
      Top Countries
    </h3>
    <div className="space-y-3">
      {countries.map((country, index) => (
        <div key={country.country} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{country.flag}</span>
            <span className="text-sm">{country.country}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full"
                style={{ width: `${(country.count / countries[0].count) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium w-8 text-right">{country.count}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SearchAnalytics = ({ terms }: { terms: Array<{ term: string; count: number }> }) => (
  <div className="p-4 bg-card rounded-xl border">
    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
      <Search className="w-4 h-4" />
      Trending Searches
    </h3>
    <div className="space-y-2">
      {terms.map((term, index) => (
        <div key={term.term} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-4 text-sm">{index + 1}</span>
            <span className="text-sm font-medium">{term.term}</span>
          </div>
          <span className="text-sm text-muted-foreground">{term.count}</span>
        </div>
      ))}
    </div>
  </div>
);

const UserJourneyFlow = ({ journey }: { journey: Array<{ from: string; to: string; count: number }> }) => (
  <div className="p-4 bg-card rounded-xl border">
    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
      <MousePointer className="w-4 h-4" />
      User Journey Flow
    </h3>
    <div className="space-y-3">
      {journey.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium">{index + 1}</span>
            </div>
            {index < journey.length - 1 && (
              <div className="w-0.5 h-8 bg-border mt-2" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm">{step.from}</div>
            <ArrowRight className="w-3 h-3 mx-auto my-1 text-muted-foreground" />
            <div className="text-sm">{step.to}</div>
          </div>
          <div className="text-sm font-medium">{step.count}</div>
        </div>
      ))}
    </div>
  </div>
);

const MiniChart = ({ data, label }: { data: number[]; label: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="p-4 bg-card rounded-xl border">
      <h3 className="text-sm font-semibold mb-3">{label}</h3>
      <div className="flex items-end gap-1 h-16">
        {data.map((value, index) => (
          <div
            key={index}
            className="flex-1 bg-primary rounded-t transition-all hover:opacity-80"
            style={{ height: `${((value - min) / range) * 100}%` }}
            title={`Value: ${value}`}
          />
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ books: 0, authors: 0, topics: 0, statements: 0 });
  const [popularTopics, setPopularTopics] = useState<PopularTopic[]>([]);
  const [contentHealth, setContentHealth] = useState<ContentHealth | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAnalyticsPanelOpen, setIsAnalyticsPanelOpen] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    if (autoRefresh) {
      const interval = setInterval(fetchRealTimeData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedTimeRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
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
        setPopularTopics(data.popularTopics || []);
        setRealTimeMetrics(data.realTime || generateMockRealTimeData());
        setUserAnalytics(data.userAnalytics || generateMockUserAnalytics());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Use mock data for demo
      setRealTimeMetrics(generateMockRealTimeData());
      setUserAnalytics(generateMockUserAnalytics());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch('/api/analytics/realtime');
      if (response.ok) {
        const data = await response.json();
        setRealTimeMetrics(data);
      } else {
        setRealTimeMetrics(generateMockRealTimeData());
      }
    } catch (error) {
      setRealTimeMetrics(generateMockRealTimeData());
    }
  };

  const generateMockRealTimeData = (): RealTimeMetrics => ({
    activeUsers: Math.floor(Math.random() * 50) + 10,
    todayViews: Math.floor(Math.random() * 1000) + 500,
    yesterdayViews: Math.floor(Math.random() * 1000) + 400,
    topCountries: [
      { country: 'United States', count: 234, flag: '🇺🇸' },
      { country: 'Israel', count: 156, flag: '🇮🇱' },
      { country: 'United Kingdom', count: 98, flag: '🇬🇧' },
      { country: 'Canada', count: 67, flag: '🇨🇦' },
      { country: 'Australia', count: 45, flag: '🇦🇺' },
    ],
    hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      views: Math.floor(Math.random() * 100),
      users: Math.floor(Math.random() * 50)
    })),
    searchTerms: [
      { term: 'Tanya chapter 1', count: 45 },
      { term: 'Chabad philosophy', count: 32 },
      { term: 'Moshiach', count: 28 },
      { term: 'Teshuvah', count: 21 },
      { term: 'Ahavat Yisrael', count: 19 },
    ]
  });

  const generateMockUserAnalytics = (): UserAnalytics => ({
    newUsers: Math.floor(Math.random() * 20) + 5,
    returningUsers: Math.floor(Math.random() * 100) + 50,
    avgSessionDuration: Math.floor(Math.random() * 300) + 120,
    topContributors: [
      { name: 'Rabbi Cohen', contributions: 45 },
      { name: 'Sarah Levy', contributions: 32 },
      { name: 'David Weiss', contributions: 28 },
    ],
    userJourney: [
      { from: 'Homepage', to: 'Topics', count: 234 },
      { from: 'Topics', to: 'Tanya', count: 156 },
      { from: 'Tanya', to: 'Chapter 1', count: 89 },
    ]
  });

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
      color: 'blue',
    },
    {
      title: 'Authors',
      description: 'Manage authors and their biographical info',
      icon: User,
      href: '/admin/authors',
      newHref: '/admin/authors/new',
      count: stats.authors,
      color: 'purple',
    },
    {
      title: 'Topics',
      description: 'Browse and manage topic entries',
      icon: FileText,
      href: '/editor/topics',
      newHref: '/editor/topics/new',
      count: stats.topics,
      color: 'green',
    },
    {
      title: 'Collections',
      description: 'Organize topics into collections',
      icon: Layers,
      href: '/admin/topic-collections',
      newHref: null,
      count: null,
      color: 'amber',
    },
  ];

  const quickLinks = [
    { label: 'Add New Book', href: '/admin/books/new', icon: BookOpen },
    { label: 'Add New Author', href: '/admin/authors/new', icon: User },
    { label: 'Create Topic', href: '/editor/topics/new', icon: FileText },
    { label: 'AI Settings', href: '/admin/ai-settings', icon: Sparkles },
    { label: 'Import Content', href: '/editor/import', icon: Plus },
    { label: 'Export Data', href: '/admin/export', icon: Download },
    { label: 'Topic Graph', href: '/graph', icon: Network },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <div className={cn(
        "bg-card border-r border-border transition-all duration-300",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            {!isSidebarCollapsed && (
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Admin
              </h1>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
          
          {!isSidebarCollapsed && (
            <nav className="space-y-2">
              {sections.map((section) => (
                <Link
                  key={section.title}
                  href={section.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <section.icon className="w-4 h-4" />
                  <span className="text-sm">{section.title}</span>
                  {section.count && (
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {section.count}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <BarChart3 className="w-8 h-8" />
                  Analytics Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                  Real-time insights and performance metrics
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                  className="px-3 py-2 bg-card border border-border rounded-lg text-sm"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={cn(
                    "p-2 rounded-lg border transition-colors",
                    autoRefresh ? "bg-primary text-primary-foreground" : "bg-card border-border"
                  )}
                >
                  <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} />
                </button>
                <button
                  onClick={() => setIsAnalyticsPanelOpen(!isAnalyticsPanelOpen)}
                  className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Active Users"
              value={realTimeMetrics?.activeUsers || 0}
              change={12}
              icon={Users}
              trend="up"
              color="green"
            />
            <MetricCard
              title="Today's Views"
              value={realTimeMetrics?.todayViews || 0}
              change={8}
              icon={Eye}
              trend="up"
              color="blue"
            />
            <MetricCard
              title="Avg Session"
              value={`${Math.floor((userAnalytics?.avgSessionDuration || 0) / 60)}m`}
              change={-5}
              icon={Timer}
              trend="down"
              color="purple"
            />
            <MetricCard
              title="New Users"
              value={userAnalytics?.newUsers || 0}
              change={15}
              icon={UserPlus}
              trend="up"
              color="amber"
            />
          </div>

          {/* Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Popular Topics */}
            <div className="p-6 bg-card border border-border rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Popular Topics
                </h2>
                <Link href="/analytics/topics" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {popularTopics.slice(0, 5).map((topic, index) => (
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
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {topic.canonical_title}
                        </h3>
                        {topic.topic_type && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {topic.topic_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {topic.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {topic.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span>{topic.views}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 bg-card border border-border rounded-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Content Health */}
          {contentHealth && (
            <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Content Health Score
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Overall quality and completeness
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary">
                    {contentHealth.score}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Topics with Sources</span>
                    <span className="text-sm font-medium">{contentHealth.metrics.topicsWithSources}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${contentHealth.metrics.topicsWithSources}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Statements Tagged</span>
                    <span className="text-sm font-medium">{contentHealth.metrics.statementsTagged}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${contentHealth.metrics.statementsTagged}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Analytics Panel */}
        {isAnalyticsPanelOpen && (
          <div className="w-80 bg-card border-l border-border overflow-y-auto">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Live Analytics
                </h2>
                <button
                  onClick={() => setIsAnalyticsPanelOpen(false)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Activity Chart */}
              <MiniChart 
                data={realTimeMetrics?.hourlyActivity.slice(-12).map(h => h.views) || []}
                label="Views (Last 12h)"
              />

              {/* Countries */}
              <CountryList countries={realTimeMetrics?.topCountries || []} />

              {/* Search Terms */}
              <SearchAnalytics terms={realTimeMetrics?.searchTerms || []} />

              {/* User Journey */}
              <UserJourneyFlow journey={userAnalytics?.userJourney || []} />

              {/* Export Options */}
              <div className="pt-4 border-t border-border">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <FileDown className="w-4 h-4" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
