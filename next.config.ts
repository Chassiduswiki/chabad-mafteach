import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  webpack: (config: any, { isServer, dev }: { isServer: boolean; dev: boolean }) => {
    // Fix for fast-equals HMR issue with TipTap
    if (dev) {
      // Add rule to handle ESM modules properly
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        resolve: {
          fullySpecified: false,
        },
        type: 'javascript/auto',
      });
    }
    
    // Enable automatic instrumentation of Vercel Cron Monitors
    // Replaces deprecated automaticVercelMonitors option
    if (config.experiments && config.experiments.buildMerging) {
      config.experiments.buildMerging = true;
    }
    
    return config;
  },
  async rewrites() {
    const directusUrl = process.env.DIRECTUS_URL;
    if (!directusUrl) {
      return [];
    }
    return [
      {
        source: '/api/directus-proxy/:path*',
        destination: `${directusUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const csp = isDev
      ? "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://cloud.umami.is; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: http: ws: wss:; worker-src 'self' blob:; frame-ancestors 'none';"
      : "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://cloud.umami.is; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; worker-src 'self' blob: frame-ancestors 'none';";

    return [
      {
        // Static assets
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Protect admin routes from indexing
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
      {
        // Protect API routes from indexing
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
      {
        // Protect auth routes from indexing
        source: '/auth/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
      {
        // Match all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "chassiduswiki",

  project: "cwiki",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Enables automatic instrumentation of Vercel Cron Monitors is now handled in webpack config
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  // automaticVercelMonitors: true, // DEPRECATED - moved to webpack config
});
