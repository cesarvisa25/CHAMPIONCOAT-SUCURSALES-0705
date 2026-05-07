/** @type {import('next').NextConfig} */
const nextConfig = {
  // Needed for face-api.js canvas in server components
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
