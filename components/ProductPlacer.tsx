'use client'
// Fichier : components/ProductPlacer.tsx
// Panneau latéral catalogue + liste des objets placés

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PRODUCTS, CATEGORIES, formatPrice } from '@/lib/products'
import { CAT_COLOR } from '@/lib/roomScaler'
import type { Product } from '@/lib/store'

export interface PlacedItem {
  id:      string
  product: Product
  wall:    'front' | 'back' | 'left' | 'right'
  normX:   number   // −1..1 sur le mur
  normY:   number   // 0..1 hauteur
  scaleW:  number   // largeur en m
  scaleH:  number   // hauteur en m
}

interface Props {
  placed:          PlacedItem[]
  selectedId:      string | null
  pendingProduct:  Product | null
  onSelectProduct: (p: Product | null) => void
  onSelectPlaced:  (id: string | null) => void
  onDeletePlaced:  (id: string) => void
  onAddToCart:     (item: PlacedItem) => void
  totalDevis:      number
  onOpenRecap:     () => void
}

const CATS_DISPLAY = [
  { id: 'tv-simple', emoji: '📺', label: 'Meubles TV'  },
  { id: 'tv-deco',   emoji: '🏛️', label: 'TV + Placo'  },
  { id: 'murs',      emoji: '🪨', label: 'Revêtements' },
  { id: 'lumiere',   emoji: '💡', label: 'Éclairage'   },
  { id: 'mobilier',  emoji: '🛋️', label: 'Mobilier'    },
]

export default function ProductPlacer({
  placed, selectedId, pendingProduct, onSelectProduct,
  onSelectPlaced, onDeletePlaced, onAddToCart, totalDevis, onOpenRecap
}: Props) {
  const [tab,    setTab]    = useState<'catalogue'|'placed'>('catalogue')
  const [catId,  setCatId]  = useState('tv-simple')

  const filteredProds = PRODUCTS.filter(p => p.category === catId && p.inStock)
  const selectedPlaced = placed.find(p => p.id === selectedId)

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',fontFamily:'Raleway,sans-serif',background:'rgba(13,11,8,.98)',borderTop:'1px solid rgba(201,169,110,.15)' }}>

      {/* ── TABS ─────────────────────────────────────────────── */}
      <div style={{ display:'flex',flexShrink:0,borderBottom:'1px solid rgba(61,53,40,.7)' }}>
        {([['catalogue','🛒','Catalogue'],['placed','🧱','Placés']] as const).map(([t,ic,lb])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{ flex:1,padding:'9px 4px',border:'none',cursor:'pointer',background:'transparent',fontFamily:'Raleway,sans-serif',
              borderBottom:`2px solid ${tab===t?'#C9A96E':'transparent'}`,
              color:tab===t?'#C9A96E':'#7A6E60',fontSize:10,fontWeight:800,letterSpacing:'.5px',
              display:'flex',flexDirection:'column',alignItems:'center',gap:1 }}>
            <span style={{ fontSize:16 }}>{ic}</span>
            {lb.toUpperCase()}
          </button>
        ))}
        {/* Devis total */}
        {totalDevis > 0 && (
          <button onClick={onOpenRecap}
            style={{ padding:'9px 12px',border:'none',cursor:'pointer',
              background:'linear-gradient(135deg,rgba(154,120,64,.15),rgba(201,169,110,.1))',
              borderBottom:'2px solid #C9A96E',fontFamily:'Raleway,sans-serif',
              color:'#C9A96E',fontSize:10,fontWeight:800,display:'flex',flexDirection:'column',alignItems:'center',gap:1 }}>
            <span style={{ fontSize:16 }}>📊</span>
            <span style={{ fontSize:9,whiteSpace:'nowrap' }}>{formatPrice(totalDevis)}</span>
          </button>
        )}
      </div>

      {/* ── CONTENU ──────────────────────────────────────────── */}
      <div style={{ flex:1,overflowY:'auto',overscrollBehavior:'contain' }}>

        {/* ── CATALOGUE ── */}
        {tab === 'catalogue' && (
          <div style={{ padding:'10px 12px' }}>
            {/* Cat pills */}
            <div style={{ display:'flex',gap:6,marginBottom:12,overflowX:'auto',paddingBottom:4 }}>
              {CATS_DISPLAY.map(c => (
                <button key={c.id} onClick={()=>setCatId(c.id)}
                  style={{ flexShrink:0,padding:'5px 12px',borderRadius:20,cursor:'pointer',fontFamily:'Raleway,sans-serif',fontSize:11,fontWeight:700,
                    background:catId===c.id?'rgba(201,169,110,.15)':'rgba(30,26,20,.9)',
                    border:`1px solid ${catId===c.id?'rgba(201,169,110,.45)':'rgba(61,53,40,.8)'}`,
                    color:catId===c.id?'#E8C98A':'#B8A898' }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            {/* Hint sélection */}
            {pendingProduct && (
              <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}}
                style={{ marginBottom:10,padding:'9px 12px',borderRadius:12,background:'rgba(0,230,118,.07)',border:'1px solid rgba(0,230,118,.25)',fontSize:11,fontWeight:700,color:'#00E676',display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:'#00E676',animation:'pulse 1.4s ease-in-out infinite',flexShrink:0 }}/>
                {pendingProduct.emoji} {pendingProduct.name} — Touchez un mur sur la vidéo
                <button onClick={()=>onSelectProduct(null)}
                  style={{ marginLeft:'auto',width:22,height:22,borderRadius:'50%',border:'none',background:'rgba(0,0,0,.4)',color:'#00E676',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
              </motion.div>
            )}

            {/* Grille produits */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(88px,1fr))',gap:8 }}>
              {filteredProds.map(p => {
                const isSelected = pendingProduct?.id === p.id
                const col = CAT_COLOR[p.category] ?? '#C9A96E'
                return (
                  <motion.button key={p.id} whileTap={{scale:.93}} onClick={()=>onSelectProduct(isSelected?null:p)}
                    style={{ padding:'10px 6px',borderRadius:14,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:5,fontFamily:'Raleway,sans-serif',
                      border:`1px solid ${isSelected?col+'65':'rgba(61,53,40,.8)'}`,
                      background:isSelected?`${col}12`:'rgba(22,18,12,.95)',
                      boxShadow:isSelected?`0 0 0 2px ${col}30`:'none' }}>
                    <span style={{ fontSize:26 }}>{p.emoji}</span>
                    <span style={{ fontSize:9,fontWeight:700,color:'#FAF6EE',textAlign:'center',lineHeight:1.2,maxHeight:26,overflow:'hidden' }}>
                      {p.name.split(' ').slice(0,3).join(' ')}
                    </span>
                    <span style={{ fontSize:9,fontWeight:800,color:col }}>
                      {formatPrice(p.priceDA)}
                    </span>
                    {p.image && (
                      <div style={{ width:'100%',height:40,borderRadius:8,overflow:'hidden',marginTop:2 }}>
                        <img src={p.image} alt={p.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                      </div>
                    )}
                  </motion.button>
                )
              })}
              {filteredProds.length === 0 && (
                <div style={{ gridColumn:'1/-1',padding:'24px',textAlign:'center',color:'#7A6E60',fontSize:12 }}>Aucun produit disponible</div>
              )}
            </div>
          </div>
        )}

        {/* ── OBJETS PLACÉS ── */}
        {tab === 'placed' && (
          <div style={{ padding:'10px 12px' }}>
            {placed.length === 0 ? (
              <div style={{ textAlign:'center',padding:'32px 0',color:'#7A6E60' }}>
                <div style={{ fontSize:40,marginBottom:10,opacity:.3 }}>🧱</div>
                <div style={{ fontSize:12 }}>Aucun produit placé</div>
                <div style={{ fontSize:11,marginTop:6,color:'#4A4035' }}>Sélectionnez un produit dans le catalogue<br/>puis touchez un mur sur la vidéo</div>
              </div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {placed.map(item => {
                  const col = CAT_COLOR[item.product.category] ?? '#C9A96E'
                  const isSelected = item.id === selectedId
                  return (
                    <motion.div key={item.id} layout
                      onClick={() => onSelectPlaced(isSelected ? null : item.id)}
                      style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:14,cursor:'pointer',
                        background:isSelected?`${col}0E`:'rgba(26,22,14,.9)',
                        border:`1px solid ${isSelected?col+'50':'rgba(61,53,40,.8)'}` }}>
                      <span style={{ fontSize:24,flexShrink:0 }}>{item.product.emoji}</span>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:'#FAF6EE',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.product.name}</div>
                        <div style={{ fontSize:10,color:'#7A6E60',marginTop:2 }}>
                          Mur {item.wall==='front'?'principal':item.wall==='back'?'arrière':item.wall==='left'?'gauche':'droit'}  ·  {item.scaleW.toFixed(2)}m × {item.scaleH.toFixed(2)}m
                        </div>
                      </div>
                      <div style={{ textAlign:'right',flexShrink:0 }}>
                        <div style={{ fontSize:13,fontWeight:800,color:col }}>{formatPrice(item.product.priceDA)}</div>
                        <div style={{ display:'flex',gap:4,marginTop:4,justifyContent:'flex-end' }}>
                          <button onClick={e=>{e.stopPropagation();onAddToCart(item)}}
                            style={{ padding:'2px 8px',borderRadius:8,border:`1px solid ${col}40`,background:`${col}10`,color:col,fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:'Raleway,sans-serif' }}>
                            + Devis
                          </button>
                          <button onClick={e=>{e.stopPropagation();onDeletePlaced(item.id)}}
                            style={{ padding:'2px 8px',borderRadius:8,border:'1px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.08)',color:'#F87171',fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:'Raleway,sans-serif' }}>
                            🗑
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
