/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false, // Disable source maps in production for faster loading
  // Image optimization
  images: {
    formats: ['image/webp'], // Use modern image formats
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
    unoptimized: false, // Use optimized images
  },
  // Enable SWC minifier for better performance
  swcMinify: true,
  // Cache optimization
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },
  // Add Content Security Policy headers to allow loading worker from CDN
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' cdnjs.cloudflare.com unpkg.com; connect-src 'self' unpkg.com cdnjs.cloudflare.com; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; worker-src 'self' blob: cdnjs.cloudflare.com unpkg.com;",
          },
          // Add caching headers for better performance
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          }
        ],
      },
    ];
  },
  // Configure webpack to handle PDF.js worker correctly  webpack: (config, { isServer, dev }) => {
    // Webpack optimizations for PDF.js worker
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?(js|mjs)$/,
      type: "asset/resource",
      generator: {
        filename: "static/chunks/[name].[hash][ext]",
      },
    });
    
    // Performance optimizations in production
    if (!dev) {
      // Add TerserPlugin optimizations
      config.optimization.minimize = true;
      config.optimization.minimizer.push(
        new (require('terser-webpack-plugin'))({
          terserOptions: {
            compress: {
              drop_console: true, // Remove console logs in production
            },
            output: {
              comments: false, // Remove comments
            }
          }
        })
      );
      
      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000
      };
    }

    return config;
  },
};

export default nextConfig;
