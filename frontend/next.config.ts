/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export for Cloudflare Pages
  images: {
    unoptimized: true, // Cloudflare Pages doesn't support Next.js image optimization
  },
  trailingSlash: true, // Better compatibility with static hosting
  distDir: 'out', // Output directory for static export
};

module.exports = nextConfig