import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore TypeScript errors during build (for development)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Configure external packages for server components
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
