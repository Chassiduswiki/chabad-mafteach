'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
  UserPlus,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stats {
  sources: number;
  authors: number;
  topics: number;
  statements: number;
  documents: number;
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
    "p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
    "hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 group cursor-pointer"
  )}>
    <div className="flex items-start justify-between mb-4">
      <div className={cn(
        "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
        `bg-primary/5`
      )}>
        <Icon className={cn("w-5 h-5", `text-primary/70`)} />
      </div>
      {change !== undefined && (
        <div className={cn(
          "flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase px-2 py-1 rounded-full",
          trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : trend === 'down' ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-muted-foreground'
        )}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          {change > 0 ? '+' : ''}{change}%
        </div>
      )}
    </div>
    <div>
      <div className="text-3xl font-serif italic text-foreground mb-1">{value}</div>
      <div className="text-[12px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">{title}</div>
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

interface ReviewQueueItem {
  id: number;
  status: string;
  date_updated: string;
  canonical_title?: string;
  slug?: string;
  text?: string;
}

interface ReviewQueueData {
  topics: ReviewQueueItem[];
  statements: ReviewQueueItem[];
  summary: {
    totalPending: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ sources: 0, authors: 0, topics: 0, statements: 0, documents: 0 });
  const [popularTopics, setPopularTopics] = useState<PopularTopic[]>([]);
  const [contentHealth, setContentHealth] = useState<ContentHealth | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAnalyticsPanelOpen, setIsAnalyticsPanelOpen] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchReviewQueue();
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchRealTimeData();
        fetchReviewQueue();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedTimeRange]);

  const fetchReviewQueue = async () => {
    try {
      const response = await fetch('/api/admin/review-queue');
      if (response.ok) {
        const data = await response.json();
        setReviewQueue(data);
      }
    } catch (error) {
      console.error('Failed to fetch review queue:', error);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analytics/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats({
          sources: data?.counts?.sources || 0,
          authors: data?.counts?.authors || 0,
          topics: data?.counts?.topics || 0,
          statements: data?.counts?.statements || 0,
          documents: data?.counts?.documents || 0,
        });
        setContentHealth(data?.contentHealth || null);
        setPopularTopics(data?.popularTopics || []);
        setRealTimeMetrics(data?.realTime || null);
        setUserAnalytics(data?.userAnalytics || null);
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
      title: 'Content',
      items: [
        {
          title: 'Sources',
          description: 'Manage citations & references',
          icon: BookMarked,
          href: '/admin/sources',
          count: stats.sources,
        },
        {
          title: 'Documents',
          description: 'Manage seforim & texts',
          icon: BookOpen,
          href: '/admin/books',
          count: stats.documents,
        },
        {
          title: 'Authors',
          description: 'Manage biographical info',
          icon: User,
          href: '/admin/authors',
          count: stats.authors,
        },
        {
          title: 'Topics',
          description: 'Manage topic entries',
          icon: FileText,
          href: '/editor/topics',
          count: stats.topics,
        },
        {
          title: 'Collections',
          description: 'Organize into collections',
          icon: Layers,
          href: '/admin/topic-collections',
        },
      ]
    },
    {
      title: 'Configuration',
      items: [
        {
          title: 'AI Settings',
          description: 'Configure intelligence models',
          icon: Sparkles,
          href: '/admin/ai-settings',
        },
        {
          title: 'Import',
          description: 'Bulk data ingestion',
          icon: Plus,
          href: '/editor/import',
        },
        {
          title: 'System Settings',
          description: 'Platform configuration',
          icon: Settings,
          href: '/admin/settings',
        },
      ]
    }
  ];

  const quickLinks = [
    { label: 'Add Book', href: '/admin/books/new', icon: BookOpen },
    { label: 'Add Author', href: '/admin/authors/new', icon: User },
    { label: 'Create Topic', href: '/editor/topics/new', icon: FileText },
    { label: 'Import', href: '/editor/import', icon: Plus },
    { label: 'Export', href: '/admin/export', icon: Download },
    { label: 'Graph', href: '/graph', icon: Network },
  ];

  return (
    <div className="min-h-screen bg-background flex relative selection:bg-primary/10">
      {/* Subtle Texture/Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      {/* Left Sidebar */}
      <div className={cn(
        "bg-card/50 backdrop-blur-xl border-r border-border/50 transition-all duration-300 relative z-20",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-10 px-2">
            {!isSidebarCollapsed && (
              <h1 className="text-xl font-serif italic tracking-tight flex items-center gap-2">
                Admin
              </h1>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 hover:bg-muted/50 rounded-full transition-colors"
            >
              <Menu className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                {!isSidebarCollapsed && (
                  <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold mb-4 px-3">
                    {section.title}
                  </h2>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                        "hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      <item.icon className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                      {!isSidebarCollapsed && (
                        <>
                          <span className="text-[14px] font-medium">{item.title}</span>
                          {item.count !== undefined && item.count !== null && (
                            <span className="ml-auto text-[10px] font-bold text-muted-foreground/40 bg-muted/50 px-2 py-0.5 rounded-full">
                              {item.count}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative z-10">
        <div className="flex-1 p-10 overflow-y-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-4xl font-serif italic tracking-tight text-foreground flex items-center gap-4">
                  Analytics Dashboard
                </h1>
                <p className="text-muted-foreground font-light text-lg mt-2">
                  Real-time insights and performance metrics.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-muted/30 p-1 rounded-full border border-border/50">
                  {(['24h', '7d', '30d'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setSelectedTimeRange(range)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                        selectedTimeRange === range 
                          ? "bg-foreground text-background shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {range.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={cn(
                    "p-2.5 rounded-full border border-border/50 transition-all",
                    autoRefresh ? "bg-primary/10 text-primary border-primary/20" : "bg-card hover:bg-muted/50"
                  )}
                >
                  <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} />
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <MetricCard
              title="Active Users"
              value={realTimeMetrics?.activeUsers || 0}
              change={12}
              icon={Users}
              trend="up"
            />
            <MetricCard
              title="Today's Views"
              value={realTimeMetrics?.todayViews || 0}
              change={8}
              icon={Eye}
              trend="up"
            />
            <MetricCard
              title="Avg Session"
              value={`${Math.floor((userAnalytics?.avgSessionDuration || 0) / 60)}m`}
              change={-5}
              icon={Timer}
              trend="down"
            />
            <MetricCard
              title="New Users"
              value={userAnalytics?.newUsers || 0}
              change={15}
              icon={UserPlus}
              trend="up"
            />
          </div>

          {/* Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            {/* Editorial Review Queue */}
            <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-serif italic flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Review Queue
                </h2>
                {reviewQueue?.summary.totalPending && (
                  <span className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {reviewQueue.summary.totalPending} Pending
                  </span>
                )}
              </div>
              
              <div className="space-y-6">
                {/* Pending Topics */}
                {reviewQueue?.topics && reviewQueue.topics.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-bold px-2">Topics</h3>
                    {reviewQueue.topics.map(item => (
                      <Link 
                        key={`review-topic-${item.id}`} 
                        href={`/editor/topics/${item.slug}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-all group"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">{item.canonical_title}</span>
                          <span className="text-[10px] text-muted-foreground">{formatTimeAgo(item.date_updated)}</span>
                        </div>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
                          item.status === 'draft' ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"
                        )}>
                          {item.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Pending Statements */}
                {reviewQueue?.statements && reviewQueue.statements.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-bold px-2">Statements</h3>
                    {reviewQueue.statements.map(item => (
                      <div 
                        key={`review-stmt-${item.id}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-all group"
                      >
                        <div className="flex flex-col max-w-[70%]">
                          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.text}</span>
                          <span className="text-[10px] text-muted-foreground">{formatTimeAgo(item.date_updated)}</span>
                        </div>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
                          item.status === 'draft' ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"
                        )}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {(!reviewQueue || (reviewQueue.topics.length === 0 && reviewQueue.statements.length === 0)) && (
                  <div className="text-center py-10">
                    <Check className="w-8 h-8 text-emerald-500/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Queue is empty. Everything reviewed!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Popular Topics */}
            <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-serif italic flex items-center gap-3">
                  Popular Topics
                </h2>
                <Link href="/analytics/topics" className="text-xs font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
                  View all
                </Link>
              </div>
              <div className="space-y-1">
                {popularTopics.slice(0, 5).map((topic, index) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.slug}`}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-muted-foreground/30 w-4">
                        0{index + 1}
                      </span>
                      <div>
                        <h3 className="text-[15px] font-medium group-hover:text-primary transition-colors">
                          {topic.canonical_title}
                        </h3>
                        {topic.topic_type && (
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-bold">
                            {topic.topic_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{topic.views}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
              <h2 className="text-xl font-serif italic mb-8 flex items-center gap-3">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-border/60 hover:bg-muted/50 transition-all text-[14px] font-medium group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Content Health */}
          {contentHealth && (
            <div className="p-10 rounded-3xl border border-primary/10 bg-primary/[0.02] relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
                <div>
                  <h2 className="text-2xl font-serif italic flex items-center gap-3">
                    Content Health Score
                  </h2>
                  <p className="text-muted-foreground font-light mt-1">
                    An assessment of platform quality and completeness.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-serif italic text-primary drop-shadow-sm">
                    {contentHealth.score}
                    <span className="text-xl font-sans text-muted-foreground/40 not-italic ml-1">/100</span>
                  </div>
                </div>
              </div>
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Topics with Sources</span>
                    <span className="text-sm font-serif italic text-foreground">{contentHealth.metrics.topicsWithSources}%</span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-1000"
                      style={{ width: `${contentHealth.metrics.topicsWithSources}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Statements Tagged</span>
                    <span className="text-sm font-serif italic text-foreground">{contentHealth.metrics.statementsTagged}%</span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-1000"
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
          <div className="w-96 bg-card/50 backdrop-blur-xl border-l border-border/50 overflow-y-auto relative z-20">
            <div className="p-6 border-b border-border/50 sticky top-0 bg-card/80 backdrop-blur-xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="font-serif italic text-lg flex items-center gap-2">
                  Live Stream
                </h2>
                <button
                  onClick={() => setIsAnalyticsPanelOpen(false)}
                  className="p-2 hover:bg-muted/50 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-10">
              {/* Activity Chart */}
              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">Volume (Last 12h)</h3>
                <MiniChart 
                  data={realTimeMetrics?.hourlyActivity.slice(-12).map(h => h.views) || []}
                  label=""
                />
              </div>

              {/* Countries */}
              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">Demographics</h3>
                <CountryList countries={realTimeMetrics?.topCountries || []} />
              </div>

              {/* Search Terms */}
              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">Queries</h3>
                <SearchAnalytics terms={realTimeMetrics?.searchTerms || []} />
              </div>

              {/* User Journey */}
              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">Navigation Flow</h3>
                <UserJourneyFlow journey={userAnalytics?.userJourney || []} />
              </div>

              {/* Export Options */}
              <div className="pt-10 border-t border-border/50">
                <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-foreground text-background rounded-2xl font-medium hover:opacity-90 transition-all shadow-lg shadow-foreground/5">
                  <FileDown className="w-4 h-4" />
                  Generate Archive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
