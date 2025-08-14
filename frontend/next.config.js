/** @type {import('next').NextConfig} */
const nextConfig = {
  // Re-enable React Strict Mode for better debugging in development
  reactStrictMode: true,
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Image optimization configuration
  images: {
    // Modern image formats for better compression
    formats: ['image/webp', 'image/avif'],
    
    // Responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Remote patterns for external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'placekitten.com',
      },
      {
        protocol: 'https',
        hostname: 'r-mart.s3.us-west-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    
    // Security settings for SVG handling
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Performance optimizations
  experimental: {
    // Optimize CSS loading
    optimizeCss: false,
    // Optimize specific package imports
    optimizePackageImports: ['lucide-react', '@reduxjs/toolkit'],
  },
  
  // Production optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000/api/:path*'
          : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/:path*`, // Proxy API requests to the backend
      },
    ];
  },
};

module.exports = nextConfig; 