// Fichier : app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       'MURO by L&Y — Décoration Intérieure AR · Oran',
  description: 'Simulateur AR de décoration intérieure. Mesurez vos murs, placez vos meubles en 3D, obtenez un devis instantané. MURO by L&Y · Oran, Algérie.',
  keywords:    'décoration intérieure, AR, Oran, Algérie, simulation 3D, meuble TV, shiplap, faux marbre, BA13',
  authors:     [{ name: 'MURO by L&Y', url: 'https://muro-lny.vercel.app' }],
  manifest:    '/manifest.json',
  themeColor:  '#0D0B08',
  viewport:    'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no',
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'black-translucent',
    title:          'MURO by L&Y',
  },
  openGraph: {
    title:       'MURO by L&Y — Décoration Intérieure AR',
    description: 'Simulateur AR de décoration intérieure. Mesurez, visualisez, commandez.',
    type:        'website',
    locale:      'fr_DZ',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
      </head>
      <body className="bg-muro-dark text-muro-text overflow-hidden h-screen">
        {/* Filigrane MURO */}
        <div className="muro-watermark" aria-hidden="true" />
        {/* Grain texture luxe */}
        <div className="muro-grain" aria-hidden="true" />
        <div className="relative z-20 h-full">
          {children}
        </div>
      </body>
    </html>
  )
}
