'use client';

import React from 'react';
import { Activity, AlertTriangle, Cpu, HardDrive, MemoryStick, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MonitoringPayload {
  metrics: {
    generatedAt: string;
    cpu: {
      cores: number;
      loadAvg1m: number;
      loadAvg5m: number;
      loadAvg15m: number;
      loadPercent: number;
    };
    memory: {
      totalBytes: number;
      usedBytes: number;
      freeBytes: number;
      usagePercent: number;
    };
    disk: {
      path: string;
      totalBytes: number | null;
      usedBytes: number | null;
      freeBytes: number | null;
      usagePercent: number | null;
    };
    app: {
      uptimeSec: number;
      nodeVersion: string;
      pid: number;
    };
    realtime: {
      activeUsers: number | null;
    };
    errors: {
      windowMinutes: number;
      total: number;
      fatal: number;
      error: number;
    };
  };
  checks: {
    directus: {
      status: 'ok' | 'failed';
      error?: string;
    };
  };
  alerts: Array<{ type: 'warning' | 'critical'; message: string }>;
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return 'N/A';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function MonitoringPanel({
  data,
  isLoading,
  className,
}: {
  data?: MonitoringPayload;
  isLoading?: boolean;
  className?: string;
}) {
  const cpuPercent = data?.metrics.cpu.loadPercent ?? 0;
  const memPercent = data?.metrics.memory.usagePercent ?? 0;
  const diskPercent = data?.metrics.disk.usagePercent ?? null;

  return (
    <div className={cn("p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm", className)}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-serif italic flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-500" />
          Live Monitoring
        </h2>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">
          {data?.metrics?.generatedAt ? `Updated ${new Date(data.metrics.generatedAt).toLocaleTimeString()}` : 'No recent data'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-muted/30 rounded-2xl shadow-sm">
          <div className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            CPU Load
          </div>
          <div className="text-2xl font-serif italic">
            {isLoading ? '...' : `${cpuPercent}%`}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {data?.metrics.cpu.cores ?? 0} cores · {data?.metrics.cpu.loadAvg1m?.toFixed(2) ?? '0.00'} 1m
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-2xl shadow-sm">
          <div className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-2">
            <MemoryStick className="w-3.5 h-3.5 text-amber-500" />
            Memory
          </div>
          <div className="text-2xl font-serif italic">
            {isLoading ? '...' : `${memPercent}%`}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {formatBytes(data?.metrics.memory.usedBytes ?? 0)} / {formatBytes(data?.metrics.memory.totalBytes ?? 0)}
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-2xl shadow-sm">
          <div className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-blue-500" />
            Disk Usage
          </div>
          <div className="text-2xl font-serif italic">
            {isLoading ? '...' : (diskPercent === null ? 'N/A' : `${diskPercent}%`)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {formatBytes(data?.metrics.disk.usedBytes ?? null)} / {formatBytes(data?.metrics.disk.totalBytes ?? null)}
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-2xl shadow-sm">
          <div className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            Active Users
          </div>
          <div className="text-2xl font-serif italic">
            {isLoading ? '...' : (data?.metrics.realtime.activeUsers ?? 0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Errors: {data?.metrics.errors.total ?? 0} / {data?.metrics.errors.windowMinutes ?? 15}m
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-border/40 bg-background/60">
          <div className="text-[11px] uppercase font-bold text-muted-foreground mb-3">Health Checks</div>
          {isLoading ? (
            <div className="h-16 rounded-xl bg-muted animate-pulse" />
          ) : (
            <div className="space-y-2 text-xs text-muted-foreground">
              <div>
                Directus: <span className={cn('font-semibold', data?.checks.directus.status === 'ok' ? 'text-emerald-600' : 'text-rose-600')}>
                  {data?.checks.directus.status ?? 'unknown'}
                </span>
              </div>
              <div>
                Uptime: <span className="text-foreground font-semibold">{formatUptime(data?.metrics.app.uptimeSec ?? 0)}</span>
              </div>
              <div>
                Node: <span className="text-foreground font-semibold">{data?.metrics.app.nodeVersion ?? 'unknown'}</span>
              </div>
            </div>
          )}
        </div>

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
            <div className="text-xs text-muted-foreground">All monitoring signals within thresholds.</div>
          )}
        </div>
      </div>
    </div>
  );
}
