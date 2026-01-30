import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  devIndicators: false,
  experimental: {
    // @ts-ignore
    allowedDevOrigins: ["192.168.120.14", "192.168.120.14:3000"],
  },
  // Force rebuild timestamp: 2026-01-07 14:45

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'darma-website.onrender.com',
        port: '',
        pathname: '/uploads/**',
      },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'logos-world.net' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'companieslogo.com' },
      { protocol: 'https', hostname: '1000logos.net' },
    ],
  },
};

export default nextConfig;
