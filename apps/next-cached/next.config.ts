import type { NextConfig } from 'next';

// Cache Components ON with 'use cache' on catalog data (lib/cached.ts). Inventory stays per-request.
// Reference run only: the other apps have no equivalent data cache in this benchmark.
const nextConfig: NextConfig = {
  output: 'standalone',
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
