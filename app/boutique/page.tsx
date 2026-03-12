// Fichier : app/boutique/page.tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ProductCard from '@/components/ProductCard'
import { PRODUCTS, CATEGORIES, formatPrice, getProductsByCategory } from '@/lib/products'
import { useCartTotal } from '@/lib/store'
import type { Product } from '@/lib/store'

// ── Produits par section ─────────────────────────────────────────
const TV_SIMPLES = PRODUCTS.filter(p => p.category === 'tv-simple')
const TV_DECOS   = PRODUCTS.filter(p => p.category === 'tv-deco')
const AUTRES_CAT = ['murs', 'lumiere', 'mobilier', 'services'] as const

// ── Vue "Meubles TV" = les 2 sections ensemble ───────────────────
const ALL_TV_IDS = new Set(['tv-simple', 'tv-deco', 'tv'])

export default function BoutiquePage() {
  const router  = useRouter()
  const [cat,   setCat]    = useState<string>('tv-accueil')
  const [search, setSearch] = useState('')
  const { count, total }   = useCartTotal()

  // Résultats filtrés (pour la recherche globale)
  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    return PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameAr ?? '').includes(search)
    )
  }, [search])

  const showSearch  = search.trim().length > 0
  const showTVMain  = !showSearch && cat === 'tv-accueil'
  const showAutres  = !showSearch && AUTRES_CAT.includes(cat as any)

  const autresProduits = useMemo(() => {
    if (!showAutres) return []
    return PRODUCTS.filter(p => p.category === cat)
  }, [cat, showAutres])

  return (
    <main className="fixed inset-0 flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div className="flex-shrink-0" style={{
        paddingTop: 'max(14px,env(safe-area-inset-top))',
        background: 'rgba(13,11,8,0.97)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(201,169,110,0.1)',
      }}>
        {/* Row 1: nav */}
        <div className="flex items-center gap-3 px-4 pb-3">
          <button onClick={() => router.push('/')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muro-text3 flex-shrink-0"
            style={{ background: 'rgba(46,40,32,0.9)', border: '1px solid rgba(61,53,40,0.8)' }}>
            ←
          </button>
          <div className="flex-1">
            <h1 className="font-display font-black gold-text text-xl leading-none">Boutique</h1>
            <p className="text-[10px] text-muro-text4 tracking-[2px] uppercase mt-0.5">MURO by L&amp;Y · Oran</p>
          </div>
          <button onClick={() => router.push('/devis')}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold"
            style={{
              background: count > 0 ? 'linear-gradient(135deg,#9A7840,#C9A96E)' : 'rgba(46,40,32,0.9)',
              color:      count > 0 ? '#0D0B08' : 'var(--text3)',
              border:     count > 0 ? 'none' : '1px solid rgba(61,53,40,0.8)',
            }}>
            🛒 {count > 0 && <span className="font-black">{count}</span>}
          </button>
        </div>

        {/* Row 2: search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(30,26,20,0.9)', border: '1px solid rgba(46,40,32,0.8)' }}>
            <span className="text-muro-text4 text-sm">🔍</span>
            <input type="text" placeholder="Rechercher un produit…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-muro-text text-[13px] placeholder-muro-text4 focus:outline-none" />
            {search && <button onClick={() => setSearch('')} className="text-muro-text4 text-sm">✕</button>}
          </div>
        </div>

        {/* Row 3: tabs */}
        <div className="flex overflow-x-auto scrollbar-hide px-2 pb-0">
          <TabBtn active={cat === 'tv-accueil'} onClick={() => setCat('tv-accueil')} emoji="📺" label="Meubles TV"
            count={TV_SIMPLES.length + TV_DECOS.length} highlight />
          {AUTRES_CAT.map(c => {
            const info = CATEGORIES.find(x => x.id === c)!
            return (
              <TabBtn key={c} active={cat === c} onClick={() => setCat(c)}
                emoji={info.emoji} label={info.label}
                count={PRODUCTS.filter(p => p.category === c).length} />
            )
          })}
        </div>
      </div>

      {/* ── CONTENU ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait">

          {/* ── RÉSULTATS RECHERCHE ── */}
          {showSearch && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 gap-3">
                  <span className="text-5xl">🔍</span>
                  <p className="text-muro-text3 text-sm">Aucun produit trouvé</p>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-muro-text4 text-xs mb-3">{searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {searchResults.map((p, i) => (
                      <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <ProductCard product={p} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── PAGE MEUBLES TV ── */}
          {showTVMain && (
            <motion.div key="tv-accueil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-6">

              {/* ── SECTION 1 : MEUBLES TV SIMPLES ── */}
              <SectionHeader
                num="01"
                title="Meubles TV Sur Mesure"
                titleAr="طاولات تلفزيون على المقاس"
                subtitle="Fabrication locale Oran · MDF laqué · Livraison incluse"
                color="#C9A96E"
              />

              <div className="px-4 pb-2">
                <div className="grid grid-cols-1 gap-3">
                  {TV_SIMPLES.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                      <TVProductCard product={p} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── DIVIDER ── */}
              <div className="mx-4 my-5" style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,169,110,0.25),transparent)' }} />

              {/* ── SECTION 2 : TV + PLACO DÉCO ── */}
              <SectionHeader
                num="02"
                title="TV + Décoration Placoplatre"
                titleAr="تلفزيون + ديكور جبس"
                subtitle="Pose complète · BA13 + Meuble + LED · Clé en main"
                color="#8B5CF6"
                purple
              />

              <div className="px-4 pb-2">
                <div className="grid grid-cols-1 gap-3">
                  {TV_DECOS.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                      <TVProductCard product={p} isPlaco />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── NOTE ── */}
              <div className="mx-4 mt-4 px-4 py-3 rounded-xl text-[11px] leading-relaxed text-muro-text4"
                style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.12)' }}>
                💬 Tous nos prix sont indicatifs. Contactez-nous pour un devis personnalisé selon vos dimensions.
                Déplacement gratuit sur Oran et périphérie.
              </div>
            </motion.div>
          )}

          {/* ── AUTRES CATÉGORIES ── */}
          {showAutres && (
            <motion.div key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {autresProduits.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 gap-3">
                  <span className="text-5xl">📦</span>
                  <p className="text-muro-text3 text-sm">Aucun produit dans cette catégorie</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 p-4">
                  {autresProduits.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── BOTTOM DEVIS BAR ────────────────────────────── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="flex-shrink-0 px-4 py-3"
            style={{
              paddingBottom: 'max(16px,env(safe-area-inset-bottom))',
              background: 'rgba(13,11,8,0.97)', backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(201,169,110,0.15)',
            }}>
            <button onClick={() => router.push('/devis')} className="btn-gold w-full h-14">
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

// ── SECTION HEADER ───────────────────────────────────────────────
function SectionHeader({ num, title, titleAr, subtitle, color, purple }: {
  num: string; title: string; titleAr: string
  subtitle: string; color: string; purple?: boolean
}) {
  return (
    <div className="px-4 pt-5 pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="text-[10px] font-black tracking-[3px] uppercase"
          style={{ color: purple ? '#A78BFA' : '#9A7840' }}>
          Section {num}
        </div>
        <div className="flex-1 h-px" style={{ background: purple ? 'rgba(139,92,246,0.2)' : 'rgba(201,169,110,0.2)' }} />
      </div>
      <h2 className="font-display font-black text-xl leading-tight mb-0.5"
        style={{ color }}>
        {title}
      </h2>
      <p className="text-muro-text4 text-[11px] mb-1">{titleAr}</p>
      <p className="text-muro-text3 text-[11px] tracking-wide">{subtitle}</p>
    </div>
  )
}

// ── CARTE PRODUIT TV (horizontale avec photo réelle) ─────────────
function TVProductCard({ product, isPlaco = false }: { product: Product; isPlaco?: boolean }) {
  const [added, setAdded] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const { addToCart } = useMuroStore_cart()

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    addToCart(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const accentColor = isPlaco ? '#A78BFA' : '#C9A96E'
  const accentBg    = isPlaco ? 'rgba(139,92,246,0.08)' : 'rgba(201,169,110,0.08)'
  const accentBorder = isPlaco ? 'rgba(139,92,246,0.2)' : 'rgba(201,169,110,0.15)'

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowDetail(true)}
        className="rounded-2xl overflow-hidden cursor-pointer"
        style={{ background: '#1C1810', border: `1px solid ${accentBorder}` }}
      >
        {/* Photo produit */}
        <div className="relative" style={{ height: 190 }}>
          {product.image ? (
            <img src={product.image} alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl"
              style={{ background: 'rgba(26,22,16,0.9)' }}>
              {product.emoji}
            </div>
          )}

          {/* Gradient bas */}
          <div className="absolute inset-x-0 bottom-0 h-20"
            style={{ background: 'linear-gradient(to top, rgba(28,24,16,0.95), transparent)' }} />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            {isPlaco && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                style={{ background: 'rgba(139,92,246,0.85)', color: '#EDE9FE' }}>
                Clé en main
              </span>
            )}
            {!product.inStock && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-900/80 text-red-300">
                Rupture
              </span>
            )}
          </div>

          {/* Prix sur la photo */}
          <div className="absolute bottom-2.5 right-2.5 text-right">
            <div className="text-[17px] font-black" style={{ color: accentColor }}>
              {formatPrice(product.priceDA)}
            </div>
            <div className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              / {product.priceUnit}
            </div>
          </div>
        </div>

        {/* Infos bas de carte */}
        <div className="px-3.5 py-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-muro-text font-bold text-[13px] leading-snug mb-1 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-muro-text4 text-[11px] leading-snug line-clamp-1">
              {product.dimensions}
            </p>
          </div>

          {/* Bouton devis */}
          <div className="flex gap-1.5 flex-shrink-0">
            {product.model3d && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
                title="Modèle 3D disponible">
                🧊
              </div>
            )}
            <motion.button
              onClick={handleAdd}
              disabled={!product.inStock}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{
                background: added ? 'rgba(16,185,129,0.2)' : `linear-gradient(135deg, ${isPlaco ? '#6D28D9,#8B5CF6' : '#9A7840,#C9A96E'})`,
                border: added ? '1px solid rgba(16,185,129,0.4)' : 'none',
              }}>
              <AnimatePresence mode="wait">
                {added
                  ? <motion.span key="c" initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} className="text-green-400">✓</motion.span>
                  : <motion.span key="p" initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} className="font-black" style={{ color: '#0D0B08' }}>+</motion.span>
                }
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── MODAL DETAIL ── */}
      <AnimatePresence>
        {showDetail && (
          <TVDetailModal product={product} isPlaco={isPlaco}
            onClose={() => setShowDetail(false)}
            onAdd={handleAdd} added={added} />
        )}
      </AnimatePresence>
    </>
  )
}

// ── MODAL DETAIL TV ──────────────────────────────────────────────
function TVDetailModal({ product, isPlaco, onClose, onAdd, added }: {
  product: Product; isPlaco: boolean
  onClose: () => void; onAdd: (e?: React.MouseEvent) => void; added: boolean
}) {
  const router = useRouter()
  const { setSelectedProduct } = useMuroStore_cart()
  const accentColor  = isPlaco ? '#A78BFA' : '#C9A96E'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
      <motion.div
        className="w-full max-w-sm rounded-t-3xl overflow-hidden"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#1E1A14', border: '1px solid rgba(201,169,110,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Handle */}
        <div className="w-9 h-1 rounded-full bg-muro-border2 mx-auto mt-3 mb-0" />

        {/* Grande photo */}
        <div className="relative mx-4 mt-3 rounded-2xl overflow-hidden" style={{ height: 200 }}>
          {product.image ? (
            <img src={product.image} alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl"
              style={{ background: 'rgba(26,22,16,0.9)' }}>
              {product.emoji}
            </div>
          )}
          {isPlaco && (
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
              style={{ background: 'rgba(109,40,217,0.9)', color: '#EDE9FE' }}>
              🏛️ Pose clé en main
            </div>
          )}
        </div>

        <div className="px-5 pt-4 pb-6">
          {/* Badge */}
          <div className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2"
            style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}>
            {isPlaco ? 'TV + Placo Décoration' : 'Meuble TV Sur Mesure'}
          </div>

          <h2 className="text-muro-text font-bold text-xl leading-snug mb-1">{product.name}</h2>
          <p className="text-muro-text4 text-[12px] mb-3">{product.nameAr}</p>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-[12px]"
            style={{ background: 'rgba(46,40,32,0.8)' }}>
            <span style={{ color: accentColor }}>📏</span>
            <span className="text-muro-text3">{product.dimensions}</span>
          </div>

          <p className="text-muro-text3 text-[12px] leading-relaxed mb-4">{product.description}</p>

          {/* Ce qui est inclus si placo */}
          {isPlaco && (
            <div className="px-3 py-3 rounded-xl mb-4" style={{ background: 'rgba(109,40,217,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="text-[11px] font-bold mb-2" style={{ color: '#A78BFA' }}>✅ Inclus dans ce forfait :</div>
              {['Travaux BA13 (ossature + plaques)', 'Peinture finition satin', 'Meuble TV sur mesure', 'Éclairage LED intégré', 'Câblage TV encastré', 'Pose et finitions complètes'].map((item, i) => (
                <div key={i} className="text-[11px] text-muro-text3 flex items-center gap-2 mb-1">
                  <span style={{ color: '#A78BFA' }}>•</span> {item}
                </div>
              ))}
            </div>
          )}

          {product.model3d && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-[11px] font-semibold"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}>
              🧊 Modèle 3D disponible — Simulez dans votre salon
            </div>
          )}

          <div className="flex items-baseline gap-1.5 mb-5">
            <span className="text-2xl font-black" style={{ color: accentColor }}>
              {formatPrice(product.priceDA)}
            </span>
            <span className="text-muro-text4 text-sm">/ {product.priceUnit}</span>
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => { setSelectedProduct(product); onClose(); router.push('/simulation') }}
              className="btn-ghost flex-1 py-3.5 text-[13px]">
              🛋️ Simuler en AR
            </button>
            <button onClick={onAdd} className="flex-1 py-3.5 text-[13px] font-bold rounded-xl"
              style={{ background: `linear-gradient(135deg,${isPlaco ? '#6D28D9,#8B5CF6' : '#9A7840,#C9A96E'})`, color: '#0D0B08' }}>
              {added ? '✓ Ajouté !' : '+ Devis'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Mini hook store ──────────────────────────────────────────────
import { useMuroStore } from '@/lib/store'
function useMuroStore_cart() {
  return useMuroStore(s => ({ addToCart: s.addToCart, setSelectedProduct: s.setSelectedProduct }))
}

// ── Tab button ───────────────────────────────────────────────────
function TabBtn({ active, onClick, label, emoji, count, highlight }: {
  active: boolean; onClick: () => void; label: string
  emoji: string; count: number; highlight?: boolean
}) {
  return (
    <button onClick={onClick}
      className="flex-shrink-0 flex items-center gap-1 px-3.5 py-2.5 text-[11px] font-bold tracking-wide transition-all"
      style={{
        color:        active ? (highlight ? 'var(--gold)' : 'var(--gold)') : 'var(--text4)',
        borderBottom: active ? `2px solid ${highlight ? 'var(--gold)' : 'var(--gold)'}` : '2px solid transparent',
        whiteSpace:   'nowrap',
      }}>
      <span>{emoji}</span>
      {label}
      <span className="text-[9px] px-1 rounded-full ml-0.5"
        style={{
          background: active ? 'rgba(201,169,110,0.15)' : 'rgba(46,40,32,0.8)',
          color:      active ? 'var(--gold3)' : 'var(--text4)',
        }}>
        {count}
      </span>
    </button>
  )
}
