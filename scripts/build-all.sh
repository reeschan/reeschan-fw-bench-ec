#!/usr/bin/env bash
# Builds the three apps on the host and records build time, then builds the runtime images.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p results
: > results/build-times.txt
for app in sveltekit tanstack next next-cc next-cached; do
  (cd apps/$app && npm ci --silent && rm -rf build .output .next)
  start=$(date +%s.%N)
  (cd apps/$app && NEXT_TELEMETRY_DISABLED=1 npm run build --silent >/dev/null)
  end=$(date +%s.%N)
  echo "$app $(echo "$end - $start" | bc)" | tee -a results/build-times.txt
done
docker compose build
