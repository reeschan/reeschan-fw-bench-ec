import type { NextConfig } from 'next';

// Cache Components is intentionally off for the "no data caching" baseline run (see SPEC.md).
const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
