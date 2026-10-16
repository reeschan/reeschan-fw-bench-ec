// Client JS shipped per route: <script src> + modulepreload links, raw and gzip.
import { gzipSync } from 'node:zlib';
import { APPS, ROUTES, UA, r1 } from './lib.mjs';

export async function measureJs(app) {
  const base = `http://localhost:${APPS[app].port}`;
  const out = {};
  for (const [name, path] of Object.entries(ROUTES)) {
    if (name === 'api') continue;
    const html = await (await fetch(base + path, { headers: { 'user-agent': UA } })).text();
    const srcs = new Set();
    for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) srcs.add(m[1]);
    for (const m of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)) srcs.add(m[1]);
    for (const m of html.matchAll(/<link[^>]+href="([^"]+)"[^>]+rel="modulepreload"/g)) srcs.add(m[1]);
    // SvelteKit and TanStack also start entry chunks from inline import() calls.
    for (const m of html.matchAll(/import\(["']([^"']+\.js)["']\)/g)) srcs.add(m[1]);
    let raw = 0, gz = 0;
    for (const s of srcs) {
      const buf = Buffer.from(await (await fetch(new URL(s, base + path))).arrayBuffer());
      raw += buf.length; gz += gzipSync(buf).length;
    }
    const inline = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].reduce((a, m) => a + m[1].length, 0);
    out[name] = {
      js_files: srcs.size, js_kb: r1(raw / 1024), js_gzip_kb: r1(gz / 1024),
      html_kb: r1(html.length / 1024), html_gzip_kb: r1(gzipSync(html).length / 1024), inline_script_kb: r1(inline / 1024),
    };
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(await measureJs(process.argv[2] ?? 'sveltekit'), null, 2));
}
