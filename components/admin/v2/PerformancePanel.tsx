'use client';

import React from 'react';
import { Activity, AlertTriangle, Gauge, Layers, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type PerformanceMetrics = {
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

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function PerformancePanel({
  data,
  isLoading,
}: {
  data?: PerformanceMetrics;
  isLoading?: boolean;
}) {
  const avg = data?.api?.averageTime ?? 0;
  const hitRate = data?.cache?.semantic?.hitRate ?? 0;

  return (
    <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-serif italic flex items-center gap-3">
          <Gauge className="w-5 h-5 text-emerald-500" />
          Performance Console
        </h2>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">
          {data?.generatedAt ? `Updated ${new Date(data.generatedAt).toLocaleTimeString()}` : 'No recent data'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-muted/30 rounded-2xl border border-transparent shadow-sm">
          <div className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            API Avg
          </div>
          <div className="text-2xl font-serif italic">
            {isLoading ? '...' : `${avg.toFixed(0)}ms`}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Search {data?.api?.searchTime ?? 0}ms · Topics {data?.api?.topicsTime ?? 0}ms
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-2xl border border-transparent shadow-sm">
          <div className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Cache Hit Rate
          </div>
          <div className="text-2xl font-serif italic">
            {isLoading ? '...' : `${Math.round(hitRate * 100)}%`}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {data?.cache?.memory?.entries ?? 0} entries · {data?.cache?.memory?.size ?? '0 KB'}
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-2xl border border-transparent shadow-sm">
          <div className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            Bundle Size
          </div>
          <div className="text-2xl font-serif italic">
            {isLoading ? '...' : formatBytes(data?.bundle?.totalChunkSize ?? 0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {data?.bundle?.chunkCount ?? 0} chunks · {formatBytes(data?.bundle?.staticSize ?? 0)} static
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-border/40 bg-background/60">
          <div className="text-[11px] uppercase font-bold text-muted-foreground mb-3">Alerts</div>
          {isLoading ? (
            <div className="h-16 rounded-xl bg-muted animate-pulse" />
          ) : data?.alerts?.length ? (
            <div className="space-y-2">
              {data.alerts.map((alert, index) => (
                <div
                  key={`${alert.message}-${index}`}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium',
                    alert.type === 'critical'
                      ? 'bg-rose-500/10 text-rose-600'
                      : 'bg-amber-500/10 text-amber-600'
                  )}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {alert.message}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">All systems within target ranges.</div>
          )}
        </div>

        <div className="p-5 rounded-2xl border border-border/40 bg-background/60">
          <div className="text-[11px] uppercase font-bold text-muted-foreground mb-3">Database Indexing</div>
          {isLoading ? (
            <div className="h-16 rounded-xl bg-muted animate-pulse" />
          ) : (
            <div className="space-y-2 text-xs text-muted-foreground">
              <div>
                Recommended indexes: <span className="text-foreground font-semibold">{data?.database?.recommendedIndexes?.length ?? 0}</span>
              </div>
              <div>
                SQL index set: <span className="text-foreground font-semibold">{data?.database?.sqlIndexCount ?? 0}</span>
              </div>
              <div>
                Slow query patterns: <span className="text-foreground font-semibold">{data?.database?.slowQueries?.length ?? 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
