import React from 'react'
// Fichier : app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

// ── Viewport séparé (Next.js 14+) ────────────────────────────────
export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  viewportFit:        'cover',
  userScalable:       false,
  themeColor:         [
    { media: '(prefers-color-scheme: dark)',  color: '#0D0B08' },
    { media: '(prefers-color-scheme: light)', color: '#F5F0E8' },
  ],
  maximumScale:       1,
}

export const metadata: Metadata = {
  title:       'MURO by L&Y — Décoration Intérieure · Oran',
  description: 'Simulateur 3D de décoration intérieure. Mesurez vos murs, placez vos meubles, obtenez un devis instantané. MURO by L&Y · Oran, Algérie.',
  keywords:    'décoration intérieure, AR, Oran, Algérie, simulation 3D, meuble TV, shiplap, faux marbre, BA13',
  authors:     [{ name: 'MURO by L&Y', url: 'https://muro-lny.vercel.app' }],
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'black-translucent',
    title:          'MURO',
  },
  openGraph: {
    title:       'MURO by L&Y — Décoration Intérieure Oran',
    description: 'Simulateur 3D gratuit. Mesurez, visualisez, commandez.',
    type:        'website',
    locale:      'fr_DZ',
    images:      [{ url: '/images/oran/oran-vue-mer.jpg', width: 550, height: 400 }],
  },
  twitter: {
    card:  'summary_large_image',
    title: 'MURO by L&Y',
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        {/* PWA Apple */}
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-touch-fullscreen" content="yes" />
        {/* Splash screens Apple */}
        <link rel="apple-touch-startup-image" href="/icons/splash.svg" />
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon-192.svg" />
        {/* Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="MURO" />
        {/* Prévenir le zoom double-tap */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className="bg-muro-dark text-muro-text h-full"
        style={{ overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {/* Grain texture luxe */}
        <div className="muro-grain" aria-hidden="true" />
        <div className="relative z-20 h-full">
          {children}
        </div>
      </body>
    </html>
  )
}
