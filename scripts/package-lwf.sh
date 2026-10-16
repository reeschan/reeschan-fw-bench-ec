#!/usr/bin/env bash
# Stages each built app (run build-all.sh first) into dist-lwf/<app>/ for Lambda Web Functions.
# Each bundle gets lwf-entry.mjs, which maps AWS_LAMBDA_HTTP_ENDPOINT (host:port) to the
# HOST/PORT variables the frameworks already read, then loads the framework's server.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist-lwf && mkdir -p dist-lwf

entry() { # $1 = dir, $2 = server path relative to bundle root
  cat > "$1/lwf-entry.mjs" <<JS
const ep = process.env.AWS_LAMBDA_HTTP_ENDPOINT ?? '0.0.0.0:3000';
const i = ep.lastIndexOf(':'); // split on the last colon so IPv6 hosts survive
process.env.HOST = process.env.HOSTNAME = ep.slice(0, i);
process.env.PORT = ep.slice(i + 1);
process.env.NODE_ENV = 'production';
await import('./$2');
JS
}

mkdir -p dist-lwf/data-api && cp data-api/server.mjs dist-lwf/data-api/ && entry dist-lwf/data-api server.mjs

mkdir -p dist-lwf/sveltekit && cp -r apps/sveltekit/build apps/sveltekit/package.json dist-lwf/sveltekit/ && entry dist-lwf/sveltekit build/index.js

mkdir -p dist-lwf/tanstack && cp -r apps/tanstack/.output dist-lwf/tanstack/ && entry dist-lwf/tanstack .output/server/index.mjs

for app in next next-cc next-cached; do
  mkdir -p dist-lwf/$app
  cp -r apps/$app/.next/standalone/. dist-lwf/$app/
  cp -r apps/$app/.next/static dist-lwf/$app/.next/static
  entry dist-lwf/$app server.js
done
du -sh dist-lwf/*
