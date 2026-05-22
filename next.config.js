// Fichier : next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // ⚠️ Cross-Origin-Embedder-Policy SUPPRIMÉ — bloquait getUserMedia sur Android Chrome
          // Cross-Origin-Opener-Policy en mode permissif pour compatibilité caméra
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Service-Worker-Allowed',     value: '/' },
          {
            key: 'Permissions-Policy',
            // Syntaxe correcte 2026 : autoriser caméra explicitement
            value: 'camera=*, microphone=(), geolocation=()',
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
