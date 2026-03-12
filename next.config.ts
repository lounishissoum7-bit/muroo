// Fichier : next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Headers HTTPS requis pour WebXR + caméra
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // WebXR nécessite ces headers
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy',  value: 'require-corp' },
          // PWA Service Worker scope
          { key: 'Service-Worker-Allowed',        value: '/' },
          // Permissions caméra et capteurs AR
          { key: 'Permissions-Policy',            value: 'camera=*, xr-spatial-tracking=*, gyroscope=*, accelerometer=*' },
        ],
      },
    ]
  },

  // Support fichiers 3D .glb
  webpack(config) {
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
    })
    return config
  },

  // Images externes si besoin
  images: {
    remotePatterns: [],
  },

  // Experimental : React 19 + Turbopack
  experimental: {
    turbo: {},
  },
}

export default nextConfig
