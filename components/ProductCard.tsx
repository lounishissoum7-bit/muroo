// Fichier : components/ProductCard.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMuroStore, useActiveRoom } from '@/lib/store'
import type { Product } from '@/lib/store'
import { formatPrice } from '@/lib/products'

interface ProductCardProps {
  product:  Product
  compact?: boolean
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
  const [added,       setAdded]       = useState(false)
  const [showDetail,  setShowDetail]  = useState(false)
  const { addToCart, setSelectedProduct } = useMuroStore()
  const activeRoom = useActiveRoom()

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const surface = activeRoom
      ? estimateSurface(product, activeRoom)
      : undefined

    addToCart(product, 1, surface)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  if (compact) return <CompactCard product={product} onAdd={handleAddToCart} added={added} />

  return (
    <>
      {/* ── CARD ─────────────────────────────────────────── */}
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowDetail(true)}
        className="card-muro cursor-pointer overflow-hidden"
        layout
      >
        {/* Preview */}
        <div
          className="relative flex items-center justify-center"
          style={{ height: 120, background: 'rgba(26,22,16,0.9)' }}
        >
          <span style={{ fontSize: 56 }}>{product.emoji}</span>

          {/* Badge stock */}
          {!product.inStock && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-900/80 text-red-300">
              Rupture
            </div>
          )}

          {/* Badge catégorie */}
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.2)', color: 'var(--gold3)' }}
          >
            {product.category}
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5">
          <h3 className="text-muro-text text-[13px] font-bold leading-snug mb-1 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-muro-text4 text-[11px] leading-snug mb-3 line-clamp-2">
            {product.dimensions}
          </p>

          {/* Prix + bouton */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span
                className="text-[15px] font-black"
                style={{ color: 'var(--gold)' }}
              >
                {formatPrice(product.priceDA)}
              </span>
              <span className="text-muro-text4 text-[10px] ml-1">
                / {product.priceUnit}
              </span>
            </div>

            <motion.button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              whileTap={{ scale: 0.92 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all"
              style={{
                background: added
                  ? 'rgba(16,185,129,0.2)'
                  : 'linear-gradient(135deg,#9A7840,#C9A96E)',
                border: added ? '1px solid rgba(16,185,129,0.4)' : 'none',
              }}
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-green-400"
                  >
                    ✓
                  </motion.span>
                ) : (
                  <motion.span
                    key="plus"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-muro-dark font-black"
                  >
                    +
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── DETAIL MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {showDetail && (
          <ProductDetailModal
            product={product}
            onClose={() => setShowDetail(false)}
            onAddToCart={handleAddToCart}
            onSimulate={() => {
              setSelectedProduct(product)
              setShowDetail(false)
            }}
            added={added}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Compact version (horizontal list) ──────────────────────
function CompactCard({ product, onAdd, added }: {
  product: Product
  onAdd:   () => void
  added:   boolean
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ background: 'rgba(30,26,20,0.9)', border: '1px solid rgba(46,40,32,0.8)' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: 'rgba(26,22,16,0.9)' }}
      >
        {product.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-muro-text text-[12px] font-bold truncate">{product.name}</div>
        <div className="text-muro-text4 text-[10px]">{product.dimensions}</div>
        <div className="text-[12px] font-black mt-0.5" style={{ color: 'var(--gold)' }}>
          {formatPrice(product.priceDA)} / {product.priceUnit}
        </div>
      </div>
      <button
        onClick={onAdd}
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: added ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg,#9A7840,#C9A96E)',
          border:     added ? '1px solid rgba(16,185,129,0.4)' : 'none',
        }}
      >
        <span className={added ? 'text-green-400 text-sm' : 'text-muro-dark font-black text-sm'}>
          {added ? '✓' : '+'}
        </span>
      </button>
    </div>
  )
}

// ── Detail modal ────────────────────────────────────────────
function ProductDetailModal({ product, onClose, onAddToCart, onSimulate, added }: {
  product:      Product
  onClose:      () => void
  onAddToCart:  (e?: React.MouseEvent) => void
  onSimulate:   () => void
  added:        boolean
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        className="w-full max-w-sm rounded-t-3xl overflow-hidden"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#1E1A14', border: '1px solid rgba(201,169,110,0.15)', maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="w-9 h-1 rounded-full bg-muro-border2 mx-auto mt-3 mb-4" />

        {/* Preview grande */}
        <div
          className="mx-4 rounded-2xl flex items-center justify-center mb-4"
          style={{ height: 160, background: 'rgba(26,22,16,0.9)' }}
        >
          <span style={{ fontSize: 80 }}>{product.emoji}</span>
        </div>

        <div className="px-5 pb-6">
          {/* Catégorie */}
          <div
            className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2"
            style={{ background: 'rgba(201,169,110,0.1)', color: 'var(--gold3)' }}
          >
            {product.category}
          </div>

          {/* Nom */}
          <h2 className="text-muro-text font-bold text-xl leading-snug mb-1">
            {product.name}
          </h2>
          <p className="text-muro-text4 text-[11px] mb-3">
            {product.nameAr}
          </p>

          {/* Dimensions */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-[12px]"
            style={{ background: 'rgba(46,40,32,0.8)' }}
          >
            <span className="text-muro-gold">📏</span>
            <span className="text-muro-text3">{product.dimensions}</span>
          </div>

          {/* Description */}
          <p className="text-muro-text3 text-[12px] leading-relaxed mb-4">
            {product.description}
          </p>

          {/* Prix */}
          <div className="flex items-baseline gap-1.5 mb-5">
            <span className="text-2xl font-black" style={{ color: 'var(--gold)' }}>
              {formatPrice(product.priceDA)}
            </span>
            <span className="text-muro-text4 text-sm">/ {product.priceUnit}</span>
          </div>

          {/* Modèle 3D badge */}
          {product.model3d && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-[11px] font-semibold"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}
            >
              🧊 Modèle 3D disponible pour simulation AR
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              onClick={onSimulate}
              className="btn-ghost flex-1 py-3.5 text-[13px]"
            >
              🛋️ Simuler en AR
            </button>
            <button
              onClick={onAddToCart}
              className="btn-gold flex-1 py-3.5 text-[13px]"
            >
              {added ? '✓ Ajouté !' : '+ Devis'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Estimation surface depuis les mesures ───────────────────
function estimateSurface(product: Product, room: NonNullable<ReturnType<typeof useActiveRoom>>): number | undefined {
  if (product.priceUnit !== 'm²') return undefined

  const walls   = room.measurements.filter(m => m.type === 'wall')
  const sorted  = [...walls].sort((a, b) => b.valueM - a.valueM)
  const L       = sorted[0]?.valueM ?? 0
  const D       = sorted[Math.floor(sorted.length / 2)]?.valueM ?? L
  const H       = room.ceilingH
  const perim   = walls.reduce((s, w) => s + w.valueM, 0)

  if (product.category === 'murs') return Math.round(perim * H * 100) / 100
  if (['carrelage','sol'].some(k => product.name.toLowerCase().includes(k))) return Math.round(L * D * 100) / 100

  return Math.round(perim * H * 100) / 100
}
