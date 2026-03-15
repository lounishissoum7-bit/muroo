'use client'
// Fichier : components/AboutUs.tsx
// Section "Qui sommes-nous" — deux frères oranais

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STATS = [
  { value: '500+', label: 'Réalisations' },
  { value: '5 ans', label: 'D\'expérience' },
  { value: '4.9★', label: 'Note clients' },
  { value: '48h', label: 'Délai livraison' },
]

export default function AboutUs() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} style={{ background: '#F5F0E8', position: 'relative', overflow: 'hidden', padding: '72px 0' }}>

      {/* Décoration diagonal */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: '#0D0B08', clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 100%)' }}/>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: '#0D0B08', clipPath: 'polygon(0 60%, 100% 0, 100% 100%, 0 100%)' }}/>

      {/* Filet doré haut */}
      <div style={{ position: 'absolute', top: 58, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,#D4AF77,transparent)', opacity: 0.5 }}/>

      <div style={{ padding: '0 22px', maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 10 }}>

        {/* Eyebrow */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ height: 1, width: 32, background: '#C9A96E' }}/>
          <span style={{ fontFamily: 'Raleway,sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color: '#9A7840' }}>Notre histoire</span>
        </motion.div>

        {/* Titre */}
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1, duration: 0.7 }}
          style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 'clamp(32px,8vw,44px)', fontWeight: 700, lineHeight: 1.1, color: '#1C1610', marginBottom: 20 }}>
          Deux frères,<br/>
          <em style={{ color: '#9A7840', fontStyle: 'italic' }}>une passion</em>
        </motion.h2>

        {/* Portrait illustratif — initiales stylisées */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.2, duration: 0.7 }}
          style={{ marginBottom: 24, borderRadius: 24, overflow: 'hidden', position: 'relative', height: 200, background: 'linear-gradient(135deg,#1C1610,#2A2118)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(201,169,110,0.2)' }}>
          {/* Initiales déco */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {['L', 'Y'].map((letter, i) => (
              <div key={letter} style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(145deg,#9A7840,#C9A96E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(201,169,110,0.3)' }}>
                <span style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 40, fontWeight: 700, color: '#0D0B08' }}>{letter}</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#C9A96E,transparent)' }}/>
          <div style={{ position: 'absolute', top: 12, right: 14, fontFamily: 'Raleway,sans-serif', fontSize: 9, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(201,169,110,0.6)' }}>Muro by L&Y</div>
        </motion.div>

        {/* Texte */}
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.6 }}
          style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 20, fontStyle: 'italic', color: '#3A2E22', lineHeight: 1.65, marginBottom: 16, fontWeight: 600 }}>
          "Deux frères passionnés qui transforment les intérieurs à Oran et dans toute la wilaya."
        </motion.p>

        <motion.p initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4, duration: 0.6 }}
          style={{ fontFamily: 'Raleway,sans-serif', fontSize: 13, color: '#6B5842', lineHeight: 1.75, marginBottom: 32 }}>
          Lounis & Y ont fondé MURO avec une vision simple : rendre la décoration intérieure de luxe accessible à chaque famille oranaise. Chaque réalisation est pensée, mesurée et fabriquée localement avec les meilleurs matériaux.
        </motion.p>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5, duration: 0.6 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {STATS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
              style={{ padding: '16px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(201,169,110,0.2)', backdropFilter: 'blur(8px)', textAlign: 'center' }}>
              <div style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 26, fontWeight: 800, color: '#9A7840', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'Raleway,sans-serif', fontSize: 10, fontWeight: 700, color: '#8A7060', marginTop: 4, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
