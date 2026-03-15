'use client'
// Fichier : app/page.tsx — Home page avec diaporama Oran 4K + CTAs

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartTotal } from '@/lib/store'
import { useState, useEffect, useCallback } from 'react'

// ── Photos d'Oran — diaporama 2 secondes ─────────────────────────
const ORAN_SLIDES = [
  { src: '/images/oran/oran-vue-mer.jpg',         caption: 'Vue panoramique · Port d\'Oran' },
  { src: '/images/oran/oran-cathedrale.jpg',       caption: 'Place du 1er Novembre · Centre-ville' },
  { src: '/images/oran/oran-front-de-mer.jpg',     caption: 'Front de mer · Boulevard Millenium' },
  { src: '/images/oran/oran-theatre.jpg',          caption: 'Théâtre Régional · Place Khemisti' },
  { src: '/images/oran/oran-boulevard-soir.jpg',   caption: 'Oran la nuit · La Corniche' },
]

const FEATURES = [
  { icon: '📐', title: 'Mesure AR',     desc: 'Murs, portes, fenêtres en 2 taps' },
  { icon: '🛋️', title: 'Simulation 3D', desc: 'Placez vos meubles avant achat' },
  { icon: '🧱', title: 'Boutique',      desc: 'Catalogue complet, prix en DA' },
  { icon: '📄', title: 'Devis PDF',     desc: 'WhatsApp en 1 clic' },
]

// ── Diaporama component ────────────────────────────────────────────
function OranSlideshow() {
  const [idx,     setIdx]     = useState(0)
  const [visible, setVisible] = useState(true)

  const next = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      setIdx(i => (i + 1) % ORAN_SLIDES.length)
      setVisible(true)
    }, 400)
  }, [])

  useEffect(() => {
    const t = setInterval(next, 2000)
    return () => clearInterval(t)
  }, [next])

  const slide = ORAN_SLIDES[idx]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      overflow: 'hidden',
    }}>
      {/* Image avec transition fade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage:    `url(${slide.src})`,
            backgroundSize:     'cover',
            backgroundPosition: 'center',
          }}
        />
      </AnimatePresence>

      {/* Overlay sombre luxe — garde la lisibilité du contenu */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          linear-gradient(to bottom,
            rgba(13,11,8,0.72) 0%,
            rgba(13,11,8,0.45) 40%,
            rgba(13,11,8,0.65) 75%,
            rgba(13,11,8,0.90) 100%
          )
        `,
      }}/>

      {/* Caption ville */}
      <motion.div
        key={`cap-${idx}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          position: 'absolute', bottom: 16, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 99,
          background: 'rgba(13,11,8,0.65)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(201,169,110,0.2)',
        }}>
        <span style={{ fontSize: 9, color: '#9A7840', fontWeight: 800, fontFamily: 'Raleway,sans-serif', letterSpacing: '1.5px', textTransform: 'uppercase' }}>📍</span>
        <span style={{ fontSize: 10, color: '#B8A898', fontWeight: 600, fontFamily: 'Raleway,sans-serif', whiteSpace: 'nowrap' }}>{slide.caption}</span>
      </motion.div>

      {/* Indicateurs de slides */}
      <div style={{
        position: 'absolute', bottom: 44, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 5,
      }}>
        {ORAN_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setVisible(false); setTimeout(() => { setIdx(i); setVisible(true) }, 200) }}
            style={{
              width: i === idx ? 18 : 5, height: 5, borderRadius: 99,
              border: 'none', cursor: 'pointer', padding: 0,
              background: i === idx ? '#C9A96E' : 'rgba(201,169,110,0.3)',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function HomePage() {
  const router  = useRouter()
  const { count } = useCartTotal()

  return (
    <main className="relative flex flex-col items-center min-h-screen overflow-y-auto px-6 pb-10"
      style={{ background: '#0D0B08' }}>

      {/* ── Diaporama Oran en arrière-plan ── */}
      <OranSlideshow />

      {/* ── Grain luxe ── */}
      <div className="muro-grain" aria-hidden />

      {/* ── Contenu principal ── */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm pt-16">

        {/* Logo MURO */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-6"
        >
          <div
            className="w-24 h-24 rounded-[28px] flex items-center justify-center shadow-gold-lg"
            style={{ background: 'linear-gradient(145deg, #9A7840, #C9A96E, #E8C98A)' }}
          >
            <svg viewBox="0 0 54 54" fill="none" className="w-14 h-14">
              <path d="M8 42L8 14L18 30L27 14L27 42" stroke="#0D0B08" strokeWidth="3.2"
                strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="34" y1="20" x2="48" y2="20" stroke="rgba(13,11,8,0.5)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="34" y1="27" x2="48" y2="27" stroke="rgba(13,11,8,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="34" y1="34" x2="48" y2="34" stroke="rgba(13,11,8,0.5)" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="41" cy="12" r="3" fill="rgba(13,11,8,0.7)"/>
              <circle cx="41" cy="12" r="6" stroke="rgba(13,11,8,0.25)" strokeWidth="1"/>
            </svg>
          </div>
        </motion.div>

        {/* Titre */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center mb-2"
        >
          <h1
            className="font-display font-black gold-text leading-none"
            style={{ fontSize: 'clamp(42px, 14vw, 56px)', letterSpacing: '-2px' }}
          >
            MURO
          </h1>
          <p className="text-[11px] font-semibold tracking-[4px] uppercase text-muro-text4 mt-1">
            by L &amp; Y · Oran
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-muro-text3 text-[13px] text-center leading-relaxed mb-8 max-w-[260px]"
        >
          Décoration intérieure · Simulation AR · Mesure &amp; Plans 2D/3D
        </motion.p>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="grid grid-cols-2 gap-2.5 w-full mb-8"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
              style={{
                borderRadius: 16, padding: 16,
                background: 'rgba(13,11,8,0.72)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(201,169,110,0.18)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-2.5"
                style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.2)' }}
              >
                {f.icon}
              </div>
              <div className="text-[12px] font-bold text-muro-text mb-0.5">{f.title}</div>
              <div className="text-[10px] text-muro-text4 leading-snug">{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="w-full space-y-3"
        >
          <button
            onClick={() => router.push('/simulation')}
            className="btn-gold w-full h-16 text-base rounded-2xl"
            style={{ fontSize: '15px', fontWeight: 800 }}
          >
            <span className="text-xl">📷</span>
            Lancer la Simulation AR
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => router.push('/boutique')}
              style={{ height: 48, borderRadius: 14, border: '1px solid rgba(201,169,110,0.25)', background: 'rgba(13,11,8,0.72)', backdropFilter: 'blur(12px)', color: '#B8A898', fontSize: 13, fontWeight: 700, fontFamily: 'Raleway,sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              🛍️ Boutique
            </button>
            <button onClick={() => router.push('/devis')}
              style={{ height: 48, borderRadius: 14, border: '1px solid rgba(201,169,110,0.25)', background: 'rgba(13,11,8,0.72)', backdropFilter: 'blur(12px)', color: '#B8A898', fontSize: 13, fontWeight: 700, fontFamily: 'Raleway,sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative' }}>
              📄 Devis
              {count > 0 && (
                <span
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#C9A96E', color: '#0D0B08', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Badge ville */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <div style={{ height: 1, width: 40, background: 'rgba(201,169,110,0.25)' }}/>
          <span style={{ fontSize: 10, color: '#7A6E60', fontFamily: 'Raleway,sans-serif', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Oran · Algérie · 2026
          </span>
          <div style={{ height: 1, width: 40, background: 'rgba(201,169,110,0.25)' }}/>
        </motion.div>
      </div>
    </main>
  )
}
