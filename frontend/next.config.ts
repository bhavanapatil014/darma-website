import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  devIndicators: false,
  // Force rebuild for Vercel deployment update (v2)
};

export default nextConfig;
