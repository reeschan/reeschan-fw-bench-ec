import http from 'node:http';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
// A browser UA matters: TanStack Start (and React SSR helpers in general) wait for the full
// render when the UA looks like a bot (curl/autocannon defaults), which disables streaming.

export const APPS = {
  sveltekit: { port: 3001 },
  tanstack: { port: 3002 },
  next: { port: 3003 },
  'next-cc': { port: 3004 }, // Cache Components ON, no data cache
  'next-cached': { port: 3005 }, // Cache Components ON + 'use cache' on catalog data (reference)
};

export const ROUTES = {
  list: '/',
  detail: '/products/5',
  api: '/api/products/5',
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One request; returns ttfb (first body byte) and total ms, plus body size. */
export function timedGet(url) {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    let ttfb = null;
    let size = 0;
    const req = http.get(url, { headers: { 'user-agent': UA }, agent: false }, (res) => {
      res.on('data', (c) => {
        if (ttfb === null) ttfb = performance.now() - t0;
        size += c.length;
      });
      res.on('end', () => resolve({ status: res.statusCode, ttfb, total: performance.now() - t0, size }));
    });
    req.on('error', reject);
  });
}

export function pct(values, p) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}
export const r1 = (n) => Math.round(n * 10) / 10;

export const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
export const compose = (...args) => sh('docker', ['compose', '-f', new URL('../docker-compose.yml', import.meta.url).pathname, ...args]);

export async function waitReady(url, timeoutMs = 30000) {
  const t0 = performance.now();
  while (performance.now() - t0 < timeoutMs) {
    try {
      const r = await timedGet(url);
      if (r.status === 200) return performance.now() - t0;
    } catch {}
    await sleep(10);
  }
  throw new Error(`not ready: ${url}`);
}

/** Memory of a compose service in MiB, from docker stats. Async so it never blocks a running load test. */
const ids = {};
export async function memMiB(service) {
  const id = (ids[service] ??= compose('ps', '-q', service));
  const { stdout } = await promisify(execFile)('docker', ['stats', '--no-stream', '--format', '{{.MemUsage}}', id]);
  const out = stdout.trim(); // "45.2MiB / 512MiB"
  const [v, unit] = out.split('/')[0].trim().match(/([\d.]+)(\w+)/).slice(1);
  return r1(Number(v) * (unit.startsWith('G') ? 1024 : unit.startsWith('k') ? 1 / 1024 : 1));
}
