import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@copilotkit/runtime"],
  typescript: {
    // Docker route override uses HttpAgent which has a type mismatch with CopilotRuntime
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        // Intercepts requests to /memwal-proxy/...
        source: "/memwal-proxy/:path*",
        // And forwards them to the staging relayer
        destination: `${process.env.NEXT_PUBLIC_MEMWAL_SERVER_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
