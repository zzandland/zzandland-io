import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Note: You might need to add other configurations
  // depending on your project needs, like disabling image optimization
  // if you are not using a compatible loader for static export.
  // images: {
  //   unoptimized: true,
  // },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
