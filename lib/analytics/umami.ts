// Umami Analytics Integration
// This module provides functions to interact with Umami analytics

export interface UmamiEvent {
  website: string;
  event: string;
  data?: Record<string, any>;
  url?: string;
  referrer?: string;
  timestamp?: string;
}

export interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  visitDuration: number;
}

export interface UmamiPageStats {
  pageviews: number;
  visitors: number;
  bounces: number;
  visitDuration: number;
  timeOnPage: number;
}

interface UmamiApiResponse<T> {
  data: T[];
}

type UmamiAuthToken = {
  token: string;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function readJson<T>(response: Response, context: string): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const text = await response.text();
    const snippet = text.slice(0, 300);
    throw new Error(
      `${context}: Expected JSON but got '${contentType || 'unknown'}' (status ${response.status}). ` +
        `Body starts with: ${JSON.stringify(snippet)}`
    );
  }

  return (await response.json()) as T;
}

function getCloudEndpoint() {
  return process.env.UMAMI_API_CLIENT_ENDPOINT || 'https://api.umami.is/v1';
}

function getCloudApiKey() {
  return process.env.UMAMI_CLOUD_API_KEY || process.env.UMAMI_API_KEY;
}

async function getAuthHeaders(umamiHost: string): Promise<Record<string, string>> {
  const cloudKey = getCloudApiKey();
  if (cloudKey) {
    return {
      'x-umami-api-key': cloudKey,
      Accept: 'application/json'
    };
  }

  const token = await getAuthToken(umamiHost);
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  };
}

function getBaseUrl(umamiHost: string): string {
  const cloudKey = getCloudApiKey();
  if (cloudKey) return getCloudEndpoint();
  return `${umamiHost}/api`;
}

async function getAuthToken(umamiHost: string): Promise<string> {
  // Umami self-hosted uses a login flow to obtain a bearer token.
  // Umami Cloud uses API keys, but for self-hosted we should authenticate.
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) return cachedToken.token;

  const username = process.env.UMAMI_USERNAME;
  const password = process.env.UMAMI_PASSWORD;
  if (!username || !password) {
    throw new Error('Umami is configured but UMAMI_USERNAME/UMAMI_PASSWORD are missing');
  }

  const res = await fetch(`${umamiHost}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    throw new Error(`Failed to authenticate with Umami: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as UmamiAuthToken;
  if (!json?.token) {
    throw new Error('Umami auth response missing token');
  }

  // Umami doesn’t publish a token TTL in the response; cache short-lived to reduce logins.
  cachedToken = { token: json.token, expiresAt: now + 10 * 60 * 1000 };
  return json.token;
}

// Fetch stats from Umami API
export async function getUmamiStats(
  websiteId: string,
  startAt?: Date,
  endAt?: Date
): Promise<UmamiApiResponse<UmamiStats>> {
  const umamiHost = process.env.UMAMI_HOST || 'http://localhost:3000';
  const baseUrl = getBaseUrl(umamiHost);
  const headers = await getAuthHeaders(umamiHost);
  const url = new URL(`/websites/${websiteId}/stats`, baseUrl);

  if (startAt) url.searchParams.set('startAt', String(startAt.getTime()));
  if (endAt) url.searchParams.set('endAt', String(endAt.getTime()));

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch Umami stats: ${response.statusText}`);
  }

  const data = await readJson<UmamiStats>(response, 'Umami getUmamiStats');
  return { data: [data] };
}

// Fetch page-specific stats
export async function getPageStats(
  websiteId: string,
  url: string,
  startAt?: Date,
  endAt?: Date
): Promise<UmamiApiResponse<UmamiPageStats>> {
  // Implemented via metrics/expanded with a filter on path.
  const umamiHost = process.env.UMAMI_HOST || 'http://localhost:3000';
  const baseUrl = getBaseUrl(umamiHost);
  const headers = await getAuthHeaders(umamiHost);
  const metricsUrl = new URL(`/websites/${websiteId}/metrics/expanded`, baseUrl);
  metricsUrl.searchParams.set('type', 'path');
  if (startAt) metricsUrl.searchParams.set('startAt', String(startAt.getTime()));
  if (endAt) metricsUrl.searchParams.set('endAt', String(endAt.getTime()));

  // Umami supports filters; docs indicate a generic `filters` parameter.
  // For a single path, the common filter shape is `filters=path==/some/path`.
  metricsUrl.searchParams.set('filters', `path==${url}`);
  metricsUrl.searchParams.set('limit', '1');

  const response = await fetch(metricsUrl.toString(), { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch page stats: ${response.status} ${response.statusText}`);
  }

  const rows = await readJson<
    Array<{
    name: string;
    pageviews: number;
    visitors: number;
    visits: number;
    bounces: number;
    totaltime: number;
  }>
  >(response, 'Umami getPageStats');

  const row = rows?.[0];
  return {
    data: [
      {
        pageviews: row?.pageviews ?? 0,
        visitors: row?.visitors ?? 0,
        bounces: row?.bounces ?? 0,
        visitDuration: row?.totaltime ?? 0,
        timeOnPage: row?.totaltime ?? 0
      }
    ]
  };
}

// Fetch real-time metrics
export async function getRealtimeMetrics(
  websiteId: string
): Promise<{ active: number; pageviews: number; events: number; sessions: number }> {
  const umamiHost = process.env.UMAMI_HOST || 'http://localhost:3000';
  const baseUrl = getBaseUrl(umamiHost);
  const headers = await getAuthHeaders(umamiHost);
  const url = new URL(`/websites/${websiteId}/active`, baseUrl);

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch realtime metrics: ${response.status} ${response.statusText}`);
  }

  // Response is a list of active sessions. For now, return active count.
  const active = await readJson<unknown[]>(response, 'Umami getRealtimeMetrics');
  return { active: Array.isArray(active) ? active.length : 0, pageviews: 0, events: 0, sessions: 0 };
}

// Send custom event to Umami
export async function trackEvent(
  websiteId: string,
  event: string,
  data?: Record<string, any>
): Promise<void> {
  // Umami event tracking for self-hosted is intended to happen via the client script
  // (window.umami.track). This server helper intentionally does not implement it.
  void websiteId;
  void event;
  void data;
}

// Get top pages
export async function getTopPages(
  websiteId: string,
  startAt?: Date,
  endAt?: Date,
  limit: number = 10
): Promise<Array<{ url: string; pageviews: number; visitors: number; bounces: number }>> {
  const umamiHost = process.env.UMAMI_HOST || 'http://localhost:3000';
  const baseUrl = getBaseUrl(umamiHost);
  const headers = await getAuthHeaders(umamiHost);
  const url = new URL(`/websites/${websiteId}/metrics/expanded`, baseUrl);
  url.searchParams.set('type', 'path');
  if (startAt) url.searchParams.set('startAt', String(startAt.getTime()));
  if (endAt) url.searchParams.set('endAt', String(endAt.getTime()));
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch top pages: ${response.statusText}`);
  }

  const result = await readJson<
    Array<{
    name: string;
    pageviews: number;
    visitors: number;
    bounces: number;
  }>
  >(response, 'Umami getTopPages');
  return (result || []).map((row) => ({
    url: row.name,
    pageviews: row.pageviews,
    visitors: row.visitors,
    bounces: row.bounces
  }));
}
