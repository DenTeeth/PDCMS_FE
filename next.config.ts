import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Ignore TypeScript errors during build for deployment
  // Note: ESLint config is now handled via .eslintrc or eslint.config.js
  typescript: {
    ignoreBuildErrors: true,
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      '@fortawesome/react-fontawesome',
      '@fortawesome/free-solid-svg-icons',
      'lucide-react',
      'framer-motion'
    ],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    qualities: [75, 85, 90, 95, 100], // Add quality levels to fix Next.js 16 warning
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ap-south-1.graphassets.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.graphassets.com',
        pathname: '/**',
      },
    ],
  },

  // Bundle analyzer for debugging
  webpack: (config, { dev, isServer }) => {
    // Optimize chunks
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
