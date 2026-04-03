import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* other config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '900mb', // Set this to a value that fits your largest expected batch (e.g., '10mb', '50mb')
    },
  },
};

export default nextConfig;