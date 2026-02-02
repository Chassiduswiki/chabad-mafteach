#!/usr/bin/env node

/**
 * Lightweight load test for API endpoints.
 * Uses simple concurrent fetches to measure latency.
 */

const endpoints = [
  '/api/search?q=tanya',
  '/api/topics?limit=10',
  '/api/documents?doc_type=sefer',
];

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'http://localhost:3000';

const iterations = Number(process.env.LOAD_TEST_ITERATIONS || 20);
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || 5);

async function runSingle(url) {
  const start = Date.now();
  const response = await fetch(url);
  const duration = Date.now() - start;
  return { ok: response.ok, duration };
}

async function runEndpoint(endpoint) {
  const url = `${baseUrl}${endpoint}`;
  const durations = [];
  let failures = 0;

  for (let i = 0; i < iterations; i += concurrency) {
    const batch = Array.from({ length: Math.min(concurrency, iterations - i) }, () => runSingle(url));
    const results = await Promise.all(batch);
    results.forEach((result) => {
      durations.push(result.duration);
      if (!result.ok) failures += 1;
    });
  }

  durations.sort((a, b) => a - b);
  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const p95 = durations[Math.floor(durations.length * 0.95) - 1] || durations[durations.length - 1];

  return { endpoint, avg: Math.round(avg), p95, failures, runs: durations.length };
}

async function main() {
  console.log('⚡ Load Test');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Iterations: ${iterations} | Concurrency: ${concurrency}`);

  for (const endpoint of endpoints) {
    const result = await runEndpoint(endpoint);
    console.log(
      `${result.endpoint} -> avg ${result.avg}ms | p95 ${result.p95}ms | failures ${result.failures}/${result.runs}`
    );
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
}
