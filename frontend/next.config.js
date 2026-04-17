/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",  // for Vercel
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
