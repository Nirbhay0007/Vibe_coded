import type { NextConfig } from "next";
import CopyWebpackPlugin from "copy-webpack-plugin";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Prevents double-render on mount for Cesium WebGL
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.join(process.cwd(), "node_modules/cesium/Build/Cesium/Workers"),
              to: "../public/Cesium/Workers",
            },
            {
              from: path.join(process.cwd(), "node_modules/cesium/Build/Cesium/ThirdParty"),
              to: "../public/Cesium/ThirdParty",
            },
            {
              from: path.join(process.cwd(), "node_modules/cesium/Build/Cesium/Assets"),
              to: "../public/Cesium/Assets",
            },
            {
              from: path.join(process.cwd(), "node_modules/cesium/Build/Cesium/Widgets"),
              to: "../public/Cesium/Widgets",
            },
          ],
        })
      );
    }
    return config;
  },
};

export default nextConfig;
