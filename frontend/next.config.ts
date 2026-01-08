import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  devIndicators: false,
  // Force rebuild timestamp: 2026-01-07 14:45

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
