// Fichier : tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Palette MURO by L&Y ─────────────────────────────
      colors: {
        muro: {
          // Fonds sombres
          dark:    '#0D0B08',
          dark2:   '#13110D',
          dark3:   '#1A1610',
          dark4:   '#221E18',
          // Cards
          card:    '#1E1A14',
          card2:   '#252019',
          // Borders
          border:  '#2E2820',
          border2: '#3D3528',
          // Or — couleur signature
          gold:    '#C9A96E',
          gold2:   '#E8C98A',
          gold3:   '#9A7840',
          gold4:   '#F5E6C8',
          // Sable / clair
          sand:    '#F5EDD8',
          sand2:   '#EAD9B4',
          sand3:   '#D4C096',
          // Textes
          text:    '#FAF6EE',
          text2:   '#E8DFD0',
          text3:   '#B8A898',
          text4:   '#7A6E60',
        },
        // Couleurs fonctionnelles AR
        ar: {
          green:  '#00E676',
          blue:   '#40C4FF',
          yellow: '#FFD740',
          red:    '#FF5252',
        }
      },

      // ── Typographie ───────────────────────────────────────
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['Raleway', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },

      // ── Animations ────────────────────────────────────────
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'gold-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,169,110,0)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(201,169,110,0.15)' },
        },
        'shimmer': {
          from: { backgroundPosition: '200% center' },
          to:   { backgroundPosition: '-200% center' },
        },
        'icon-pop': {
          from: { opacity: '0', transform: 'scale(0.6)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        'fade-up':    'fade-up 0.5s ease both',
        'gold-pulse': 'gold-pulse 2s ease-in-out infinite',
        'shimmer':    'shimmer 3s linear infinite',
        'icon-pop':   'icon-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
      },

      // ── Background patterns ───────────────────────────────
      backgroundImage: {
        'gold-gradient':   'linear-gradient(135deg, #9A7840, #C9A96E, #E8C98A)',
        'gold-gradient-v': 'linear-gradient(180deg, #9A7840, #C9A96E)',
        'dark-gradient':   'linear-gradient(135deg, #0D0B08, #1A1610)',
        'muro-mesh':       'radial-gradient(ellipse 80% 60% at 50% 10%, rgba(201,169,110,0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(201,169,110,0.05) 0%, transparent 60%)',
      },

      // ── Shadows ───────────────────────────────────────────
      boxShadow: {
        'gold':    '0 8px 32px rgba(201,169,110,0.25)',
        'gold-lg': '0 16px 48px rgba(201,169,110,0.30)',
        'card':    '0 2px 16px rgba(0,0,0,0.4)',
        'card-lg': '0 8px 32px rgba(0,0,0,0.5)',
      },

      // ── Border radius ─────────────────────────────────────
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}

export default config
