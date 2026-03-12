// Fichier : app/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useCartTotal } from '@/lib/store'

const FEATURES = [
  { icon: '📐', title: 'Mesure AR',     desc: 'Murs, portes, fenêtres\nen 2 taps' },
  { icon: '🛋️', title: 'Simulation 3D', desc: 'Placez vos meubles\navant d'acheter' },
  { icon: '🧱', title: 'Boutique',      desc: 'Catalogue complet\nprix en DA' },
  { icon: '📄', title: 'Devis PDF',     desc: 'WhatsApp en\n1 clic' },
]

export default function HomePage() {
  const router  = useRouter()
  const { count } = useCartTotal()

  return (
    <main className="relative flex flex-col items-center min-h-screen overflow-y-auto bg-muro-dark px-6 pb-10">

      {/* ── Fond mesh or ───────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 50% 0%,   rgba(201,169,110,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 5%  85%,  rgba(201,169,110,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 35% at 95% 70%,  rgba(201,169,110,0.05) 0%, transparent 60%)
          `,
        }}
      />

      {/* ── Filigrane MURO ─────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none select-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <span
          className="font-display font-black text-muro-gold/[0.028] whitespace-nowrap"
          style={{ fontSize: 'clamp(100px,32vw,200px)', letterSpacing: '-6px', transform: 'rotate(-18deg)' }}
        >
          MURO
        </span>
      </div>

      {/* ── Contenu ────────────────────────────────────── */}
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
            {/* M lettermark SVG */}
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
          className="text-muro-text3 text-[13px] text-center leading-relaxed mb-10 max-w-[260px]"
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
              className="card-muro p-4"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-2.5"
                style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.15)' }}
              >
                {f.icon}
              </div>
              <div className="text-[12px] font-bold text-muro-text mb-0.5">{f.title}</div>
              <div className="text-[10px] text-muro-text4 leading-snug whitespace-pre-line">{f.desc}</div>
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
            <button onClick={() => router.push('/boutique')} className="btn-ghost h-12 text-[13px]">
              🛍️ Boutique
            </button>
            <button onClick={() => router.push('/devis')} className="btn-ghost h-12 text-[13px] relative">
              📄 Devis
              {count > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-muro-dark"
                  style={{ background: 'var(--gold)' }}
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-muro-text4 text-[10px] text-center mt-8 leading-relaxed"
        >
          Senior Full-Stack · Next.js 15 · Three.js · WebXR<br/>
          Déployé sur Vercel · 100% PWA offline
        </motion.p>
      </div>
    </main>
  )
}
