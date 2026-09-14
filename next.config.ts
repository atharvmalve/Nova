import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.56.1:3000", "localhost:3000"],
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/dpups1csk/**" },
    ],
  },
};

export default nextConfig;
