import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.56.1:3000", "localhost:3000"],
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
