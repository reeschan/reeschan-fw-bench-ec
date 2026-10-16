// Benchmarks the Lambda Web Functions deployment (infra-lwf/outputs.json from `npm run deploy`).
// Runs from any machine with Node 22+ and `npm ci` done in scripts/ (autocannon).
// Usage: node scripts/bench-remote.mjs [--quick] [app ...]
import https from 'node:https';
import fs from 'node:fs';
import zlib from 'node:zlib';
import autocannon from 'autocannon';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const ROUTES = { list: '/', detail: '/products/5', api: '/api/products/5' };
const args = process.argv.slice(2);
const quick = args.includes('--quick');
const only = args.filter((a) => !a.startsWith('--'));
const N = quick ? 20 : 100;
const WARM = quick ? 3 : 10;
const LOAD_SEC = quick ? 5 : 15;

const root = new URL('..', import.meta.url);
const outputs = JSON.parse(fs.readFileSync(new URL('infra-lwf/outputs.json', root), 'utf8')).BenchLwf;
const KEYS = { sveltekit: 'sveltekit', tanstack: 'tanstack', next: 'next', 'next-cc': 'nextcc', 'next-cached': 'nextcached' };
const apps = Object.entries(KEYS)
  .filter(([a]) => !only.length || only.includes(a))
  .map(([app, k]) => {
    const key = Object.keys(outputs).find((o) => o.toLowerCase().startsWith(k + 'url'));
    return { app, base: outputs[key].replace(/\/$/, '') };
  });

const pct = (v, p) => { const s = [...v].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };
const r1 = (n) => Math.round(n * 10) / 10;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function get(url, agent) {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    let ttfb = null;
    const chunks = [];
    https
      .get(url, { headers: { 'user-agent': UA }, agent }, (res) => {
        res.on('data', (c) => { ttfb ??= performance.now() - t0; chunks.push(c); });
        res.on('end', () => resolve({ status: res.statusCode, ttfb, total: performance.now() - t0, body: Buffer.concat(chunks) }));
      })
      .on('error', reject);
  });
}

const result = { at: new Date().toISOString(), quick, apps: {} };
for (const { app, base } of apps) {
  console.log(`\n== ${app} ${base}`);
  const r = (result.apps[app] = {});
  // First request after deploy: no environment is warm yet (new connection each time).
  const c1 = await get(base + ROUTES.detail, false);
  const c2 = await get(base + ROUTES.detail, false);
  r.cold = { status: c1.status, first: r1(c1.total), firstTtfb: r1(c1.ttfb), second: r1(c2.total) };
  r.detailHtmlGzipKB = r1(zlib.gzipSync(c2.body).length / 1024);
  console.log('cold', r.cold);

  const agent = new https.Agent({ keepAlive: true, maxSockets: 1 });
  r.routes = {};
  for (const [name, path] of Object.entries(ROUTES)) {
    for (let i = 0; i < WARM; i++) await get(base + path, agent);
    const t = [], f = [];
    let bad = 0;
    for (let i = 0; i < N; i++) {
      const x = await get(base + path, agent);
      if (x.status !== 200) bad++;
      t.push(x.total); f.push(x.ttfb);
    }
    r.routes[name] = { ttfbP50: r1(pct(f, 50)), ttfbP95: r1(pct(f, 95)), totalP50: r1(pct(t, 50)), totalP95: r1(pct(t, 95)), non200: bad };
    console.log(name, r.routes[name]);
  }
  agent.destroy();

  r.load = {};
  for (const [name, path] of Object.entries({ list: ROUTES.list, detail: ROUTES.detail })) {
    const a = await autocannon({ url: base + path, connections: 50, duration: LOAD_SEC, headers: { 'user-agent': UA } });
    r.load[name] = { rps: r1(a.requests.average), p50: a.latency.p50, p99: a.latency.p99, non2xx: a.non2xx, errors: a.errors };
    console.log('load', name, r.load[name]);
    await sleep(2000);
  }
}

fs.mkdirSync(new URL('results/', root), { recursive: true });
const stamp = result.at.replace(/[:.]/g, '-');
fs.writeFileSync(new URL(`results/lwf-${stamp}.json`, root), JSON.stringify(result, null, 2));
const md = [
  `# Lambda Web Functions ${result.at}${quick ? ' (quick)' : ''}`, '',
  '| app | cold 1st ms | 2nd ms | list ttfb/total p50 | detail ttfb/total p50 | api total p50 | list RPS | detail RPS | detail p99 | HTML gz KB |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...Object.entries(result.apps).map(([a, x]) =>
    `| ${a} | ${x.cold.first} | ${x.cold.second} | ${x.routes.list.ttfbP50}/${x.routes.list.totalP50} | ${x.routes.detail.ttfbP50}/${x.routes.detail.totalP50} | ${x.routes.api.totalP50} | ${x.load.list.rps} | ${x.load.detail.rps} | ${x.load.detail.p99} | ${x.detailHtmlGzipKB} |`),
].join('\n');
fs.writeFileSync(new URL(`results/lwf-${stamp}.md`, root), md + '\n');
console.log('\n' + md);
