import type { NextConfig } from "next";

// Allow requests from all local dev origins
const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

const nextConfig: NextConfig = {
  async headers() {
    return ALLOWED_ORIGINS.map((origin) => ({
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: origin },
        { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        { key: "Access-Control-Max-Age", value: "86400" },
      ],
    }));
  },
};

export default nextConfig;