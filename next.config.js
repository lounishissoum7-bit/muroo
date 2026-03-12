// Fichier : next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy',  value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Service-Worker-Allowed',       value: '/' },
          {
            key: 'Permissions-Policy',
            value: 'camera=*, xr-spatial-tracking=*, gyroscope=*, accelerometer=*',
          },
        ],
      },
    ]
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
    })
    return config
  },

  images: {
    remotePatterns: [],
  },
}

module.exports = nextConfig
