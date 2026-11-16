import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @prisma/client must stay external to the webpack bundle: the generated
  // client loads its query-engine binary from disk at runtime, so Next.js
  // must ship the real node_modules package with each serverless function
  // instead of bundling/tracing it away (without this, production requests
  // failed with "Cannot find package '@prisma/client'").
  serverExternalPackages: ["@prisma/client"],
};
export default nextConfig;
