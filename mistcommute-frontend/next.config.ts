import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,

  // Headers for WASM support (v0.9 requires proper COOP/COEP headers)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
      {
        source: "/:path*.wasm",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  
  // Webpack config (only used when NOT using --turbopack)
  webpack: (config, { isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");

    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        "@zama-fhe/relayer-sdk/web": false,
        "@zama-fhe/relayer-sdk": false,
        "@fhevm/mock-utils": false,
      };
    } else {
      // Add global polyfill for browser (required by @zama-fhe/relayer-sdk v0.3.0)
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        global: false,
      };
      
      // Define global as globalThis for browser
      const webpack = require("webpack");
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          global: "globalThis",
        })
      );
    }

    return config;
  },
};

export default nextConfig;

