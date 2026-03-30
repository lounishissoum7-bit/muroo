'use client'
import React from 'react'
// Fichier : components/BoutiqueTeaser.tsx
// Teaser boutique — produits réels depuis lib/products.ts + navigation connectée

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { PRODUCTS, formatPrice } from '@/lib/products'
import { useMuroStore } from '@/lib/store'
import type { Product } from '@/lib/store'

// ── Produits réels depuis le catalogue ──────────────────────────
const BS_IDS = [
  'porte-secrete-shiplap-gris',
  'faux-shiplap-bois-lamelles',
  'led-rgb-acoustique-tv',
  'tv-simple-bois-noir',
]
const BESTSELLERS = BS_IDS.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean) as Product[]

// ── Badge config ─────────────────────────────────────────────────
const BADGE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  'porte-secrete-shiplap-gris': { bg: 'linear-gradient(135deg,#1C1C2E,#4A4A6A)', color: '#E8C98A', label: '👁 Service Discret' },
  'porte-wpc-noyer':            { bg: 'linear-gradient(135deg,#9A7840,#D4AF77)', color: '#0D0B08', label: '✦ Nouveau' },
  'faux-shiplap-bois-lamelles': { bg: 'rgba(139,92,246,0.15)',                  color: '#A78BFA', label: '✦ Nouveau' },
  'led-rgb-acoustique-tv':      { bg: 'rgba(255,64,129,0.15)',                  color: '#FF4081', label: '🎵 LED Acoustique' },
  'tv-simple-bois-noir':      { bg: 'linear-gradient(135deg,#9A7840,#D4AF77)', color: '#0D0B08',  label: 'Best Seller' },
  'faux-marbre-blanc':        { bg: 'rgba(64,196,255,0.15)',                   color: '#40C4FF',  label: 'Tendance' },
  'tv-deco-mural-anthracite': { bg: 'rgba(139,92,246,0.15)',                   color: '#A78BFA',  label: 'Clé en main' },
  'tv-simple-flottant-beige': { bg: 'rgba(0,230,118,0.12)',                    color: '#00E676',  label: 'Nouveau' },
}

// ── Skeleton card ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 18, overflow: 'hidden', background: '#1A1610',
      border: '1px solid rgba(61,53,40,0.4)', animation: 'shimmer 1.8s ease-in-out infinite' }}>
      <div style={{ height: 130, background: 'linear-gradient(90deg,#1A1610 25%,#231F18 50%,#1A1610 75%)',
        backgroundSize: '200% 100%' }}/>
      <div style={{ padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 9, background: '#2E2820', borderRadius: 4, width: '40%' }}/>
        <div style={{ height: 14, background: '#2E2820', borderRadius: 4, width: '80%' }}/>
        <div style={{ height: 30, background: '#2E2820', borderRadius: 9, marginTop: 4 }}/>
      </div>
    </div>
  )
}

// ── Mini preview label quand on hover ────────────────────────────
function PreviewTooltip({ product, visible }: { product: Product; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute', bottom: '100%', left: 0, right: 0,
            marginBottom: 8, zIndex: 50,
            background: 'rgba(13,11,8,0.95)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(201,169,110,0.25)', borderRadius: 14,
            padding: '12px 14px', pointerEvents: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#9A7840', fontFamily: 'Raleway,sans-serif',
            textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>
            {product.category.replace('-', ' ')}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FAF6EE',
            fontFamily: '"Cormorant Garamond",Georgia,serif', marginBottom: 6, lineHeight: 1.2 }}>
            {product.name}
          </div>
          <div style={{ fontSize: 11, color: '#7A6E60', fontFamily: 'Raleway,sans-serif', lineHeight: 1.5 }}>
            {product.dimensions}
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#C9A96E',
              fontFamily: '"Cormorant Garamond",Georgia,serif' }}>
              {formatPrice(product.priceDA)}
            </span>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#4A4035',
              fontFamily: 'Raleway,sans-serif', letterSpacing: '1px' }}>
              par {product.priceUnit}
            </span>
          </div>
          {/* Triangle */}
          <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
            width: 10, height: 10, background: 'rgba(13,11,8,0.95)', rotate: '45deg',
            borderRight: '1px solid rgba(201,169,110,0.25)', borderBottom: '1px solid rgba(201,169,110,0.25)' }}/>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Carte produit du teaser ───────────────────────────────────────
function TeaserCard({ product, index }: { product: Product; index: number }) {
  const router = useRouter()
  const { addToCart, setPendingProductId, setPendingCategoryFilter } = useMuroStore(s => ({
    addToCart:                s.addToCart,
    setPendingProductId:      s.setPendingProductId,
    setPendingCategoryFilter: s.setPendingCategoryFilter,
  }))
  const [hovered, setHovered]   = useState(false)
  const [addedOk, setAddedOk]   = useState(false)
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const bs = BADGE_STYLE[product.id]

  const goToBoutique = () => {
    setPendingCategoryFilter(product.category)
    router.push(`/boutique?filtre=${product.category}&product=${product.id}`)
  }

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    addToCart(product, 1)
    setAddedOk(true)
    setTimeout(() => setAddedOk(false), 1800)
  }

  const handleSim = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setPendingProductId(product.id)
    router.push(`/simulation?product=${product.id}`)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.1 + index * 0.1, duration: 0.6 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ position: 'relative', borderRadius: 18, overflow: 'visible', cursor: 'pointer' }}>

      {/* Tooltip preview au hover */}
      <PreviewTooltip product={product} visible={hovered} />

      <div onClick={goToBoutique}
        style={{
          borderRadius: 18, overflow: 'hidden', background: '#1A1610',
          border: `1px solid ${hovered ? 'rgba(201,169,110,0.4)' : 'rgba(61,53,40,0.6)'}`,
          transform: hovered ? 'translateY(-3px)' : 'none',
          boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.35)' : 'none',
          transition: 'all 0.25s cubic-bezier(0.34,1,0.64,1)',
        }}>

        {/* Image */}
        <div style={{ position: 'relative', height: 130, overflow: 'hidden',
          background: 'rgba(201,169,110,0.06)' }}>
          {product.image
            ? <img src={product.image} alt={product.name} loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover',
                  transform: hovered ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.5s ease' }}/>
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 40, opacity: 0.3 }}>{product.emoji}</div>
          }
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom,transparent 40%,rgba(13,11,8,0.7) 100%)' }}/>

          {/* Badge */}
          {bs && (
            <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 9px', borderRadius: 99,
              background: bs.bg, fontSize: 9, fontWeight: 800, color: bs.color,
              fontFamily: 'Raleway,sans-serif', letterSpacing: '0.5px' }}>
              {bs.label}
            </div>
          )}

          {/* Prix */}
          <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '3px 8px', borderRadius: 99,
            background: 'rgba(13,11,8,0.88)', fontSize: 11, fontWeight: 800, color: '#C9A96E',
            fontFamily: '"Cormorant Garamond",Georgia,serif' }}>
            {formatPrice(product.priceDA)}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '12px 12px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#7A6E60', fontFamily: 'Raleway,sans-serif',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
            {product.category.replace('-', ' ')} · {product.priceUnit}
          </div>
          <div style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 14, fontWeight: 700,
            color: '#FAF6EE', lineHeight: 1.2, marginBottom: 10, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {product.name}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleAddToCart}
              style={{ flex: 1, height: 32, borderRadius: 9,
                border: `1px solid ${addedOk ? 'rgba(0,230,118,0.4)' : 'rgba(201,169,110,0.3)'}`,
                background: addedOk ? 'rgba(0,230,118,0.1)' : 'rgba(201,169,110,0.08)',
                cursor: 'pointer', color: addedOk ? '#00E676' : '#C9A96E',
                fontSize: 10, fontWeight: 800, fontFamily: 'Raleway,sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                transition: 'all 0.2s' }}>
              {addedOk ? <>✅ Ajouté</> : <>🛒 Panier</>}
            </button>
            <button onClick={handleSim}
              style={{ width: 32, height: 32, borderRadius: 9,
                border: '1px solid rgba(61,53,40,0.8)', background: 'rgba(30,26,20,0.9)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0, transition: 'all 0.15s' }}
              title="Simuler en 3D">
              📐
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function BoutiqueTeaser() {
  const router = useRouter()
  const { setPendingCategoryFilter } = useMuroStore(s => ({
    setPendingCategoryFilter: s.setPendingCategoryFilter,
  }))
  const ref    = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const goToBoutique = (cat?: string) => {
    if (cat) setPendingCategoryFilter(cat)
    router.push(cat ? `/boutique?filtre=${cat}` : '/boutique')
  }

  return (
    <section ref={ref} style={{ background: '#13110D', padding: '72px 0', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg,transparent 0%,#C9A96E 30%,#C9A96E 70%,transparent 100%)',
        opacity: 0.3 }}/>

      <div style={{ padding: '0 22px', maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ height: 1, width: 28, background: '#C9A96E' }}/>
              <span style={{ fontFamily: 'Raleway,sans-serif', fontSize: 10, fontWeight: 800,
                letterSpacing: '3px', textTransform: 'uppercase', color: '#9A7840' }}>Notre Boutique</span>
            </div>
            <h2 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif',
              fontSize: 'clamp(28px,7vw,38px)', fontWeight: 700, color: '#FAF6EE', lineHeight: 1.1 }}>
              Les plus<br/>
              <em style={{ color: '#C9A96E', fontStyle: 'italic' }}>aimés à Oran</em>
            </h2>
          </div>
          <button onClick={() => goToBoutique()}
            style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(201,169,110,0.35)',
              background: 'transparent', cursor: 'pointer', color: '#C9A96E', fontSize: 11,
              fontWeight: 800, fontFamily: 'Raleway,sans-serif', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Tout voir →
          </button>
        </motion.div>

        {/* Filtre rapide catégories */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ display: 'flex', gap: 7, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {[
            { id: 'porte-wpc',    label: '🚪 Portes Invisibles' },
            { id: 'faux-shiplap', label: '🪵 Faux Shiplap' },
            { id: 'tv-simple',    label: '📺 Meubles TV' },
            { id: 'tv-deco',      label: '🏛️ TV + Placo' },
            { id: 'murs',         label: '🪨 Revêtements' },
          ].map(cat => (
            <button key={cat.id} onClick={() => goToBoutique(cat.id)}
              style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                border: '1px solid rgba(61,53,40,0.8)', background: 'rgba(30,26,20,0.9)',
                cursor: 'pointer', color: '#B8A898', fontSize: 11, fontWeight: 700,
                fontFamily: 'Raleway,sans-serif', transition: 'all 0.15s',
                whiteSpace: 'nowrap' }}>
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Grille 2×2 produits réels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {BESTSELLERS.length > 0
            ? BESTSELLERS.map((p, i) => <React.Fragment key={p.id}><TeaserCard product={p} index={i} /></React.Fragment>)
            : [0,1,2,3].map(i => <SkeletonCard key={i} />)
          }
        </div>

        {/* CTA boutique */}
        <motion.button initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          onClick={() => goToBoutique()}
          style={{ width: '100%', height: 52, borderRadius: 14,
            border: '1.5px solid rgba(201,169,110,0.3)', background: 'transparent',
            cursor: 'pointer', color: '#C9A96E', fontSize: 14, fontWeight: 800,
            fontFamily: 'Raleway,sans-serif', marginTop: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.2s' }}>
          <span style={{ fontSize: 18 }}>🛍️</span>
          Voir toute la boutique
          <span style={{ fontSize: 16 }}>→</span>
        </motion.button>
      </div>
    </section>
  )
}
