/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  eslint: {
    dirs: ['src']
  },
  experimental: {
    optimizePackageImports: ['crypto-js', 'tweetnacl', 'elliptic']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false
      };
    }
    return config;
  }
};

export default nextConfig;
