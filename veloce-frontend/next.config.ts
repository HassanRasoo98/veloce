import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid Turbopack writing a sibling `../frontend/.next` when `.next/dev` is
  // benchmarked as slow (Next 16 dev + turbopackFileSystemCacheForDev).
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
