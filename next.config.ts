import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api-backend/:path*',
        destination: 'https://webhook.xyz-sa.site/:path*', // proxy to Backend
      },
    ]
  },
};

export default nextConfig;
