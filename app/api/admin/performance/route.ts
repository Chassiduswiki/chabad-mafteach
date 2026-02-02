import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/security/permissions';
import { withAudit } from '@/lib/security/audit';
import { adminReadRateLimit, enforceRateLimit } from '@/lib/security/rate-limit';
import { getBaseUrl } from '@/lib/utils/base-url';
import { getCacheStats } from '@/lib/cache';
import { semanticCache } from '@/lib/cache-optimization';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { measureQueryPerformance } from '@/lib/performance/analyze-performance';

export const runtime = 'nodejs';

type PerformanceReport = {
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
};

const require = createRequire(import.meta.url);
const { getBundleStats } = require('../../../../scripts/performance-monitor.js');
const { recommendIndexCreation, analyzeSlowQueries } = require('../../../../scripts/database-optimization.js');

let cachedReport: PerformanceReport | null = null;
let lastReportAt = 0;
const CACHE_TTL_MS = 2 * 60 * 1000;

function readIndexCountFromSql(): number {
  try {
    const sqlPath = path.join(process.cwd(), 'scripts', 'database-indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    const matches = sql.match(/CREATE INDEX/gi);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

function buildAlerts(report: PerformanceReport): PerformanceReport['alerts'] {
  const alerts: PerformanceReport['alerts'] = [];

  if (report.api.averageTime > 1500) {
    alerts.push({ type: 'critical', message: 'Average API response time exceeds 1.5s.' });
  } else if (report.api.averageTime > 800) {
    alerts.push({ type: 'warning', message: 'Average API response time exceeds 800ms.' });
  }

  if (report.cache.semantic.hitRate < 0.4) {
    alerts.push({ type: 'warning', message: 'Cache hit rate is below 40%.' });
  }

  if (report.bundle.available && report.bundle.totalChunkSize > 2 * 1024 * 1024) {
    alerts.push({ type: 'warning', message: 'Total JS chunk size exceeds 2MB.' });
  }

  if (report.bundle.available && report.bundle.largeChunks.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${report.bundle.largeChunks.length} large JS chunks exceed 500KB.`,
    });
  }

  if (report.database.slowQueries.length > 0) {
    alerts.push({ type: 'warning', message: 'Slow query patterns detected in analysis.' });
  }

  return alerts;
}

async function generateReport(): Promise<PerformanceReport> {
  const baseUrl = getBaseUrl();
  let apiMetrics: PerformanceReport['api'];
  try {
    apiMetrics = await measureQueryPerformance({ baseUrl, timeoutMs: 8000 });
  } catch (error) {
    apiMetrics = {
      searchTime: 0,
      topicsTime: 0,
      docsTime: 0,
      averageTime: 0,
      recommendations: []
    };
  }

  const memoryCache = getCacheStats();
  const semanticStats = semanticCache.getCacheStatistics();

  const bundleStats = getBundleStats();
  const recommendedIndexes = await recommendIndexCreation();
  const slowQueries = await analyzeSlowQueries();
  const sqlIndexCount = readIndexCountFromSql();

  const report: PerformanceReport = {
    generatedAt: new Date().toISOString(),
    api: apiMetrics,
    cache: {
      memory: memoryCache,
      semantic: semanticStats,
    },
    bundle: {
      available: bundleStats.available,
      chunkCount: bundleStats.chunkCount,
      totalChunkSize: bundleStats.totalChunkSize,
      averageChunkSize: bundleStats.averageChunkSize,
      staticSize: bundleStats.staticSize,
      largeChunks: bundleStats.chunks || [],
      reason: bundleStats.available ? undefined : bundleStats.reason,
    },
    database: {
      recommendedIndexes: recommendedIndexes.map((rec: any) => ({
        table: rec.table,
        index: rec.index,
        columns: rec.columns,
        reason: rec.reason,
        type: rec.type,
      })),
      slowQueries,
      sqlIndexCount,
    },
    alerts: [],
  };

  report.alerts = buildAlerts(report);
  return report;
}

export const GET = requirePermission('canViewPerformanceMetrics', withAudit('read', 'admin.performance', async (req: NextRequest) => {
  const rateLimited = enforceRateLimit(req, adminReadRateLimit);
  if (rateLimited) return rateLimited;

  const now = Date.now();
  if (cachedReport && now - lastReportAt < CACHE_TTL_MS) {
    return NextResponse.json(cachedReport);
  }

  try {
    const report = await generateReport();
    cachedReport = report;
    lastReportAt = now;
    return NextResponse.json(report);
  } catch (error) {
    console.error('Performance report error:', error);
    return NextResponse.json({ error: 'Failed to generate performance report' }, { status: 500 });
  }
}));
