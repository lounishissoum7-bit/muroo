// Fichier : app/devis/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import DevisCard from '@/components/DevisPDF'
import { useDevis } from '@/lib/calculateDevis'
import { useCartTotal, useMuroStore } from '@/lib/store'
import { formatPrice } from '@/lib/products'

export default function DevisPage() {
  const router       = useRouter()
  const devis        = useDevis()
  const { count, total, subtotal, tva } = useCartTotal()
  const activeRoomId = useMuroStore(s => s.activeRoomId)
  const rooms        = useMuroStore(s => s.rooms)
  const setActiveRoom = useMuroStore(s => s.setActiveRoom)
  const activeRoom   = rooms.find(r => r.id === activeRoomId)

  return (
    <main
      className="fixed inset-0 flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      {/* ── TOP BAR ──────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4"
        style={{
          paddingTop:    'max(14px,env(safe-area-inset-top))',
          paddingBottom: 12,
          background:    'rgba(13,11,8,0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom:  '1px solid rgba(201,169,110,0.1)',
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muro-text3 flex-shrink-0"
          style={{ background: 'rgba(46,40,32,0.9)', border: '1px solid rgba(61,53,40,0.8)' }}
        >
          ←
        </button>

        <div className="flex-1">
          <h1 className="font-display font-black gold-text text-xl leading-none">Devis</h1>
          <p className="text-[10px] text-muro-text4 tracking-[2px] uppercase mt-0.5">
            MURO by L&amp;Y · Oran
          </p>
        </div>

        {/* Badge total live */}
        {count > 0 && (
          <div
            className="px-3 py-1.5 rounded-xl text-[12px] font-black flex-shrink-0"
            style={{ background: 'rgba(201,169,110,0.12)', color: 'var(--gold)', border: '1px solid rgba(201,169,110,0.2)' }}
          >
            {formatPrice(total)}
          </div>
        )}
      </div>

      {/* ── ROOM SELECTOR (si plusieurs pièces) ──────────── */}
      {rooms.length > 1 && (
        <div
          className="flex-shrink-0 flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide"
          style={{ borderBottom: '1px solid rgba(46,40,32,0.6)' }}
        >
          {rooms.map(r => (
            <button
              key={r.id}
              onClick={() => setActiveRoom(r.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
              style={{
                background:  r.id === activeRoomId ? 'rgba(201,169,110,0.15)' : 'rgba(30,26,20,0.9)',
                border:      `1px solid ${r.id === activeRoomId ? 'rgba(201,169,110,0.4)' : 'rgba(46,40,32,0.8)'}`,
                color:       r.id === activeRoomId ? 'var(--gold2)' : 'var(--text3)',
              }}
            >
              <span>{r.icon}</span>
              <span>{r.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── CONTENU DEVIS ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain pt-4"
        style={{ paddingBottom: 'max(20px,env(safe-area-inset-bottom))' }}>

        {/* Header résumé */}
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-4 p-4 rounded-2xl"
            style={{
              background:  'linear-gradient(135deg, rgba(154,120,64,0.12), rgba(201,169,110,0.06))',
              border:      '1px solid rgba(201,169,110,0.2)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(145deg,#9A7840,#C9A96E)' }}
              >
                📄
              </div>
              <div>
                <div className="font-display font-bold text-[16px] gold-text">
                  Devis MURO
                </div>
                <div className="text-muro-text4 text-[11px]">
                  {activeRoom ? `${activeRoom.icon} ${activeRoom.name}` : 'Pièce non définie'}
                  {' · '}{devis.date}
                </div>
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Articles',  count.toString()],
                ['HT',        formatPrice(subtotal)],
                ['TVA 19%',   formatPrice(tva)],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="text-center py-2 rounded-xl"
                  style={{ background: 'rgba(13,11,8,0.5)' }}
                >
                  <div className="text-muro-text4 text-[9px] uppercase tracking-wider mb-0.5">{k}</div>
                  <div className="text-muro-text text-[11px] font-bold">{v}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Contenu principal */}
        <DevisCard />

        {/* Liens rapides si panier vide */}
        {count === 0 && (
          <div className="flex flex-col gap-2.5 px-4 mt-4">
            <button
              onClick={() => router.push('/simulation')}
              className="btn-gold w-full h-14"
            >
              <span className="text-xl">📐</span>
              Mesurer et simuler
            </button>
            <button
              onClick={() => router.push('/boutique')}
              className="btn-ghost w-full h-12"
            >
              🛍️ Parcourir la boutique
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
