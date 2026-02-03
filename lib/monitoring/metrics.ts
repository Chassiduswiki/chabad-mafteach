import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { logger } from '@/lib/logger';
import { getRealtimeMetrics } from '@/lib/analytics/umami';

const execAsync = promisify(exec);

export interface DiskMetrics {
  path: string;
  totalBytes: number | null;
  usedBytes: number | null;
  freeBytes: number | null;
  usagePercent: number | null;
}

export interface SystemMetrics {
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
  disk: DiskMetrics;
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
}

async function getDiskMetrics(targetPath: string): Promise<DiskMetrics> {
  try {
    const resolved = path.resolve(targetPath);
    const { stdout } = await execAsync(`df -kP ${resolved}`);
    const lines = stdout.trim().split('\n');
    if (lines.length < 2) throw new Error('Unexpected df output');
    const parts = lines[1].split(/\s+/);
    const totalKb = parseInt(parts[1], 10);
    const usedKb = parseInt(parts[2], 10);
    const freeKb = parseInt(parts[3], 10);
    const usagePercent = parts[4] ? parseInt(parts[4].replace('%', ''), 10) : null;

    return {
      path: resolved,
      totalBytes: Number.isFinite(totalKb) ? totalKb * 1024 : null,
      usedBytes: Number.isFinite(usedKb) ? usedKb * 1024 : null,
      freeBytes: Number.isFinite(freeKb) ? freeKb * 1024 : null,
      usagePercent: Number.isFinite(usagePercent) ? usagePercent : null,
    };
  } catch {
    return {
      path: path.resolve(targetPath),
      totalBytes: null,
      usedBytes: null,
      freeBytes: null,
      usagePercent: null,
    };
  }
}

async function getActiveUsers(): Promise<number | null> {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!websiteId) return null;

  try {
    const metrics = await getRealtimeMetrics(websiteId);
    return metrics.active ?? 0;
  } catch {
    return null;
  }
}

export async function collectSystemMetrics(): Promise<SystemMetrics> {
  const cpuCores = os.cpus()?.length || 1;
  const [load1, load5, load15] = os.loadavg();
  const loadPercent = Math.min(100, Math.round((load1 / cpuCores) * 100));

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;

  const errorWindowMs = 15 * 60 * 1000;
  const errorStats = logger.getErrorStats(errorWindowMs);

  return {
    generatedAt: new Date().toISOString(),
    cpu: {
      cores: cpuCores,
      loadAvg1m: load1,
      loadAvg5m: load5,
      loadAvg15m: load15,
      loadPercent,
    },
    memory: {
      totalBytes: totalMem,
      usedBytes: usedMem,
      freeBytes: freeMem,
      usagePercent: memoryPercent,
    },
    disk: await getDiskMetrics(process.env.MONITORING_DISK_PATH || process.cwd()),
    app: {
      uptimeSec: Math.round(process.uptime()),
      nodeVersion: process.version,
      pid: process.pid,
    },
    realtime: {
      activeUsers: await getActiveUsers(),
    },
    errors: {
      windowMinutes: errorWindowMs / 60000,
      total: errorStats.total,
      fatal: errorStats.fatal,
      error: errorStats.error,
    }
  };
}
