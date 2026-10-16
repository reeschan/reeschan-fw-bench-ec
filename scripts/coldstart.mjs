// Cold start: container start -> first 200 on the detail page, and that first request's latency.
import { APPS, ROUTES, compose, r1, sleep, timedGet, waitReady, pct } from './lib.mjs';

export async function measureColdStart(app, runs = 5) {
  const ready = [];
  const url = `http://localhost:${APPS[app].port}${ROUTES.detail}`;
  for (let i = 0; i < runs; i++) {
    compose('stop', app);
    await sleep(500);
    const t0 = performance.now();
    compose('start', app);
    await waitReady(url);
    ready.push(performance.now() - t0);
  }
  // A fresh process's first request vs. a warm one.
  // Docker's port proxy accepts TCP before the app listens, so retry until the app answers;
  // the first answered request is the first one the fresh process handled.
  compose('restart', app);
  let firstReq;
  while (!firstReq) {
    try { firstReq = await timedGet(url); } catch { await sleep(10); }
  }
  const warm = await timedGet(url);
  return {
    start_to_first_200_p50: r1(pct(ready, 50)),
    start_to_first_200_max: r1(Math.max(...ready)),
    first_request_total: r1(firstReq.total),
    second_request_total: r1(warm.total),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(await measureColdStart(process.argv[2] ?? 'sveltekit'), null, 2));
}
