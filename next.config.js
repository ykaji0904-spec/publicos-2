/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable WebAssembly for plugin sandbox (Phase 4)
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Mapbox GL JS requires this for production builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  // Optimize for map tile loading via edge caching
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cyberjapandata.gsi.go.jp' },
      { protocol: 'https', hostname: '*.tiles.mapbox.com' },
    ],
  },

  // Headers for COOP/COEP (required for SharedArrayBuffer in WASM workers)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
