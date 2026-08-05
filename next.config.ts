import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  experimental: {
    workerThreads: false,
    cpus: 2,
  },
};

export default nextConfig;
