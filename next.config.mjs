/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false, // 关闭左下角 N 按钮
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
