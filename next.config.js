const path = require("path");

/** @type {import("next").NextConfig} */
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "/mc";
const basePath = rawBasePath === "/" ? "" : rawBasePath.replace(/\/+$/, "");

const nextConfig = {
  basePath,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
};
module.exports = nextConfig;
