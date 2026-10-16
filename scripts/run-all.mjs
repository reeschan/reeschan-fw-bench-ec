// Runs every measurement for each app, one app container at a time, and writes results/.
import fs from 'node:fs';
import { measureColdStart } from './coldstart.mjs';
import { measureJs } from './jssize.mjs';
import { measureLoad } from './load.mjs';
import { measureTtfb } from './ttfb.mjs';
import { APPS, ROUTES, compose, memMiB, sleep, waitReady } from './lib.mjs';

const quick = process.argv.includes('--quick');
const apps = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const targets = apps.length ? apps : Object.keys(APPS);
const resultsDir = new URL('../results/', import.meta.url).pathname;
fs.mkdirSync(resultsDir, { recursive: true });

compose('up', '-d', 'data-api');
await waitReady('http://localhost:4000/health');

const results = {};
for (const app of targets) {
  console.error(`== ${app}`);
  compose('stop', ...Object.keys(APPS));
  compose('up', '-d', app);
  await waitReady(`http://localhost:${APPS[app].port}${ROUTES.list}`);
  await sleep(2000);
  const idle = await memMiB(app);
  const ttfb = await measureTtfb(app, quick ? 30 : 200);
  const js = await measureJs(app);
  const load = await measureLoad(app, quick ? { duration: 5 } : {});
  const cold = await measureColdStart(app, quick ? 3 : 10);
  results[app] = { idle_mem_mib: idle, ttfb, js, load, cold };
  compose('stop', app);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.writeFileSync(`${resultsDir}/run-${stamp}.json`, JSON.stringify({ quick, results }, null, 2));
fs.writeFileSync(`${resultsDir}/run-${stamp}.md`, toMarkdown(results, quick));
console.log(toMarkdown(results, quick));

function toMarkdown(r, quick) {
  const apps = Object.keys(r);
  const row = (label, f) => `| ${label} | ${apps.map((a) => f(r[a])).join(' | ')} |`;
  const lines = [
    `# Run ${stamp}${quick ? ' (quick)' : ''}`, '',
    `| metric | ${apps.join(' | ')} |`, `|---|${apps.map(() => '---').join('|')}|`,
  ];
  for (const route of Object.keys(ROUTES)) {
    lines.push(row(`${route} TTFB p50 / p95 (ms)`, (x) => `${x.ttfb[route].ttfb_p50} / ${x.ttfb[route].ttfb_p95}`));
    lines.push(row(`${route} total p50 / p95 (ms)`, (x) => `${x.ttfb[route].total_p50} / ${x.ttfb[route].total_p95}`));
    lines.push(row(`${route} RPS @50conn`, (x) => x.load[route].rps));
    lines.push(row(`${route} latency p50 / p99 @50conn (ms)`, (x) => `${x.load[route].lat_p50} / ${x.load[route].lat_p99}`));
    lines.push(row(`${route} errors`, (x) => x.load[route].errors));
    lines.push(row(`${route} peak mem under load (MiB)`, (x) => x.load[route].peak_mem_mib));
  }
  for (const route of ['list', 'detail']) {
    lines.push(row(`${route} client JS gzip (KB, files)`, (x) => `${x.js[route].js_gzip_kb} (${x.js[route].js_files})`));
    lines.push(row(`${route} HTML gzip (KB)`, (x) => x.js[route].html_gzip_kb));
  }
  lines.push(row('idle memory (MiB)', (x) => x.idle_mem_mib));
  lines.push(row('container start → first 200 p50 / max (ms)', (x) => `${x.cold.start_to_first_200_p50} / ${x.cold.start_to_first_200_max}`));
  lines.push(row('first request after restart (ms)', (x) => x.cold.first_request_total));
  lines.push(row('second request (ms)', (x) => x.cold.second_request_total));
  return lines.join('\n') + '\n';
}
