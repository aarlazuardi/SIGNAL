/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
        ],
      },
    ];
  },
  // Configure webpack to handle PDF.js worker correctly
  webpack: (config, { isServer }) => {
    // Only apply in the browser build
    if (!isServer) {
      config.module.rules.push({
        test: /pdf\.worker\.(min\.)?(js|mjs)$/,
        type: "asset/resource",
        generator: {
          filename: "static/chunks/[name].[hash][ext]",
        },
      });
    }

    return config;
  },
};

export default nextConfig;
