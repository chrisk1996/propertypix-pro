/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use default .next directory for Vercel compatibility
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  typescript: {
    // Disable type checking during build for Pascal Editor packages
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Fixes npm packages that are required for konva in node environment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
