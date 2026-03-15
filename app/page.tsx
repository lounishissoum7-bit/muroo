'use client'
// Fichier : app/page.tsx — Mobile-first avec MobileBottomNav

import dynamic from 'next/dynamic'

// Chargement dynamique pour performance mobile (no SSR Three.js)
const HomeHero         = dynamic(() => import('@/components/HomeHero'),         { ssr: false })
const AboutUs          = dynamic(() => import('@/components/AboutUs'),          { ssr: false })
const ServicesGrid     = dynamic(() => import('@/components/ServicesGrid'),     { ssr: false })
const BoutiqueTeaser   = dynamic(() => import('@/components/BoutiqueTeaser'),   { ssr: false })
const SimulationTeaser = dynamic(() => import('@/components/SimulationTeaser'), { ssr: false })
const HomeFooter       = dynamic(() => import('@/components/HomeFooter'),       { ssr: false })
const MobileBottomNav  = dynamic(() => import('@/components/MobileBottomNav'),  { ssr: false })

export default function HomePage() {
  return (
    <>
      {/* Page scrollable avec padding bottom pour la nav */}
      <main
        className="page-scroll"
        style={{ background: '#0D0B08', paddingBottom: 'var(--nav-total)' }}
      >
        <HomeHero />
        <AboutUs />
        <ServicesGrid />
        <BoutiqueTeaser />
        <SimulationTeaser />
        <HomeFooter />
      </main>

      {/* Bottom nav fixe — en dehors du scroll */}
      <MobileBottomNav />
    </>
  )
}
