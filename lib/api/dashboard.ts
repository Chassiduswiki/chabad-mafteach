import { getBaseUrl } from '@/lib/utils/base-url';

// Dashboard API types and fetching functions

export interface DashboardStats {
  sources: number;
  authors: number;
  topics: number;
  statements: number;
  documents: number;
}

export interface PopularTopic {
  id: number;
  canonical_title: string;
  slug: string;
  topic_type?: string;
  views: number;
  last_viewed?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface ContentHealth {
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

export interface RealTimeMetrics {
  activeUsers: number;
  todayViews: number;
  yesterdayViews: number;
  topCountries: Array<{ country: string; count: number; flag: string }>;
  hourlyActivity: Array<{ hour: number; views: number; users: number }>;
  searchTerms: Array<{ term: string; count: number }>;
}

export interface UserAnalytics {
  newUsers: number;
  returningUsers: number;
  avgSessionDuration: number;
  topContributors: Array<{ name: string; contributions: number; avatar?: string }>;
  userJourney: Array<{ from: string; to: string; count: number }>;
}

export interface ReviewQueueItem {
  id: number;
  status: string;
  date_updated: string;
  canonical_title?: string;
  slug?: string;
  text?: string;
}

export interface ReviewQueueData {
  topics: ReviewQueueItem[];
  statements: ReviewQueueItem[];
  summary: {
    totalPending: number;
  };
}

export interface ActivityItem {
  id: number;
  action: string;
  collection: string;
  timestamp: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

export interface PerformanceMetrics {
  generatedAt: string;
  api: {
    searchTime: number;
    topicsTime: number;
    docsTime: number;
    averageTime: number;
    recommendations: string[];
  };
  cache: {
    memory: { entries: number; size: string };
    semantic: {
      hits: number;
      misses: number;
      evictions: number;
      currentSize: number;
      hitRate: number;
      memoryUsage: string;
    };
  };
  bundle: {
    available: boolean;
    chunkCount: number;
    totalChunkSize: number;
    averageChunkSize: number;
    staticSize: number;
    largeChunks: Array<{ file: string; size: number }>;
    reason?: string;
  };
  database: {
    recommendedIndexes: Array<{ table: string; index: string; columns: string[]; reason: string; type?: string }>;
    slowQueries: Array<{ query: string; avgTime: string; callCount: number; recommendation: string }>;
    sqlIndexCount: number;
  };
  alerts: Array<{ type: 'warning' | 'critical'; message: string }>;
}


// Fetching functions
export async function fetchDashboardData() {
  const res = await fetch(`${getBaseUrl()}/api/analytics/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export async function fetchRealTimeData() {
  const res = await fetch(`${getBaseUrl()}/api/analytics/realtime`);
  if (!res.ok) throw new Error('Failed to fetch realtime data');
  return res.json();
}

export async function fetchUserAnalytics() {
  const res = await fetch(`${getBaseUrl()}/api/analytics/user-analytics`);
  if (!res.ok) throw new Error('Failed to fetch user analytics');
  return res.json();
}

export async function fetchReviewQueue() {
  const res = await fetch(`${getBaseUrl()}/api/admin/review-queue`);
  if (!res.ok) throw new Error('Failed to fetch review queue');
  return res.json();
}

export async function fetchActivityLog() {
  const res = await fetch(`${getBaseUrl()}/api/admin/audit-log`);
  if (!res.ok) throw new Error('Failed to fetch activity log');
  return res.json();
}

export async function fetchMaintenanceStatus() {
  const res = await fetch(`${getBaseUrl()}/api/admin/maintenance`);
  if (!res.ok) throw new Error('Failed to fetch maintenance status');
  return res.json();
}

export async function fetchContentStats() {
  const res = await fetch(`${getBaseUrl()}/api/admin/content/stats`);
  if (!res.ok) throw new Error('Failed to fetch content stats');
  return res.json();
}

export async function fetchPerformanceMetrics(): Promise<PerformanceMetrics> {
  const res = await fetch(`${getBaseUrl()}/api/admin/performance`);
  if (!res.ok) throw new Error('Failed to fetch performance metrics');
  return res.json();
}
