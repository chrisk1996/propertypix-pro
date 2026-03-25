/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' - app needs API routes which require server
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

export default nextConfig;
