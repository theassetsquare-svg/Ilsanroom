import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    formats: ['image/webp'],
  },
  trailingSlash: true,
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
