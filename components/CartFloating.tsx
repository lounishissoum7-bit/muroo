// Fichier : components/CartFloating.tsx
// Panier flottant + WhatsApp devis complet + PDF + Deep-link simulation
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useMuroStore, useCartTotal } from '@/lib/store'
import { formatPrice } from '@/lib/products'
import { fmtDA, TVA_RATE } from '@/lib/calculateDevis'

// ── WhatsApp message devis complet ───────────────────────────────
function buildCartWhatsApp(cart: ReturnType<typeof useMuroStore>['cart'], subtotal: number, tva: number, total: number): string {
  const lignes = cart.map(i =>
    `• ${i.product.emoji} *${i.product.name}* × ${i.quantity} → ${fmtDA(i.totalDA)}`
  ).join('\n')

  return encodeURIComponent(
`Bonjour MURO by L&Y 👋

Je souhaite commander les articles suivants :

${lignes}

💰 *Récapitulatif :*
Sous-total HT : ${fmtDA(subtotal)}
TVA (19%) : ${fmtDA(tva)}
*TOTAL TTC : ${fmtDA(total)}*

📍 Livraison à Oran — Merci de confirmer les délais et la disponibilité.

Cordialement`
  )
}

// ── Icône WhatsApp SVG ────────────────────────────────────────────
function WAIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function CartFloating() {
  const router = useRouter()
  const { cart, removeFromCart, updateQty, clearCart, setPendingProductId } = useMuroStore(s => ({
    cart:                s.cart,
    removeFromCart:      s.removeFromCart,
    updateQty:           s.updateQty,
    clearCart:           s.clearCart,
    setPendingProductId: s.setPendingProductId,
  }))
  const { count, subtotal, tva, total } = useCartTotal()
  const [open,      setOpen]      = useState(false)
  const [exporting, setExporting] = useState(false)
  const [orderSent, setOrderSent] = useState(false)

  const waUrl = useMemo(
    () => `https://wa.me/213xxxxxxxxx?text=${buildCartWhatsApp(cart, subtotal, tva, total)}`,
    [cart, subtotal, tva, total]
  )

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const { buildDevis, exportPDF } = await import('@/lib/calculateDevis')
      const devis = buildDevis(
        cart.map(i => ({ product: i.product, qty: i.quantity, surface: i.surface })),
        { longueur: 0, largeur: 0, hauteur: 0 },
        'Commande boutique', '🛒'
      )
      await exportPDF(devis)
    } finally {
      setExporting(false)
    }
  }

  const handleWhatsApp = () => {
    window.open(waUrl, '_blank')
    setOrderSent(true)
    setTimeout(() => setOrderSent(false), 4000)
  }

  // Simuler tous les produits du panier (premier produit en deep-link)
  const handleSimulateAll = () => {
    if (cart.length > 0) {
      setPendingProductId(cart[0].product.id)
      router.push(`/simulation?product=${cart[0].product.id}`)
      setOpen(false)
    }
  }

  if (count === 0 && !open) return null

  return (
    <>
      {/* ── BOUTON FLOTTANT ── */}
      <motion.button
        initial={{ scale:0, opacity:0 }}
        animate={{ scale:1, opacity:1 }}
        whileTap={{ scale:0.92 }}
        onClick={() => setOpen(true)}
        style={{
          position:'fixed', bottom:'max(24px,env(safe-area-inset-bottom,0px))', right:20, zIndex:150,
          width:58, height:58, borderRadius:'50%', border:'none', cursor:'pointer',
          background:'linear-gradient(145deg,#9A7840,#D4AF77)',
          boxShadow:'0 8px 32px rgba(154,120,64,.45), 0 2px 8px rgba(0,0,0,.12)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
        }}>
        🛒
        {count > 0 && (
          <motion.span key={count} initial={{scale:0}} animate={{scale:1}}
            style={{ position:'absolute', top:-4, right:-4, width:22, height:22, borderRadius:'50%', background:'#1C1610', border:'2px solid #D4AF77', color:'#D4AF77', fontSize:10, fontWeight:800, fontFamily:'Raleway,sans-serif', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {count > 9 ? '9+' : count}
          </motion.span>
        )}
      </motion.button>

      {/* ── DRAWER ── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={() => setOpen(false)}
              style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(28,22,16,.55)',backdropFilter:'blur(6px)' }}/>

            <motion.div
              initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
              transition={{type:'spring',damping:26,stiffness:280}}
              style={{ position:'fixed',right:0,top:0,bottom:0,width:'min(400px,100vw)',zIndex:201,background:'#FDFAF5',boxShadow:'-8px 0 48px rgba(28,22,16,.18)',display:'flex',flexDirection:'column',fontFamily:'Raleway,sans-serif' }}>

              {/* Header */}
              <div style={{ padding:'20px 20px 14px',borderBottom:'1px solid rgba(154,120,64,.15)',paddingTop:'max(20px,env(safe-area-inset-top,0px))',display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:'#9A7840',letterSpacing:'2px',textTransform:'uppercase' }}>Mon panier</div>
                  <div style={{ fontSize:18,fontWeight:800,color:'#1C1610',marginTop:2,fontFamily:'"Cormorant Garamond",Georgia,serif' }}>
                    {count} article{count > 1 ? 's' : ''}
                  </div>
                </div>
                {cart.length > 0 && (
                  <button onClick={() => { clearCart(); setOpen(false) }}
                    style={{ fontSize:10,fontWeight:700,color:'#C04030',background:'rgba(200,60,60,.08)',border:'1px solid rgba(200,60,60,.2)',padding:'5px 10px',borderRadius:8,cursor:'pointer',fontFamily:'Raleway,sans-serif' }}>
                    Vider
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  style={{ width:36,height:36,borderRadius:'50%',border:'1px solid rgba(154,120,64,.25)',background:'rgba(255,255,255,.8)',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',color:'#6B5030' }}>✕</button>
              </div>

              {/* Items */}
              <div style={{ flex:1,overflowY:'auto',padding:'12px 16px' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign:'center',padding:'48px 20px',color:'#9A8A78' }}>
                    <div style={{ fontSize:48,marginBottom:12,opacity:.3 }}>🛒</div>
                    <div style={{ fontSize:14,fontWeight:600,fontFamily:'"Cormorant Garamond",Georgia,serif' }}>Votre panier est vide</div>
                    <div style={{ fontSize:12,marginTop:6,opacity:.7 }}>Ajoutez des produits depuis la boutique</div>
                    <button onClick={() => setOpen(false)}
                      style={{ marginTop:20,padding:'12px 24px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#9A7840,#D4AF77)',color:'#1C1610',fontSize:13,fontWeight:800,fontFamily:'Raleway,sans-serif' }}>
                      Voir la boutique
                    </button>
                  </div>
                ) : (
                  <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                    {cart.map(item => (
                      <motion.div key={item.product.id} layout
                        style={{ display:'flex',gap:12,padding:'12px 14px',borderRadius:14,background:'#FFFFFF',border:'1px solid rgba(154,120,64,.12)',boxShadow:'0 2px 12px rgba(28,22,16,.04)' }}>
                        {/* Thumb */}
                        <div style={{ width:60,height:60,borderRadius:10,overflow:'hidden',flexShrink:0,background:'linear-gradient(135deg,#F5EDD8,#EAD9B4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28 }}>
                          {item.product.image
                            ? <img src={item.product.image} alt={item.product.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                            : item.product.emoji
                          }
                        </div>
                        {/* Info */}
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:12,fontWeight:700,color:'#1C1610',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.product.name}</div>
                          <div style={{ fontSize:10,color:'#9A8A78',marginTop:1 }}>{item.product.dimensions.split('·')[0].trim()}</div>
                          {/* Qty */}
                          <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:8 }}>
                            <div style={{ display:'flex',alignItems:'center',gap:6,padding:'3px 8px',borderRadius:8,border:'1px solid rgba(154,120,64,.25)',background:'rgba(212,175,119,.06)' }}>
                              <button onClick={() => updateQty(item.product.id, item.quantity - 1)}
                                style={{ width:20,height:20,borderRadius:'50%',border:'none',background:'rgba(154,120,64,.12)',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',color:'#6B5030' }}>−</button>
                              <span style={{ fontSize:12,fontWeight:800,color:'#1C1610',minWidth:16,textAlign:'center' }}>{item.quantity}</span>
                              <button onClick={() => updateQty(item.product.id, item.quantity + 1)}
                                style={{ width:20,height:20,borderRadius:'50%',border:'none',background:'rgba(154,120,64,.12)',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',color:'#6B5030' }}>+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.product.id)}
                              style={{ fontSize:11,color:'#C47070',background:'none',border:'none',cursor:'pointer',fontFamily:'Raleway,sans-serif',fontWeight:600 }}>Retirer</button>
                            {/* Simuler ce produit */}
                            <button onClick={() => { setPendingProductId(item.product.id); router.push(`/simulation?product=${item.product.id}`); setOpen(false) }}
                              style={{ fontSize:11,color:'#9A7840',background:'none',border:'none',cursor:'pointer',fontFamily:'Raleway,sans-serif',fontWeight:700,display:'flex',alignItems:'center',gap:3 }}>
                              📐 Simuler
                            </button>
                          </div>
                        </div>
                        <div style={{ textAlign:'right',flexShrink:0 }}>
                          <div style={{ fontSize:13,fontWeight:800,color:'#9A7840',fontFamily:'"Cormorant Garamond",Georgia,serif' }}>{formatPrice(item.totalDA)}</div>
                          <div style={{ fontSize:9,color:'#B8A898',marginTop:2 }}>HT</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer totaux + actions */}
              {cart.length > 0 && (
                <div style={{ padding:'16px 20px',borderTop:'1px solid rgba(154,120,64,.15)',background:'#FDFAF5',paddingBottom:'max(20px,env(safe-area-inset-bottom,0px))' }}>
                  {/* Totaux */}
                  <div style={{ background:'rgba(212,175,119,.08)',borderRadius:14,padding:'12px 14px',marginBottom:14,border:'1px solid rgba(154,120,64,.15)' }}>
                    {[
                      ['Sous-total HT', fmtDA(subtotal)],
                      [`TVA ${TVA_RATE*100}%`, fmtDA(tva)],
                    ].map(([l,v]) => (
                      <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid rgba(154,120,64,.1)' }}>
                        <span style={{ fontSize:12,color:'#8A7A68' }}>{l}</span>
                        <span style={{ fontSize:12,fontWeight:600,color:'#3A3028' }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex',justifyContent:'space-between',paddingTop:10,marginTop:4 }}>
                      <span style={{ fontSize:14,fontWeight:800,color:'#1C1610',fontFamily:'"Cormorant Garamond",Georgia,serif' }}>TOTAL TTC</span>
                      <span style={{ fontSize:22,fontWeight:800,color:'#9A7840',fontFamily:'"Cormorant Garamond",Georgia,serif' }}>{fmtDA(total)}</span>
                    </div>
                  </div>

                  {/* CTA 1 — WhatsApp Commander */}
                  <motion.button whileTap={{scale:.97}} onClick={handleWhatsApp}
                    style={{ width:'100%',height:52,borderRadius:14,border:'none',cursor:'pointer',
                      background: orderSent ? 'rgba(37,211,102,.15)' : '#25D366',
                      border: orderSent ? '1px solid rgba(37,211,102,.4)' : 'none',
                      color: orderSent ? '#1A7A44' : '#fff',
                      fontSize:14,fontWeight:800,fontFamily:'Raleway,sans-serif',
                      display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                      boxShadow: orderSent ? 'none' : '0 6px 24px rgba(37,211,102,.3)',
                      marginBottom:8,
                    }}>
                    <WAIcon size={20} />
                    {orderSent ? '✅ Message envoyé !' : 'Commander sur WhatsApp'}
                  </motion.button>

                  {/* CTA 2 — Devis PDF */}
                  <button onClick={handleExportPDF} disabled={exporting}
                    style={{ width:'100%',height:48,borderRadius:14,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#9A7840,#D4AF77)',color:'#1C1610',fontSize:13,fontWeight:800,fontFamily:'Raleway,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 4px 20px rgba(154,120,64,.28)',marginBottom:8 }}>
                    {exporting ? '⏳ Génération…' : <><span style={{fontSize:18}}>📄</span> Télécharger devis PDF</>}
                  </button>

                  {/* CTA 3 — Simuler en 3D */}
                  <button onClick={handleSimulateAll}
                    style={{ width:'100%',height:42,borderRadius:12,border:'1.5px solid rgba(154,120,64,.3)',background:'transparent',cursor:'pointer',color:'#6B5030',fontSize:12,fontWeight:700,fontFamily:'Raleway,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                    <span style={{fontSize:16}}>📐</span> Visualiser en simulation 3D
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
