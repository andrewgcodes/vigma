import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.externals.push({
      canvas: "commonjs canvas",
    });
    return config;
  },
};

export default nextConfig;
