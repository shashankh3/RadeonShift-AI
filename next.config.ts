import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/pinggy/:path*',
        destination: 'https://dfvdj-36-150-116-194.free.pinggy.net/:path*',
      },
    ];
  },
};

export default nextConfig;
