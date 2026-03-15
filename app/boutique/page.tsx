// Fichier : app/boutique/page.tsx
'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { PRODUCTS, formatPrice } from '@/lib/products'
import { useCartTotal } from '@/lib/store'
import type { Product } from '@/lib/store'
import type { FilterId, PriceRangeId } from '@/components/Filters'

// SSR-safe dynamic imports
const BoutiqueHero  = dynamic(() => import('@/components/BoutiqueHero'),  { ssr: false })
const ProductCard   = dynamic(() => import('@/components/ProductCard'),   { ssr: false })
const Filters       = dynamic(() => import('@/components/Filters'),       { ssr: false })
const CartFloating  = dynamic(() => import('@/components/CartFloating'),  { ssr: false })

// ── Filtrage par prix ─────────────────────────────────────────────
function matchesPrice(p: Product, range: PriceRangeId): boolean {
  if (range === 'all')  return true
  if (range === '0-10') return p.priceDA < 10_000
  if (range === '10-50')return p.priceDA >= 10_000  && p.priceDA < 50_000
  if (range === '50-100')return p.priceDA >= 50_000 && p.priceDA < 100_000
  if (range === '100+') return p.priceDA >= 100_000
  return true
}

// ── Best Sellers (ordre héroïque) ─────────────────────────────────
const BESTSELLER_IDS = ['tv-simple-bois-noir','faux-marbre-blanc','tv-deco-mural-anthracite','shiplap-chene','tv-simple-flottant-chene','canape-3pl']
const BESTSELLERS    = BESTSELLER_IDS.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean) as Product[]

// ── Section header  ───────────────────────────────────────────────
function SectionTitle({ title, sub, emoji }: { title: string; sub?: string; emoji?: string }) {
  return (
    <div style={{ marginBottom: 18, paddingLeft: 2 }}>
      {emoji && <div style={{ fontSize: 28, marginBottom: 6 }}>{emoji}</div>}
      <h2 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 26, fontWeight: 700, color: '#1C1610', lineHeight: 1.1, margin: 0 }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 12, color: '#8A7A68', marginTop: 5, fontFamily: 'Raleway,sans-serif', lineHeight: 1.5 }}>{sub}</p>}
    </div>
  )
}

// ── Carrousel Best-Sellers ────────────────────────────────────────
function BestSellerCarousel() {
  const router = useRouter()
  return (
    <section style={{ background: 'linear-gradient(135deg,#1C1610,#2A2118)', padding: '40px 0 36px', position: 'relative', overflow: 'hidden' }}>
      {/* Filet doré décoratif */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#D4AF77,transparent)' }}/>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#D4AF77,transparent)' }}/>

      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '3px', color: '#9A7840', textTransform: 'uppercase', fontFamily: 'Raleway,sans-serif', marginBottom: 8 }}>
          ★ PLÉBISCITÉS PAR ORAN
        </div>
        <h2 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 26, fontWeight: 700, color: '#F5EDD8', lineHeight: 1.1, margin: 0 }}>
          Nos best-sellers
        </h2>
      </div>

      {/* Scroll horizontal */}
      <div style={{ display: 'flex', gap: 14, padding: '4px 20px 8px', overflowX: 'auto', scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
        {BESTSELLERS.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            style={{ flexShrink: 0, width: 200, scrollSnapAlign: 'start', borderRadius: 16, overflow: 'hidden',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,119,0.2)',
              cursor: 'pointer' }}
            whileTap={{ scale: 0.97 }}>
            <div style={{ height: 140, overflow: 'hidden', position: 'relative', background: 'rgba(212,175,119,0.08)' }}>
              {p.image ? (
                <img src={p.image} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, opacity: 0.35 }}>{p.emoji}</div>
              )}
              <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '3px 9px', borderRadius: 99, background: 'rgba(28,22,16,0.8)', fontSize: 11, fontWeight: 800, color: '#D4AF77', fontFamily: '"Cormorant Garamond",Georgia,serif' }}>
                {formatPrice(p.priceDA)}
              </div>
            </div>
            <div style={{ padding: '12px 12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F5EDD8', lineHeight: 1.2, fontFamily: '"Cormorant Garamond",Georgia,serif', marginBottom: 8,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {p.name}
              </div>
              <button onClick={() => router.push('/simulation')}
                style={{ width: '100%', height: 32, borderRadius: 8, border: '1px solid rgba(212,175,119,0.35)', background: 'rgba(212,175,119,0.08)', cursor: 'pointer', fontSize: 10, fontWeight: 800, color: '#D4AF77', fontFamily: 'Raleway,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <span style={{ fontSize: 13 }}>📐</span> Essayer en 3D
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── Section Garanties ─────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { icon: '🏆', title: '5 ans de garantie', sub: 'Sur tous nos meubles' },
    { icon: '🚚', title: 'Livraison Oran', sub: 'Délai 48h garanti' },
    { icon: '🔧', title: 'Pose incluse', sub: 'Par nos artisans' },
    { icon: '📐', title: 'Sur mesure', sub: '100% personnalisable' },
  ]
  return (
    <div style={{ background: '#F5F0E8', padding: '24px 0', borderTop: '1px solid rgba(154,120,64,0.15)', borderBottom: '1px solid rgba(154,120,64,0.15)' }}>
      <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', gap: 0 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            flexShrink: 0, flex: '0 0 50%', padding: '12px 16px', textAlign: 'center',
            borderRight: i % 2 === 0 ? '1px solid rgba(154,120,64,0.15)' : 'none',
            borderBottom: i < 2 ? '1px solid rgba(154,120,64,0.15)' : 'none',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#2A2018', fontFamily: '"Cormorant Garamond",Georgia,serif' }}>{item.title}</div>
            <div style={{ fontSize: 10, color: '#8A7A68', marginTop: 2, fontFamily: 'Raleway,sans-serif' }}>{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pas de résultats ──────────────────────────────────────────────
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: 'center', padding: '60px 30px', fontFamily: 'Raleway,sans-serif' }}>
      <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.3 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#2A2018', fontFamily: '"Cormorant Garamond",Georgia,serif', marginBottom: 8 }}>Aucun produit trouvé</div>
      <div style={{ fontSize: 12, color: '#8A7A68', marginBottom: 24, lineHeight: 1.6 }}>Essayez d'autres filtres ou élargissez votre recherche.</div>
      <button onClick={onReset}
        style={{ padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#9A7840,#D4AF77)', color: '#1C1610', fontSize: 13, fontWeight: 800 }}>
        Réinitialiser les filtres
      </button>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════
export default function BoutiquePage() {
  const router          = useRouter()
  const productsRef     = useRef<HTMLDivElement>(null)
  const { count, total }= useCartTotal()

  const [filter,     setFilter]     = useState<FilterId>('all')
  const [priceRange, setPriceRange] = useState<PriceRangeId>('all')
  const [search,     setSearch]     = useState('')
  const [sortBy,     setSortBy]     = useState<'default'|'price-asc'|'price-desc'>('default')

  // Produits filtrés
  const filtered = useMemo(() => {
    let items = PRODUCTS
    if (filter !== 'all') items = items.filter(p => p.category === filter)
    if (priceRange !== 'all') items = items.filter(p => matchesPrice(p, priceRange))
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    }
    if (sortBy === 'price-asc')  items = [...items].sort((a,b) => a.priceDA - b.priceDA)
    if (sortBy === 'price-desc') items = [...items].sort((a,b) => b.priceDA - a.priceDA)
    return items
  }, [filter, priceRange, search, sortBy])

  // Comptage par catégorie
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    PRODUCTS.forEach(p => { map[p.category] = (map[p.category] ?? 0) + 1 })
    return map
  }, [])

  const scrollToProducts = useCallback(() => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const resetFilters = () => { setFilter('all'); setPriceRange('all'); setSearch('') }

  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', overscrollBehavior: 'contain',
      background: '#FDFAF5', fontFamily: 'Raleway,sans-serif' }}>

      {/* ── NAV HEADER ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, paddingTop: 'max(10px,env(safe-area-inset-top,0px))',
        background: 'rgba(253,250,245,0.96)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(154,120,64,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 10px' }}>
          <button onClick={() => router.push('/')}
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(154,120,64,0.25)', background: 'rgba(212,175,119,0.08)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B5030' }}>
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '3px', color: '#9A7840', textTransform: 'uppercase' }}>MURO by L&Y</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1C1610', fontFamily: '"Cormorant Garamond",Georgia,serif', lineHeight: 1 }}>Boutique · Oran</div>
          </div>
          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            style={{ height: 34, padding: '0 10px', borderRadius: 10, border: '1px solid rgba(154,120,64,0.25)', background: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'Raleway,sans-serif', fontWeight: 600, color: '#3A2E22', cursor: 'pointer', outline: 'none' }}>
            <option value="default">Pertinence</option>
            <option value="price-asc">Prix ↑</option>
            <option value="price-desc">Prix ↓</option>
          </select>
          {/* Cart mini */}
          {count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 10, background: 'rgba(154,120,64,0.1)', border: '1px solid rgba(154,120,64,0.25)' }}>
              <span style={{ fontSize: 14 }}>🛒</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#6B5030' }}>{count}</span>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <BoutiqueHero onScrollToProducts={scrollToProducts} />

      {/* ── TRUST STRIP ── */}
      <TrustStrip />

      {/* ── BEST SELLERS CARROUSEL ── */}
      <BestSellerCarousel />

      {/* ── CATALOGUE PRINCIPAL ── */}
      <div ref={productsRef}>
        <Filters
          active={filter}
          priceRange={priceRange}
          search={search}
          counts={counts}
          onFilter={setFilter}
          onPrice={setPriceRange}
          onSearch={setSearch}
          totalVisible={filtered.length}
        />

        <div style={{ padding: '20px 14px 100px' }}>

          {/* Résumé résultats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#8A7A68', fontWeight: 500 }}>
              <strong style={{ color: '#1C1610' }}>{filtered.length}</strong> produit{filtered.length > 1 ? 's' : ''}
              {filter !== 'all' && <span> · <button onClick={() => setFilter('all')} style={{ background: 'none', border: 'none', color: '#9A7840', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Raleway,sans-serif' }}>Voir tout</button></span>}
            </div>
          </div>

          {/* Grille produits */}
          {filtered.length === 0 ? (
            <EmptyState onReset={resetFilters} />
          ) : (
            <AnimatePresence mode="popLayout">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* CTA Simulation */}
          {filtered.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ marginTop: 40, padding: '28px 20px', borderRadius: 24, background: 'linear-gradient(135deg,#1C1610,#2A2118)', textAlign: 'center', border: '1px solid rgba(212,175,119,0.2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,#D4AF77,transparent)' }}/>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📐</div>
              <div style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 22, fontWeight: 700, color: '#F5EDD8', marginBottom: 8 }}>
                Visualisez avant d'acheter
              </div>
              <div style={{ fontSize: 12, color: '#8A7A68', marginBottom: 20, lineHeight: 1.6 }}>
                Utilisez notre simulateur 3D pour voir vos produits<br/>dans votre pièce avec vos vraies mesures.
              </div>
              <button onClick={() => router.push('/simulation')}
                style={{ height: 50, padding: '0 32px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#9A7840,#D4AF77)', color: '#1C1610', fontSize: 14, fontWeight: 800, fontFamily: 'Raleway,sans-serif', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 24px rgba(154,120,64,0.35)' }}>
                <span style={{ fontSize: 20 }}>🚀</span> Lancer le simulateur 3D
              </button>
            </motion.div>
          )}

          {/* Footer mini */}
          <div style={{ textAlign: 'center', paddingTop: 40, borderTop: '1px solid rgba(154,120,64,0.12)', marginTop: 40 }}>
            <div style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 22, fontWeight: 700, color: '#1C1610', marginBottom: 4 }}>
              MURO <em style={{ color: '#9A7840' }}>by L&Y</em>
            </div>
            <div style={{ fontSize: 11, color: '#9A8A78', letterSpacing: '1.5px' }}>DÉCORATION INTÉRIEURE · ORAN · ALGÉRIE</div>
            <div style={{ fontSize: 10, color: '#B8A8A0', marginTop: 12 }}>
              Sur mesure · Pose incluse · Livraison 48h · TVA 19%
            </div>
          </div>
        </div>
      </div>

      {/* ── PANIER FLOTTANT ── */}
      <CartFloating />
    </div>
  )
}
