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
  // For static export, uncomment the following:
  // output: 'export',
  // images: {
  //   unoptimized: true,
  // },
  // trailingSlash: true,
};

module.exports = nextConfig;
