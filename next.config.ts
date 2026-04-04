import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bodySizeLimit is still often required in experimental for large uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '900mb', 
    },
  },
};

export default nextConfig; // Ensure this export is at the bottom