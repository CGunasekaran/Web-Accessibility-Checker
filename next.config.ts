import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: [
      "playwright-core",
      "playwright-aws-lambda",
    ],
  },
};

export default nextConfig;
