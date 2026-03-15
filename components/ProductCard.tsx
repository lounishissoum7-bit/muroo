import React from 'react'
// Fichier : components/ProductCard.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useMuroStore } from '@/lib/store'
import { formatPrice } from '@/lib/products'
import type { Product } from '@/lib/store'

// ── Badges ────────────────────────────────────────────────────────
const BEST_SELLERS = new Set(['tv-simple-bois-noir','tv-simple-flottant-chene','tv-deco-mural-anthracite','faux-marbre-blanc','shiplap-chene'])
const NOUVEAUX     = new Set(['tv-simple-flottant-beige','tv-deco-marbre-bibliotheque','panneau-3d-mdf'])
const PROMO        = new Set(['tv-led-120','ba13-placo'])

function Badge({ product }: { product: Product }) {
  if (BEST_SELLERS.has(product.id)) return (
    <div style={{ position:'absolute',top:10,left:10,zIndex:5,padding:'4px 10px',borderRadius:99,background:'linear-gradient(135deg,#9A7840,#D4AF77)',color:'#1C1610',fontSize:9,fontWeight:800,fontFamily:'Raleway,sans-serif',letterSpacing:'1px',textTransform:'uppercase',boxShadow:'0 2px 12px rgba(154,120,64,.3)' }}>
      ★ Best Seller
    </div>
  )
  if (NOUVEAUX.has(product.id)) return (
    <div style={{ position:'absolute',top:10,left:10,zIndex:5,padding:'4px 10px',borderRadius:99,background:'rgba(64,196,255,.15)',border:'1px solid rgba(64,196,255,.4)',color:'#1870A4',fontSize:9,fontWeight:800,fontFamily:'Raleway,sans-serif',letterSpacing:'1px',textTransform:'uppercase' }}>
      ✦ Nouveau
    </div>
  )
  if (PROMO.has(product.id)) return (
    <div style={{ position:'absolute',top:10,left:10,zIndex:5,padding:'4px 10px',borderRadius:99,background:'rgba(220,80,60,.1)',border:'1px solid rgba(220,80,60,.3)',color:'#C04030',fontSize:9,fontWeight:800,fontFamily:'Raleway,sans-serif',letterSpacing:'1px',textTransform:'uppercase' }}>
      Promo
    </div>
  )
  return null
}

// ── WhatsApp message pour 1 produit ──────────────────────────────
function whatsappProduct(p: Product) {
  const msg = encodeURIComponent(
`Bonjour MURO by L&Y 👋

Je suis intéressé(e) par :
*${p.emoji} ${p.name}*
📐 Dimensions : ${p.dimensions}
💰 Prix : ${formatPrice(p.priceDA)} / ${p.priceUnit}

📍 Je suis à Oran — pouvez-vous me confirmer les délais et la disponibilité ?

Merci !`
  )
  return `https://wa.me/213xxxxxxxxx?text=${msg}`
}

// ── QuickView modal ───────────────────────────────────────────────
function QuickView({ product, onClose, onAdd, onSimulate }: {
  product: Product; onClose: ()=>void; onAdd: ()=>void; onSimulate: ()=>void
}) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      onClick={onClose}
      style={{ position:'fixed',inset:0,zIndex:500,background:'rgba(28,22,16,.6)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:28,stiffness:300}}
        onClick={e=>e.stopPropagation()}
        style={{ width:'100%',maxWidth:480,borderRadius:'24px 24px 0 0',background:'#FDFAF5',overflow:'hidden',fontFamily:'Raleway,sans-serif' }}>

        {/* Image */}
        <div style={{ height:240,position:'relative',overflow:'hidden',background:'linear-gradient(135deg,#F5EDD8,#EAD9B4)' }}>
          {product.image
            ? <img src={product.image} alt={product.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} loading="lazy"/>
            : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:72,opacity:.3 }}>{product.emoji}</div>
          }
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(28,22,16,.5),transparent 50%)' }}/>
          <button onClick={onClose} style={{ position:'absolute',top:12,right:12,width:34,height:34,borderRadius:'50%',border:'none',background:'rgba(253,250,245,.85)',backdropFilter:'blur(8px)',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',color:'#3A2E22' }}>✕</button>
          <Badge product={product} />
        </div>

        {/* Infos */}
        <div style={{ padding:'20px 20px 8px' }}>
          <div style={{ fontSize:10,fontWeight:800,color:'#9A7840',letterSpacing:'2px',textTransform:'uppercase',marginBottom:6 }}>{product.category.replace('-',' ')}</div>
          <div style={{ fontSize:20,fontWeight:700,color:'#1C1610',lineHeight:1.2,marginBottom:6,fontFamily:'"Cormorant Garamond",Georgia,serif' }}>{product.name}</div>
          <div style={{ fontSize:11,color:'#6B5842',marginBottom:4 }}>{product.dimensions}</div>
          <div style={{ fontSize:12,color:'#8A7A68',lineHeight:1.6,marginBottom:16 }}>{product.description}</div>

          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
            <div>
              <div style={{ fontSize:24,fontWeight:800,color:'#9A7840',fontFamily:'"Cormorant Garamond",Georgia,serif',lineHeight:1 }}>{formatPrice(product.priceDA)}</div>
              <div style={{ fontSize:10,color:'#9A8A78',marginTop:2 }}>par {product.priceUnit} · TVA 19% non incluse</div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:99,background:product.inStock?'rgba(40,180,100,.1)':'rgba(200,60,60,.1)',border:`1px solid ${product.inStock?'rgba(40,180,100,.3)':'rgba(200,60,60,.3)'}` }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:product.inStock?'#28B464':'#C83C3C' }}/>
              <span style={{ fontSize:10,fontWeight:700,color:product.inStock?'#1A7A44':'#C83C3C' }}>{product.inStock?'En stock':'Indisponible'}</span>
            </div>
          </div>
        </div>

        {/* Boutons 3 colonnes */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,padding:'0 20px' }}>
          <button onClick={onAdd}
            style={{ height:50,borderRadius:14,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#9A7840,#D4AF77)',color:'#1C1610',fontSize:13,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 4px 20px rgba(154,120,64,.3)' }}>
            <span style={{fontSize:18}}>🛒</span> Panier
          </button>
          <button onClick={onSimulate}
            style={{ height:50,borderRadius:14,border:'1.5px solid rgba(154,120,64,.35)',background:'rgba(212,175,119,.08)',cursor:'pointer',color:'#6B5030',fontSize:12,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
            <span style={{fontSize:18}}>📐</span> Simuler en 3D
          </button>
        </div>

        {/* WhatsApp commander maintenant */}
        <div style={{ padding:'10px 20px 24px' }}>
          <a href={whatsappProduct(product)} target="_blank" rel="noopener noreferrer"
            style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,width:'100%',height:50,borderRadius:14,background:'#25D366',border:'none',cursor:'pointer',textDecoration:'none',color:'#fff',fontSize:14,fontWeight:800,fontFamily:'Raleway,sans-serif',boxShadow:'0 4px 20px rgba(37,211,102,.25)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Commander sur WhatsApp
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════
// CARTE PRODUIT
// ══════════════════════════════════════════════════════════════════
interface Props { product: Product; index: number; compact?: boolean }

export default function ProductCard({ product, index, compact = false }: Props) {
  const router  = useRouter()
  const { addToCart, setPendingProductId } = useMuroStore(s => ({
    addToCart:           s.addToCart,
    setPendingProductId: s.setPendingProductId,
  }))
  const [hovered,   setHovered]   = useState(false)
  const [quickView, setQuickView] = useState(false)
  const [added,     setAdded]     = useState(false)

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    addToCart(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
    setQuickView(false)
  }

  // Deep-link : store le productId puis navigate
  const handleSimulate = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setPendingProductId(product.id)
    router.push(`/simulation?product=${product.id}`)
    setQuickView(false)
  }

  const imgH = compact ? 150 : 200

  return (
    <>
      <motion.article
        initial={{ opacity:0, y:20 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay: index * 0.05, duration: 0.5 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={() => setQuickView(true)}
        style={{
          borderRadius:18, overflow:'hidden', cursor:'pointer', background:'#FFFFFF',
          border:`1px solid ${hovered?'rgba(154,120,64,.38)':'rgba(154,120,64,.12)'}`,
          boxShadow: hovered
            ? '0 12px 40px rgba(28,22,16,.12), 0 2px 8px rgba(154,120,64,.15)'
            : '0 2px 14px rgba(28,22,16,.05)',
          transition:'all .25s cubic-bezier(.34,.9,.64,1)',
          transform: hovered ? 'translateY(-4px)' : 'none',
          willChange:'transform',
        }}>

        {/* Image */}
        <div style={{ position:'relative', height:imgH, overflow:'hidden', background:'linear-gradient(135deg,#F5EDD8,#EAD9B4)' }}>
          {product.image
            ? <img src={product.image} alt={product.name} loading="lazy" style={{ width:'100%',height:'100%',objectFit:'cover',transform:hovered?'scale(1.06)':'scale(1)',transition:'transform .5s cubic-bezier(.34,.9,.64,1)' }}/>
            : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:compact?40:52,opacity:.35 }}>{product.emoji}</div>
          }
          <div style={{ position:'absolute',bottom:0,left:0,right:0,height:60,background:'linear-gradient(to top,rgba(28,22,16,.38),transparent)',pointerEvents:'none' }}/>
          <Badge product={product} />
          {/* Prix sur image */}
          <div style={{ position:'absolute',bottom:8,right:8,padding:'4px 10px',borderRadius:99,background:'rgba(253,250,245,.93)',backdropFilter:'blur(8px)',fontSize:12,fontWeight:800,color:'#6B5030',fontFamily:'"Cormorant Garamond",Georgia,serif' }}>
            {formatPrice(product.priceDA)}
          </div>
          {/* Hover overlay */}
          <AnimatePresence>
            {hovered && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(28,22,16,.22)',backdropFilter:'blur(2px)' }}>
                <div style={{ padding:'8px 18px',borderRadius:99,background:'rgba(253,250,245,.92)',backdropFilter:'blur(12px)',fontSize:11,fontWeight:800,color:'#1C1610',fontFamily:'Raleway,sans-serif',display:'flex',alignItems:'center',gap:6 }}>
                  <span style={{fontSize:14}}>👁</span> Voir le détail
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Infos */}
        <div style={{ padding: compact ? '12px 12px 14px' : '14px 14px 16px' }}>
          <div style={{ fontSize:9,fontWeight:800,color:'#B8A478',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:4,fontFamily:'Raleway,sans-serif' }}>
            {product.category.replace('-',' ')}
          </div>
          <div style={{ fontSize:compact?13:14,fontWeight:700,color:'#1C1610',lineHeight:1.25,marginBottom:4,fontFamily:'"Cormorant Garamond",Georgia,serif',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>
            {product.name}
          </div>
          {!compact && (
            <div style={{ fontSize:10,color:'#9A8A78',marginBottom:12,fontFamily:'Raleway,sans-serif' }}>
              {product.dimensions.split('·')[0].trim()}
            </div>
          )}

          {/* 3 boutons : Panier | Simuler | WhatsApp */}
          <div style={{ display:'flex',gap:6,marginTop: compact ? 8 : 0 }}>
            <motion.button whileTap={{scale:.93}} onClick={handleAdd}
              style={{ flex:1,height:38,borderRadius:10,border:`1.5px solid ${added?'rgba(40,180,100,.4)':'rgba(154,120,64,.3)'}`,cursor:'pointer',fontFamily:'Raleway,sans-serif',
                background:added?'rgba(40,180,100,.1)':'linear-gradient(135deg,rgba(154,120,64,.1),rgba(212,175,119,.07))',
                color:added?'#1A7A44':'#6B5030',fontSize:11,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:4,transition:'all .2s' }}>
              {added ? <><span style={{fontSize:13}}>✅</span> Ajouté</> : <><span style={{fontSize:13}}>🛒</span> Panier</>}
            </motion.button>
            <motion.button whileTap={{scale:.93}} onClick={handleSimulate}
              title="Simuler en 3D"
              style={{ width:38,height:38,borderRadius:10,border:'1.5px solid rgba(154,120,64,.22)',background:'rgba(212,175,119,.06)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>
              📐
            </motion.button>
            <motion.button whileTap={{scale:.93}}
              onClick={e => { e.stopPropagation(); window.open(whatsappProduct(product),'_blank') }}
              title="Commander sur WhatsApp"
              style={{ width:38,height:38,borderRadius:10,border:'1.5px solid rgba(37,211,102,.3)',background:'rgba(37,211,102,.06)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.article>

      <AnimatePresence>
        {quickView && (
          <QuickView
            product={product}
            onClose={() => setQuickView(false)}
            onAdd={handleAdd}
            onSimulate={handleSimulate}
          />
        )}
      </AnimatePresence>
    </>
  )
}
