/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable Turbopack for Next.js 16
  turbopack: {},
};

export default nextConfig;
