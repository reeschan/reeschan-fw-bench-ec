// Pulls AWS/Lambda/Web CloudWatch metrics for the bench functions and turns them into a cost estimate.
// Usage: node scripts/lwf-cost.mjs <startISO> <endISO> [--profile <profile>]   (or set AWS_PROFILE)
// Prices: AWS Pricing API, ap-northeast-1, Arm (2026-10-16). Each environment has 2 GB memory;
// memory is billed for the environment's whole lifetime (EnvironmentActiveTime), CPU only when used.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const PRICE = { request: 0.0000003, vcpuSec: 0.0000322421, gbSec: 0.0000042688 };
const ENV_GB = 2;
const FNS = ['sveltekit', 'tanstack', 'next', 'next-cc', 'next-cached', 'data-api'];

const [start, end] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const pi = process.argv.indexOf('--profile');
const profile = pi > 0 ? process.argv[pi + 1] : process.env.AWS_PROFILE;
if (!start || !end) throw new Error('usage: lwf-cost.mjs <startISO> <endISO>');

function series(metric, fn, withEndpoint) {
  const dims = [`Name=FunctionName,Value=bench-${fn}`];
  if (withEndpoint) dims.push('Name=EndpointName,Value=main');
  const out = execFileSync('aws', [
    'cloudwatch', 'get-metric-statistics', '--namespace', 'AWS/Lambda/Web', '--metric-name', metric,
    '--dimensions', ...dims, '--start-time', start, '--end-time', end, '--period', '60',
    '--statistics', 'Sum', '--region', process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1', '--output', 'json',
    ...(profile ? ['--profile', profile] : []),
  ], { encoding: 'utf8', shell: process.platform === 'win32' });
  return JSON.parse(out).Datapoints.sort((a, b) => a.Timestamp.localeCompare(b.Timestamp));
}
const sum = (d) => d.reduce((s, x) => s + x.Sum, 0);
const r = (n, d = 2) => Number(n.toFixed(d));

const rows = {};
for (const fn of FNS) {
  const active = series('EnvironmentActiveTime', fn);
  const cpu = series('EnvironmentCPUTime', fn);
  const req = series('ExecutedRequests', fn, true);
  const requests = sum(req), cpuSec = sum(cpu) / 1000, envSec = sum(active) / 1000;
  const cost = {
    request: requests * PRICE.request,
    cpu: cpuSec * PRICE.vcpuSec, // assumption: EnvironmentCPUTime is billed vCPU time
    memory: envSec * ENV_GB * PRICE.gbSec,
  };
  cost.total = cost.request + cost.cpu + cost.memory;
  const peakEnvs = Math.max(0, ...active.map((x) => x.Sum / 60000));
  rows[fn] = {
    requests, cpuSec: r(cpuSec), envSec: r(envSec), peakEnvs: r(peakEnvs, 1),
    cpuMsPerReq: requests ? r((cpuSec * 1000) / requests, 3) : null,
    cost: Object.fromEntries(Object.entries(cost).map(([k, v]) => [k, r(v, 6)])),
    // Marginal cost (request fee + CPU) per 1M requests: what scales with traffic once environments are up.
    marginalPer1M: requests ? r(((cost.request + cost.cpu) / requests) * 1e6, 3) : null,
    allInPer1M: requests ? r((cost.total / requests) * 1e6, 3) : null,
    perMinute: active.map((x) => ({
      t: x.Timestamp, envs: r(x.Sum / 60000, 1),
      cpuMs: cpu.find((c) => c.Timestamp === x.Timestamp)?.Sum ?? 0,
      req: req.find((c) => c.Timestamp === x.Timestamp)?.Sum ?? 0,
    })),
  };
}

const result = { start, end, price: PRICE, envGb: ENV_GB, functions: rows };
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const root = new URL('..', import.meta.url);
fs.mkdirSync(new URL('results/', root), { recursive: true });
fs.writeFileSync(new URL(`results/lwf-cost-${stamp}.json`, root), JSON.stringify(result, null, 2));
const md = [
  `# Lambda Web Functions cost ${start} – ${end}`, '',
  `Tokyo Arm: $${PRICE.request * 1e6}/1M req, $${PRICE.vcpuSec}/vCPU-s, $${PRICE.gbSec}/GB-s, ${ENV_GB} GB/env`, '',
  '| fn | requests | CPU s | CPU ms/req | env-s | peak envs | req $ | CPU $ | mem $ | total $ | marginal $/1M | all-in $/1M |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...Object.entries(rows).map(([f, x]) =>
    `| ${f} | ${x.requests} | ${x.cpuSec} | ${x.cpuMsPerReq} | ${x.envSec} | ${x.peakEnvs} | ${x.cost.request} | ${x.cost.cpu} | ${x.cost.memory} | ${x.cost.total} | ${x.marginalPer1M} | ${x.allInPer1M} |`),
].join('\n');
fs.writeFileSync(new URL(`results/lwf-cost-${stamp}.md`, root), md + '\n');
console.log(md);
