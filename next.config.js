/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cryptologos.cc',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
    ],
    unoptimized: false,
  },
  // Serverless deployment configuration
  serverExternalPackages: ['@google/genai'],
};

module.exports = nextConfig;
