/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: { unoptimized: true },
  outputFileTracingRoot: process.cwd(),
  devIndicators: false,
};
export default nextConfig;
