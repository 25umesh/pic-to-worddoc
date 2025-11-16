import type { NextConfig } from 'next';

// Allow choosing build output mode:
// - `standalone` (default) for server deployments
// - `export` when `EXPORT_STATIC=true` or when running in GitHub Actions
const shouldExport = process.env.EXPORT_STATIC === 'true' || process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  // Choose output based on environment
  output: shouldExport ? 'export' : 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
