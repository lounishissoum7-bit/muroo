'use client'
// Fichier : components/SimulationTeaser.tsx
// Section teaser simulation 3D — visuel impactant + CTA

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Background3D = dynamic(() => import('./Background3D'), { ssr: false })

const STEPS = [
  { n: '01', title: 'Mesurez',   desc: 'Indiquez vos dimensions ou utilisez la caméra' },
  { n: '02', title: 'Choisissez', desc: 'Parcourez notre catalogue et sélectionnez vos produits' },
  { n: '03', title: 'Visualisez', desc: 'Voyez le résultat en 3D sur la vidéo de votre pièce' },
  { n: '04', title: 'Commandez', desc: 'Générez votre devis et commandez sur WhatsApp' },
]

export default function SimulationTeaser() {
  const router = useRouter()
  const ref    = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} style={{ background: '#F5F0E8', padding: '72px 0', position: 'relative', overflow: 'hidden' }}>

      {/* Déco haut */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: '#13110D', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 40%)' }}/>
      <div style={{ position: 'absolute', top: 58, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,#D4AF77,transparent)', opacity: 0.4 }}/>

      <div style={{ padding: '0 22px', maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 10 }}>

        {/* Preview 3D simulée */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.8 }}
          style={{ borderRadius: 24, overflow: 'hidden', height: 220, background: '#0D0B08', position: 'relative', marginBottom: 32, border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 20px 60px rgba(13,11,8,0.25)' }}>
          <Background3D />
          {/* UI overlay simulée */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 16, pointerEvents: 'none' }}>
            {/* Barre top */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 20, background: 'rgba(13,11,8,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(201,169,110,0.2)', width: 'fit-content' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00E676', animation: 'pulse 1.5s ease-in-out infinite' }}/>
              <span style={{ fontFamily: 'Raleway,sans-serif', fontSize: 10, fontWeight: 700, color: '#00E676' }}>SIMULATION LIVE</span>
            </div>
            {/* Infos overlay */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['5.5m × 4.2m', '🛋️ Salon', '📺 Meuble TV'].map(t => (
                <div key={t} style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(13,11,8,0.8)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#C9A96E', fontFamily: 'Raleway,sans-serif', border: '1px solid rgba(201,169,110,0.2)' }}>{t}</div>
              ))}
            </div>
          </div>
          {/* Badge gratuit */}
          <div style={{ position: 'absolute', top: 16, right: 16, padding: '5px 14px', borderRadius: 99, background: 'linear-gradient(135deg,#9A7840,#C9A96E)', fontSize: 10, fontWeight: 800, color: '#0D0B08', fontFamily: 'Raleway,sans-serif', letterSpacing: '1px' }}>
            100% GRATUIT
          </div>
        </motion.div>

        {/* Titre */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 0.7 }}
          style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ height: 1, width: 28, background: '#9A7840' }}/>
            <span style={{ fontFamily: 'Raleway,sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color: '#9A7840' }}>Simulateur 3D</span>
          </div>
          <h2 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 'clamp(28px,7vw,38px)', fontWeight: 700, color: '#1C1610', lineHeight: 1.1, marginBottom: 12 }}>
            Testez vos idées en 3D<br/>
            <em style={{ color: '#9A7840', fontStyle: 'italic' }}>avant de commander</em>
          </h2>
          <p style={{ fontFamily: 'Raleway,sans-serif', fontSize: 13, color: '#6B5842', lineHeight: 1.7 }}>
            Mesurez votre pièce, placez nos produits et voyez le résultat en temps réel avec la caméra de votre téléphone. Gratuit, sans inscription.
          </p>
        </motion.div>

        {/* Étapes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          {STEPS.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(201,169,110,0.18)', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#9A7840,#C9A96E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 14, fontWeight: 800, color: '#0D0B08' }}>{step.n}</span>
              </div>
              <div>
                <div style={{ fontFamily: 'Raleway,sans-serif', fontSize: 13, fontWeight: 800, color: '#1C1610', marginBottom: 3 }}>{step.title}</div>
                <div style={{ fontFamily: 'Raleway,sans-serif', fontSize: 11, color: '#8A7060', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.button initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.7, duration: 0.5 }}
          onClick={() => router.push('/simulation')}
          style={{ width: '100%', height: 58, borderRadius: 16, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#9A7840,#C9A96E,#E8C98A)', color: '#0D0B08', fontSize: 15, fontWeight: 800, fontFamily: 'Raleway,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 10px 40px rgba(201,169,110,0.35)' }}>
          <span style={{ fontSize: 22 }}>🚀</span>
          Lancer la simulation 3D
        </motion.button>
      </div>
    </section>
  )
}
