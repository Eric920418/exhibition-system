/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/exhibition-bucket/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
    // 增加 API route 的請求體大小限制至 500MB（用於影片上傳）
    proxyClientMaxBodySize: '500mb',
  },
  typescript: {
    // During production build, Next.js will type check your code
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig