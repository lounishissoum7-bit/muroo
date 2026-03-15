'use client'
// Fichier : components/HomeHero.tsx
// Hero section — diaporama Oran 4s + titre cinématique + CTAs

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

const SLIDES = [
  { src: '/images/oran/oran-vue-mer.jpg',       caption: 'Port d\'Oran', sub: 'Vue panoramique' },
  { src: '/images/oran/oran-theatre.jpg',        caption: 'Théâtre Régional', sub: 'Place Khemisti' },
  { src: '/images/oran/oran-front-de-mer.jpg',   caption: 'Front de Mer', sub: 'Boulevard Millenium' },
  { src: '/images/oran/oran-cathedrale.jpg',     caption: 'Centre-Ville', sub: 'Place du 1ᵉʳ Novembre' },
  { src: '/images/oran/oran-boulevard-soir.jpg', caption: 'La Corniche', sub: 'Oran la nuit' },
]

export default function HomeHero() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)

  const advance = useCallback(() =>
    setIdx(i => (i + 1) % SLIDES.length)
  , [])

  useEffect(() => {
    const t = setInterval(advance, 4000)
    return () => clearInterval(t)
  }, [advance])

  return (
    <section style={{ position: 'relative', height: '100svh', minHeight: 600, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>

      {/* ── DIAPORAMA FOND ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage:    `url(${SLIDES[idx].src})`,
            backgroundSize:     'cover',
            backgroundPosition: 'center 40%',
          }}
        />
      </AnimatePresence>

      {/* ── OVERLAYS ── */}
      {/* Dégradé principal */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(13,11,8,0.55) 0%, rgba(13,11,8,0.2) 35%, rgba(13,11,8,0.75) 70%, rgba(13,11,8,0.97) 100%)' }}/>
      {/* Vignettte gauche */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to right, rgba(13,11,8,0.4) 0%, transparent 50%)' }}/>
      {/* Grain */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, opacity: 0.035, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '128px' }}/>

      {/* ── CONTENU ── */}
      <div style={{ position: 'relative', zIndex: 10, padding: '0 22px', paddingBottom: 'max(40px,env(safe-area-inset-bottom,0px))', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18, padding: '5px 14px', borderRadius: 99, background: 'rgba(201,169,110,0.14)', border: '1px solid rgba(201,169,110,0.3)', backdropFilter: 'blur(10px)', width: 'fit-content' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A96E', animation: 'pulse 2s ease-in-out infinite' }}/>
          <span style={{ fontFamily: 'Raleway,sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#C9A96E' }}>Oran · Algérie · 2026</span>
        </motion.div>

        {/* Titre principal */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }}>
          <h1 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 'clamp(44px,11vw,72px)', fontWeight: 700, lineHeight: 1.0, letterSpacing: '-1px', color: '#FAF6EE', margin: 0 }}>
            Votre mur,<br/>
            <em style={{ color: '#C9A96E', fontStyle: 'italic' }}>notre passion</em>
          </h1>
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
          style={{ fontFamily: 'Raleway,sans-serif', fontSize: 14, fontWeight: 500, color: 'rgba(250,246,238,0.7)', lineHeight: 1.65, marginTop: 14, marginBottom: 28, maxWidth: 320 }}>
          Décoration intérieure sur mesure, simulation 3D et devis instantané.<br/>
          Faux marbre, shiplap, meubles TV — fabriqués à Oran.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => router.push('/simulation')}
            style={{ height: 56, borderRadius: 16, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#9A7840,#C9A96E,#E8C98A)', color: '#0D0B08', fontSize: 15, fontWeight: 800, fontFamily: 'Raleway,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 32px rgba(201,169,110,0.4)' }}>
            <span style={{ fontSize: 20 }}>✦</span>
            Commencer ma simulation gratuite
          </button>
          <button onClick={() => router.push('/boutique')}
            style={{ height: 50, borderRadius: 16, border: '1.5px solid rgba(201,169,110,0.35)', background: 'rgba(13,11,8,0.6)', backdropFilter: 'blur(12px)', cursor: 'pointer', color: '#E8C98A', fontSize: 14, fontWeight: 700, fontFamily: 'Raleway,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛍️</span>
            Découvrir la boutique
          </button>
        </motion.div>

        {/* Caption + indicateurs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
          <motion.div key={`cap-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#9A7840', fontFamily: 'Raleway,sans-serif', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{SLIDES[idx].sub}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(250,246,238,0.55)', fontFamily: 'Raleway,sans-serif' }}>{SLIDES[idx].caption}</span>
          </motion.div>
          <div style={{ display: 'flex', gap: 6 }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0, background: i === idx ? '#C9A96E' : 'rgba(201,169,110,0.3)', transition: 'all 0.35s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Indicateur de scroll ── */}
      <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
        style={{ position: 'absolute', bottom: 'max(12px,env(safe-area-inset-bottom,0px))', left: '50%', transform: 'translateX(-50%)', zIndex: 20, opacity: 0.4 }}>
        <svg width="20" height="30" viewBox="0 0 20 30" fill="none">
          <rect x="1" y="1" width="18" height="28" rx="9" stroke="#C9A96E" strokeWidth="1.5"/>
          <motion.rect x="8" y="6" width="4" height="8" rx="2" fill="#C9A96E"
            animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity }}/>
        </svg>
      </motion.div>
    </section>
  )
}
