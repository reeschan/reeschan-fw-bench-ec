import type { NextConfig } from 'next';

// Cache Components ON (the create-next-app default since 16.4). Data is still not cached here:
// no 'use cache' anywhere, so every request hits data-api like the other apps.
const nextConfig: NextConfig = {
  output: 'standalone',
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
