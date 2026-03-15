// Fichier : components/BoutiqueHero.tsx
'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

const Background3D = dynamic(() => import('./Background3D'), { ssr: false })

const STATS = [
  { value: '500+', label: 'Réalisations à Oran' },
  { value: '4.9★', label: 'Note clients'        },
  { value: '48h',  label: 'Délai livraison'     },
]

export default function BoutiqueHero({ onScrollToProducts }: { onScrollToProducts: () => void }) {
  const router = useRouter()

  return (
    <section style={{
      position: 'relative', overflow: 'hidden', minHeight: '92vw', maxHeight: 580,
      background: 'linear-gradient(155deg, #FAF7F2 0%, #F0E8D8 45%, #E8DCC8 100%)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* Fond 3D */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.7 }}>
        <Background3D />
      </div>

      {/* Grain texture luxe */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.035, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '128px',
      }} />

      {/* Diagonale décorative */}
      <div style={{
        position: 'absolute', bottom: -1, left: 0, right: 0, height: 80,
        background: '#FDFAF5',
        clipPath: 'polygon(0 60%, 100% 0, 100% 100%, 0 100%)',
      }} />

      {/* Filet doré diagonal */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.18 }}
        viewBox="0 0 400 580" preserveAspectRatio="xMidYMid slice">
        <line x1="0" y1="420" x2="400" y2="60" stroke="#D4AF77" strokeWidth="0.8"/>
        <line x1="0" y1="480" x2="400" y2="120" stroke="#C9A96E" strokeWidth="0.4"/>
        <line x1="380" y1="0" x2="20" y2="560" stroke="#D4AF77" strokeWidth="0.5"/>
      </svg>

      {/* Contenu */}
      <div style={{ position: 'relative', zIndex: 10, padding: '0 22px 56px' }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 18,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(212,175,119,0.15)', border: '1px solid rgba(212,175,119,0.4)',
            backdropFilter: 'blur(8px)',
          }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF77', animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', color: '#9A7840', textTransform: 'uppercase', fontFamily: 'Raleway,sans-serif' }}>
            Oran · Livraison & Pose
          </span>
        </motion.div>

        {/* Titre */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 'clamp(34px, 9vw, 52px)',
            fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.5px',
            color: '#1C1610', marginBottom: 10,
          }}>
          Transformez votre<br/>
          <em style={{ color: '#9A7840', fontStyle: 'italic' }}>intérieur</em> en 1 clic
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}
          style={{ fontSize: 13, color: '#5A4E42', lineHeight: 1.65, marginBottom: 24, maxWidth: 320,
            fontFamily: 'Raleway,sans-serif', fontWeight: 500 }}>
          Meubles sur mesure, faux marbre, shiplap, placo déco. Simulez chez vous, commandez en toute confiance.
        </motion.p>

        {/* Boutons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onScrollToProducts}
            style={{
              height: 48, padding: '0 24px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #9A7840, #D4AF77, #C9A96E)',
              color: '#1C1610', fontSize: 13, fontWeight: 800, fontFamily: 'Raleway,sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 6px 24px rgba(212,175,119,0.38)',
            }}>
            <span style={{ fontSize: 18 }}>🛒</span> Voir la boutique
          </button>
          <button onClick={() => router.push('/simulation')}
            style={{
              height: 48, padding: '0 22px', borderRadius: 14, cursor: 'pointer',
              border: '1.5px solid rgba(154,120,64,0.35)',
              background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)',
              color: '#6B5030', fontSize: 13, fontWeight: 700, fontFamily: 'Raleway,sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
            <span style={{ fontSize: 18 }}>📐</span> Essayer en 3D
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }}
          style={{ display: 'flex', gap: 0, marginTop: 28, borderTop: '1px solid rgba(154,120,64,0.2)', paddingTop: 20 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(154,120,64,0.18)' : 'none',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#9A7840', fontFamily: '"Cormorant Garamond",Georgia,serif', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#8A7A68', marginTop: 4, fontFamily: 'Raleway,sans-serif', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
