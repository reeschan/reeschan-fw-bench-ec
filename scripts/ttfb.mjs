// Sequential latency: TTFB and full-response time per route (no concurrency).
import { APPS, ROUTES, pct, r1, timedGet } from './lib.mjs';

export async function measureTtfb(app, n = 100, warmup = 20) {
  const out = {};
  for (const [name, path] of Object.entries(ROUTES)) {
    const url = `http://localhost:${APPS[app].port}${path}`;
    for (let i = 0; i < warmup; i++) await timedGet(url);
    const rs = [];
    for (let i = 0; i < n; i++) rs.push(await timedGet(url));
    const t = rs.map((r) => r.ttfb), tot = rs.map((r) => r.total);
    out[name] = {
      ttfb_p50: r1(pct(t, 50)), ttfb_p95: r1(pct(t, 95)),
      total_p50: r1(pct(tot, 50)), total_p95: r1(pct(tot, 95)),
      html_bytes: rs[0].size,
    };
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(await measureTtfb(process.argv[2] ?? 'sveltekit'), null, 2));
}
