// Fichier : app/simulation/page.tsx
'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useMuroStore } from '@/lib/store'

// Three.js / WebXR = client-only, pas de SSR
const Simulation3D = dynamic(() => import('@/components/Simulation3D'), {
  ssr:     false,
  loading: () => <SimulationSkeleton />,
})

// ═══════════════════════════════════════════════════════
// SKELETON LOADING
// ═══════════════════════════════════════════════════════
function SimulationSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-4"
      style={{ background: 'rgba(13,11,8,0.9)' }}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-icon-pop"
        style={{ background: 'linear-gradient(145deg,#9A7840,#C9A96E)' }}
      >
        📐
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="text-muro-text2 text-sm font-semibold">Chargement Three.js…</div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muro-gold"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// SETUP ROOM MODAL
// ═══════════════════════════════════════════════════════
const ROOM_ICONS = ['🏠','🛋️','🛏️','🍳','🚿','🏢','🌿','📚','🎮','⬜']

function RoomSetupModal({ onDone }: { onDone: () => void }) {
  const [name,    setName]    = useState('')
  const [icon,    setIcon]    = useState('🏠')
  const [ceiling, setCeiling] = useState('2.50')
  const addRoom = useMuroStore(s => s.addRoom)

  const handleCreate = () => {
    const roomName = name.trim() || 'Mon salon'
    addRoom({ name: roomName, icon, ceilingH: parseFloat(ceiling) || 2.5 })
    onDone()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        className="w-full max-w-sm rounded-t-3xl p-6"
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ background: '#1E1A14', border: '1px solid rgba(201,169,110,0.15)' }}
      >
        {/* Handle */}
        <div className="w-9 h-1 rounded-full bg-muro-border2 mx-auto mb-5" />

        <h2 className="font-display font-bold text-xl gold-text mb-1">
          Nouvelle pièce
        </h2>
        <p className="text-muro-text4 text-xs mb-5">
          Configurez la pièce à mesurer
        </p>

        {/* Icônes */}
        <div className="section-title mb-2">Icône</div>
        <div className="flex gap-2 flex-wrap mb-4">
          {ROOM_ICONS.map(ic => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
              style={{
                background: icon === ic ? 'rgba(201,169,110,0.2)' : 'rgba(46,40,32,0.8)',
                border:     `1px solid ${icon === ic ? 'rgba(201,169,110,0.5)' : 'rgba(61,53,40,0.6)'}`,
                transform:  icon === ic ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {ic}
            </button>
          ))}
        </div>

        {/* Nom */}
        <div className="section-title mb-2">Nom de la pièce</div>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex : Salon, Chambre 1…"
          className="w-full px-4 py-3 rounded-xl text-sm text-muro-text bg-muro-dark border border-muro-border2 focus:outline-none focus:border-muro-gold/50 mb-4"
          style={{ fontFamily: 'Raleway, sans-serif' }}
        />

        {/* Hauteur plafond */}
        <div className="section-title mb-2">Hauteur plafond</div>
        <div className="flex gap-2 items-center mb-6">
          <input
            type="number"
            value={ceiling}
            onChange={e => setCeiling(e.target.value)}
            step="0.05"
            min="2"
            max="5"
            className="flex-1 px-4 py-3 rounded-xl text-sm text-muro-text bg-muro-dark border border-muro-border2 focus:outline-none focus:border-muro-gold/50"
          />
          <span className="text-muro-text4 text-sm">mètres</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={onDone}
            className="btn-ghost flex-1 py-3"
          >
            Passer
          </button>
          <button
            onClick={handleCreate}
            className="btn-gold flex-1 py-3"
          >
            ✓ Créer &amp; Mesurer
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════
export default function SimulationPage() {
  const router       = useRouter()
  const rooms        = useMuroStore(s => s.rooms)
  const activeRoomId = useMuroStore(s => s.activeRoomId)
  const [showModal,  setShowModal]  = useState(false)
  const [appReady,   setAppReady]   = useState(false)

  // Montrer le modal si aucune pièce
  useEffect(() => {
    setAppReady(true)
    if (rooms.length === 0) setShowModal(true)
  }, [rooms.length])

  const activeRoom = rooms.find(r => r.id === activeRoomId)

  return (
    <main
      className="fixed inset-0 flex flex-col"
      style={{ background: '#0A0804' }}
    >
      {/* ── TOP BAR ─────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4"
        style={{
          paddingTop:  'max(14px, env(safe-area-inset-top))',
          paddingBottom: 10,
          background:  'rgba(13,11,8,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(201,169,110,0.1)',
        }}
      >
        {/* Retour */}
        <button
          onClick={() => router.push('/')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muro-text3 flex-shrink-0"
          style={{ background: 'rgba(46,40,32,0.9)', border: '1px solid rgba(61,53,40,0.8)' }}
        >
          ←
        </button>

        {/* Titre MURO */}
        <div className="flex-1 min-w-0">
          <div className="font-display font-black gold-text text-lg leading-none tracking-tight">
            MURO
          </div>
          <div className="text-[10px] text-muro-text4 tracking-[2px] uppercase">
            Simulation AR
          </div>
        </div>

        {/* Pièce active badge */}
        {activeRoom && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-muro-text2 flex-shrink-0"
            style={{ background: 'rgba(46,40,32,0.9)', border: '1px solid rgba(61,53,40,0.8)' }}
          >
            <span>{activeRoom.icon}</span>
            <span className="max-w-[80px] truncate">{activeRoom.name}</span>
          </button>
        )}

        {/* Nouvelle pièce */}
        {!activeRoom && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-muro-dark flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#9A7840,#C9A96E)' }}
          >
            + Pièce
          </button>
        )}
      </div>

      {/* ── SIMULATION 3D ────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative">
        {appReady && <Simulation3D />}
      </div>

      {/* ── BOTTOM QUICK ACTIONS ────────────────────────── */}
      <div
        className="flex-shrink-0 flex gap-2 px-4 py-3"
        style={{
          paddingBottom: 'max(12px,env(safe-area-inset-bottom))',
          background:    'rgba(13,11,8,0.95)',
          backdropFilter: 'blur(12px)',
          borderTop:     '1px solid rgba(201,169,110,0.08)',
        }}
      >
        <button
          onClick={() => router.push('/boutique')}
          className="btn-ghost flex-1 py-3 text-[12px]"
        >
          🛍️ Boutique
        </button>
        <button
          onClick={() => router.push('/devis')}
          className="btn-gold flex-1 py-3 text-[12px]"
        >
          📄 Voir le devis
        </button>
      </div>

      {/* ── MODAL SETUP PIÈCE ───────────────────────────── */}
      {showModal && <RoomSetupModal onDone={() => setShowModal(false)} />}
    </main>
  )
}
