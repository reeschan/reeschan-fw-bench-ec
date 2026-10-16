// Throughput under concurrency with autocannon (browser UA so streaming paths are exercised).
import autocannon from 'autocannon';
import { APPS, ROUTES, UA, memMiB, r1 } from './lib.mjs';

export async function measureLoad(app, { connections = 50, duration = 15 } = {}) {
  const out = {};
  for (const [name, path] of Object.entries(ROUTES)) {
    let peak = 0;
    let running = true;
    const sampler = (async () => {
      while (running) peak = Math.max(peak, await memMiB(app).catch(() => 0));
    })();
    const r = await autocannon({
      url: `http://localhost:${APPS[app].port}${path}`,
      connections, duration, headers: { 'user-agent': UA },
    });
    running = false;
    await sampler;
    out[name] = {
      rps: r1(r.requests.average), lat_p50: r.latency.p50, lat_p99: r.latency.p99,
      errors: r.errors + r.non2xx, peak_mem_mib: peak,
    };
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(await measureLoad(process.argv[2] ?? 'sveltekit'), null, 2));
}
