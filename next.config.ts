import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle externals properly as function
      const existingExternals = config.externals || [];
      config.externals = [
        existingExternals,
        "@sparticuz/chromium-min",
        "puppeteer-core",
      ];
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@sparticuz/chromium-min",
      "puppeteer-core",
    ],
  },
  // Increase serverless function size limit
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],
};

export default nextConfig;
