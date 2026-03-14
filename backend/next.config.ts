import type { NextConfig } from "next";

// CORS for /api is handled dynamically in middleware.ts (multiple origins).
// No duplicate header configs here so the last path doesn't override others.
const nextConfig: NextConfig = {};

export default nextConfig;