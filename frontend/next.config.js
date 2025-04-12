/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure async storage for better local storage compatibility
  reactStrictMode: true,
  images: {
    domains: ['example.com', 'placehold.co', 'placekitten.com'], // Add your image domains here
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*', // Proxy API requests to the backend
      },
    ];
  },
};

module.exports = nextConfig; 