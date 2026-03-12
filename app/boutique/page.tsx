// Fichier : app/boutique/page.tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ProductCard from '@/components/ProductCard'
import { PRODUCTS, CATEGORIES, formatPrice } from '@/lib/products'
import { useCartTotal } from '@/lib/store'

export default function BoutiquePage() {
  const router     = useRouter()
  const [cat,  setCat]  = useState<string>('all')
  const [search, setSearch] = useState('')
  const { count, total } = useCartTotal()

  const filtered = useMemo(() =>
    PRODUCTS.filter(p => {
      const matchCat  = cat === 'all' || p.category === cat
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    }),
    [cat, search]
  )

  return (
    <main
      className="fixed inset-0 flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      {/* ── TOP BAR ──────────────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{
          paddingTop:    'max(14px,env(safe-area-inset-top))',
          paddingBottom: 0,
          background:    'rgba(13,11,8,0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom:  '1px solid rgba(201,169,110,0.1)',
        }}
      >
        {/* Row 1: nav + titre */}
        <div className="flex items-center gap-3 px-4 pb-3">
          <button
            onClick={() => router.push('/')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muro-text3 flex-shrink-0"
            style={{ background: 'rgba(46,40,32,0.9)', border: '1px solid rgba(61,53,40,0.8)' }}
          >
            ←
          </button>

          <div className="flex-1">
            <h1 className="font-display font-black gold-text text-xl leading-none">
              Boutique
            </h1>
            <p className="text-[10px] text-muro-text4 tracking-[2px] uppercase mt-0.5">
              MURO by L&amp;Y · Oran
            </p>
          </div>

          {/* Panier */}
          <button
            onClick={() => router.push('/devis')}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold"
            style={{
              background:  count > 0 ? 'linear-gradient(135deg,#9A7840,#C9A96E)' : 'rgba(46,40,32,0.9)',
              color:       count > 0 ? '#0D0B08' : 'var(--text3)',
              border:      count > 0 ? 'none' : '1px solid rgba(61,53,40,0.8)',
            }}
          >
            🛒
            {count > 0 && (
              <span className="font-black">{count}</span>
            )}
          </button>
        </div>

        {/* Row 2: search */}
        <div className="px-4 pb-3">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(30,26,20,0.9)', border: '1px solid rgba(46,40,32,0.8)' }}
          >
            <span className="text-muro-text4 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Rechercher un produit…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-muro-text text-[13px] placeholder-muro-text4 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muro-text4 text-sm">✕</button>
            )}
          </div>
        </div>

        {/* Row 3: category tabs */}
        <div className="flex gap-0 overflow-x-auto scrollbar-hide px-2 pb-0">
          <TabBtn
            active={cat === 'all'}
            onClick={() => setCat('all')}
            label="Tout"
            emoji="✨"
            count={PRODUCTS.length}
          />
          {CATEGORIES.map(c => (
            <TabBtn
              key={c.id}
              active={cat === c.id}
              onClick={() => setCat(c.id)}
              label={c.label}
              emoji={c.emoji}
              count={PRODUCTS.filter(p => p.category === c.id).length}
            />
          ))}
        </div>
      </div>

      {/* ── PRODUITS ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-60 gap-3"
            >
              <span className="text-5xl">🔍</span>
              <p className="text-muro-text3 text-sm">Aucun produit trouvé</p>
            </motion.div>
          ) : (
            <motion.div
              key={cat + search}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-2.5 p-4"
            >
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM DEVIS BAR (si panier non vide) ────────── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="flex-shrink-0 px-4 py-3"
            style={{
              paddingBottom: 'max(16px,env(safe-area-inset-bottom))',
              background:    'rgba(13,11,8,0.97)',
              backdropFilter: 'blur(12px)',
              borderTop:     '1px solid rgba(201,169,110,0.15)',
            }}
          >
            <button
              onClick={() => router.push('/devis')}
              className="btn-gold w-full h-14"
            >
              <span className="text-lg">📄</span>
              <span className="flex-1 text-left font-bold text-[14px]">
                Voir le devis ({count} article{count > 1 ? 's' : ''})
              </span>
              <span className="font-black text-[14px]">{formatPrice(total)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

// ── Tab button ──────────────────────────────────────────────
function TabBtn({ active, onClick, label, emoji, count }: {
  active:  boolean
  onClick: () => void
  label:   string
  emoji:   string
  count:   number
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex items-center gap-1 px-3.5 py-2.5 text-[11px] font-bold tracking-wide transition-all"
      style={{
        color:        active ? 'var(--gold)' : 'var(--text4)',
        borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
        whiteSpace:   'nowrap',
      }}
    >
      <span>{emoji}</span>
      {label}
      <span
        className="text-[9px] px-1 rounded-full ml-0.5"
        style={{
          background: active ? 'rgba(201,169,110,0.15)' : 'rgba(46,40,32,0.8)',
          color:      active ? 'var(--gold3)' : 'var(--text4)',
        }}
      >
        {count}
      </span>
    </button>
  )
}
