/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use default .next directory for Vercel compatibility
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

export default nextConfig;
