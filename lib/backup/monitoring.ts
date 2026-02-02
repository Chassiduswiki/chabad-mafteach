import fs from 'fs';
import path from 'path';

export type BackupType = 'database' | 'assets' | 'config';
export type BackupStatus = 'success' | 'failed' | 'running';

export interface BackupRun {
  id: string;
  type: BackupType;
  status: BackupStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  sizeBytes?: number;
  files?: string[];
  message?: string;
  metadata?: Record<string, any>;
}

interface BackupState {
  runs: BackupRun[];
}

const DEFAULT_STATE: BackupState = { runs: [] };

function resolveStatePath(): string {
  const configured = process.env.BACKUP_STATE_PATH;
  if (configured) return configured;
  return path.join(process.cwd(), 'data', 'backup-status.json');
}

function resolveBackupDir(): string {
  return process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadState(): BackupState {
  const statePath = resolveStatePath();
  try {
    if (!fs.existsSync(statePath)) return { ...DEFAULT_STATE };
    const raw = fs.readFileSync(statePath, 'utf-8');
    const parsed = JSON.parse(raw) as BackupState;
    return parsed && Array.isArray(parsed.runs) ? parsed : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(state: BackupState): void {
  const statePath = resolveStatePath();
  ensureDir(statePath);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function trimRuns(runs: BackupRun[], limit: number = 200): BackupRun[] {
  if (runs.length <= limit) return runs;
  return runs.slice(-limit);
}

export function recordBackupStart(run: Omit<BackupRun, 'status' | 'startedAt'> & { startedAt?: string }): BackupRun {
  const state = loadState();
  const startedAt = run.startedAt || new Date().toISOString();
  const record: BackupRun = {
    ...run,
    status: 'running',
    startedAt,
  };

  state.runs = trimRuns([...state.runs, record]);
  saveState(state);
  return record;
}

export function recordBackupResult(result: BackupRun): BackupRun {
  const state = loadState();
  const index = state.runs.findIndex(run => run.id === result.id && run.type === result.type);
  if (index >= 0) {
    state.runs[index] = result;
  } else {
    state.runs = trimRuns([...state.runs, result]);
  }
  saveState(state);
  return result;
}

export function listBackupRuns(limit: number = 50): BackupRun[] {
  const state = loadState();
  return [...state.runs].slice(-limit).reverse();
}

export function getBackupStatus() {
  const state = loadState();
  const byType = (type: BackupType) => state.runs.filter(run => run.type === type);

  const latestSuccess = (type: BackupType) =>
    byType(type).filter(run => run.status === 'success').sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))[0];

  const latestFailure = (type: BackupType) =>
    byType(type).filter(run => run.status === 'failed').sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))[0];

  const maxAgeHours = {
    database: parseInt(process.env.BACKUP_DB_MAX_AGE_HOURS || '36', 10),
    assets: parseInt(process.env.BACKUP_ASSET_MAX_AGE_HOURS || '168', 10),
    config: parseInt(process.env.BACKUP_CONFIG_MAX_AGE_HOURS || '168', 10),
  };

  const now = Date.now();
  const alerts: Array<{ type: 'warning' | 'critical'; message: string }> = [];

  (['database', 'assets', 'config'] as BackupType[]).forEach(type => {
    const lastSuccess = latestSuccess(type);
    if (!lastSuccess?.completedAt) {
      alerts.push({ type: 'critical', message: `No successful ${type} backup has been recorded.` });
      return;
    }
    const ageHours = (now - new Date(lastSuccess.completedAt).getTime()) / 36e5;
    if (ageHours > maxAgeHours[type]) {
      alerts.push({
        type: 'warning',
        message: `${type} backup is ${Math.round(ageHours)} hours old (threshold ${maxAgeHours[type]}h).`
      });
    }
  });

  return {
    lastSuccess: {
      database: latestSuccess('database'),
      assets: latestSuccess('assets'),
      config: latestSuccess('config'),
    },
    lastFailure: {
      database: latestFailure('database'),
      assets: latestFailure('assets'),
      config: latestFailure('config'),
    },
    alerts,
  };
}

export function listBackupManifests(limit: number = 50) {
  const backupDir = resolveBackupDir();
  if (!fs.existsSync(backupDir)) return [];

  const entries = fs.readdirSync(backupDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
    .reverse();

  const manifests: any[] = [];
  for (const entry of entries) {
    const manifestPath = path.join(backupDir, entry, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw);
      manifests.push(manifest);
      if (manifests.length >= limit) break;
    } catch {
      // ignore invalid manifests
    }
  }

  return manifests;
}

export function resolveBackupStorageDir(): string {
  return resolveBackupDir();
}

export function resolveBackupStatePath(): string {
  return resolveStatePath();
}
