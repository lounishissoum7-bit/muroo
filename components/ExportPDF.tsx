'use client'
import React from 'react'
// Fichier : components/ExportPDF.tsx
// Modal complet : infos client → génération PDF luxe → WhatsApp

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMuroStore, useCartTotal } from '@/lib/store'
import { formatPrice } from '@/lib/products'
import { fmtDA } from '@/lib/calculateDevis'

// ── Types ─────────────────────────────────────────────────────────
interface Props {
  isOpen:          boolean
  onClose:         () => void
  /** ref du canvas Three.js pour screenshot optionnel */
  canvasRef?:      React.RefObject<HTMLCanvasElement>
  /** numéro WhatsApp business (sans +) */
  whatsapp?:       string
}

// ── Composant champ de saisie ─────────────────────────────────────
function Field({
  label, placeholder, value, onChange, icon, type = 'text',
}: {
  label: string; placeholder: string; value: string
  onChange: (v: string) => void; icon: string; type?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      border: `1px solid ${focused ? 'rgba(201,169,110,0.5)' : 'rgba(61,53,40,0.7)'}`,
      background: focused ? 'rgba(201,169,110,0.04)' : 'rgba(20,16,10,0.9)',
      transition: 'all .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: focused ? '#C9A96E' : '#7A6E60',
            letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3,
            fontFamily: 'Raleway,sans-serif' }}>{label}</div>
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            style={{
              width: '100%', border: 'none', outline: 'none',
              background: 'transparent', color: '#FAF6EE',
              fontSize: 14, fontWeight: 600, fontFamily: 'Raleway,sans-serif',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function ExportPDF({ isOpen, onClose, canvasRef, whatsapp = '213xxxxxxxxx' }: Props) {
  const { cart, clientInfo, setClientInfo, lastRoom } = useMuroStore(s => ({
    cart:          s.cart,
    clientInfo:    s.clientInfo,
    setClientInfo: s.setClientInfo,
    lastRoom:      s.lastRoom,
  }))
  const { subtotal, tva, total } = useCartTotal()

  const [step,       setStep]       = useState<'infos' | 'preview' | 'done'>('infos')
  const [generating, setGenerating] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [pdfFilename,setPdfFilename]= useState('')

  // Capturer le canvas Three.js
  const captureCanvas = useCallback(() => {
    if (!canvasRef?.current) return null
    try {
      return canvasRef.current.toDataURL('image/png', 0.85)
    } catch {
      return null
    }
  }, [canvasRef])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const { generateDevisPDF, genDevisNum, today } = await import('@/lib/generateDevisPDF')
      const snap = captureCanvas()
      if (snap) setScreenshot(snap)

      const room = lastRoom
        ? { name: lastRoom.name, icon: lastRoom.icon,
            longueur: lastRoom.longueur, largeur: lastRoom.largeur, hauteur: lastRoom.hauteur }
        : null

      const devisNum = genDevisNum()
      const clientSlug = (clientInfo.name || 'Client')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')

      setPdfFilename(`Devis_MURO_by_LY_${new Date().toISOString().slice(0,10)}_${clientSlug}.pdf`)

      await generateDevisPDF({
        cart,
        room,
        client:    clientInfo,
        devisNum,
        dateStr:   today(),
        whatsapp,
        screenshotDataUrl: snap ?? undefined,
      })
      setStep('done')
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Erreur lors de la génération. Vérifiez votre connexion.')
    } finally {
      setGenerating(false)
    }
  }

  const handleWhatsApp = () => {
    const lines = cart.map(i =>
      `• ${i.product.emoji} ${i.product.name} × ${i.quantity} → ${fmtDA(i.totalDA)}`
    ).join('\n')

    const room = lastRoom
    const roomLine = room
      ? `\n📐 Pièce : ${room.icon} ${room.name} (${room.longueur}×${room.largeur}×${room.hauteur}m)`
      : ''

    const msg = encodeURIComponent(
`Bonjour MURO by L&Y 👋

Je vous envoie mon devis :
👤 ${clientInfo.name || 'Client'} · 📱 ${clientInfo.phone || 'N/A'}${roomLine}

🛒 Produits :
${lines}

💰 HT : ${fmtDA(subtotal)}
   TVA 19% : ${fmtDA(tva)}
   *TOTAL TTC : ${fmtDA(total)}*

📄 Fichier PDF : ${pdfFilename}
📍 Oran — Merci de confirmer disponibilité et délais.`
    )
    window.open(`https://wa.me/${whatsapp}?text=${msg}`, '_blank')
  }

  const isValid = cart.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 400,
              background: 'rgba(13,11,8,0.82)', backdropFilter: 'blur(12px)' }}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 401,
              borderRadius: '24px 24px 0 0',
              background: '#0D0B08',
              border: '1px solid rgba(201,169,110,0.2)',
              borderBottom: 'none',
              maxHeight: '92dvh',
              display: 'flex', flexDirection: 'column',
              fontFamily: 'Raleway,sans-serif',
            }}>

            {/* ── Handle ── */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 99,
                background: 'rgba(201,169,110,0.3)' }}/>
            </div>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px 14px',
              borderBottom: '1px solid rgba(61,53,40,0.6)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(145deg,#9A7840,#C9A96E)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                📄
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#9A7840',
                  letterSpacing: '2px', textTransform: 'uppercase' }}>MURO by L&Y</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FAF6EE',
                  fontFamily: '"Cormorant Garamond",Georgia,serif' }}>
                  {step === 'infos'   ? 'Générer le devis PDF' :
                   step === 'preview' ? 'Aperçu devis' : '✅ Devis prêt !'}
                </div>
              </div>
              <button onClick={onClose}
                style={{ width: 34, height: 34, borderRadius: '50%',
                  border: '1px solid rgba(61,53,40,0.8)', background: 'rgba(46,40,32,0.9)',
                  color: '#B8A898', cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>

            {/* ── Steps indicator ── */}
            <div style={{ display: 'flex', gap: 6, padding: '10px 20px 0', justifyContent: 'center' }}>
              {(['infos','preview','done'] as const).map((s, i) => (
                <div key={s} style={{
                  height: 4, flex: 1, borderRadius: 99, transition: 'all .3s',
                  background: i <= ['infos','preview','done'].indexOf(step)
                    ? '#C9A96E' : 'rgba(61,53,40,0.5)',
                }}/>
              ))}
            </div>

            {/* ── CONTENU scrollable ── */}
            <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>

              {/* ══ ÉTAPE 1 : INFOS CLIENT ══ */}
              {step === 'infos' && (
                <div style={{ padding: '16px 20px 24px' }}>

                  {/* Récap commande */}
                  <div style={{ padding: '14px 16px', borderRadius: 14, marginBottom: 18,
                    background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#7A6E60' }}>
                        {cart.length} article{cart.length > 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#C9A96E',
                        fontFamily: '"Cormorant Garamond",Georgia,serif' }}>
                        {fmtDA(total)} TTC
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {cart.slice(0, 3).map(item => (
                        <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between',
                          fontSize: 11, color: '#8A7860' }}>
                          <span>{item.product.emoji} {item.product.name.split(' ').slice(0,3).join(' ')}</span>
                          <span style={{ color: '#B8A898', fontWeight: 600 }}>{fmtDA(item.totalDA)}</span>
                        </div>
                      ))}
                      {cart.length > 3 && (
                        <div style={{ fontSize: 10, color: '#5A4E42', textAlign: 'right' }}>
                          + {cart.length - 3} autre{cart.length - 3 > 1 ? 's' : ''}…
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Infos client */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9A7840',
                    letterSpacing: '1.5px', textTransform: 'uppercase',
                    marginBottom: 12 }}>
                    Informations client (optionnel)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    <Field label="Nom complet"  placeholder="Votre nom" icon="👤"
                      value={clientInfo.name}  onChange={v => setClientInfo({ name: v })} />
                    <Field label="Téléphone"    placeholder="+213 XX XX XX XX" icon="📱"
                      value={clientInfo.phone} onChange={v => setClientInfo({ phone: v })} type="tel" />
                    <Field label="Adresse"      placeholder="Oran, Algérie" icon="📍"
                      value={clientInfo.address} onChange={v => setClientInfo({ address: v })} />
                  </div>

                  {/* Pièce si dispo */}
                  {lastRoom && (
                    <div style={{ padding: '10px 14px', borderRadius: 12, marginBottom: 16,
                      background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#00E676',
                        marginBottom: 4 }}>✓ Plan inclus dans le PDF</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#B8A898' }}>
                        {lastRoom.icon} {lastRoom.name} · {lastRoom.longueur}×{lastRoom.largeur}×{lastRoom.hauteur}m
                      </div>
                    </div>
                  )}

                  {canvasRef && (
                    <div style={{ padding: '10px 14px', borderRadius: 12, marginBottom: 16,
                      background: 'rgba(201,169,110,0.04)', border: '1px solid rgba(61,53,40,0.6)',
                      display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>🖼️</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A96E' }}>
                          Capture simulation incluse
                        </div>
                        <div style={{ fontSize: 10, color: '#7A6E60', marginTop: 2 }}>
                          La vue 3D actuelle sera ajoutée au PDF
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ ÉTAPE DONE ══ */}
              {step === 'done' && (
                <div style={{ padding: '24px 20px' }}>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                      style={{ fontSize: 64, marginBottom: 12 }}>
                      🎉
                    </motion.div>
                    <div style={{ fontFamily: '"Cormorant Garamond",Georgia,serif',
                      fontSize: 22, fontWeight: 700, color: '#FAF6EE', marginBottom: 6 }}>
                      Devis téléchargé !
                    </div>
                    <div style={{ fontSize: 12, color: '#8A7860', lineHeight: 1.6 }}>
                      Votre PDF professionnel MURO by L&Y<br/>est prêt dans vos téléchargements.
                    </div>
                  </div>

                  {/* Actions post-PDF */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={handleWhatsApp}
                      style={{ height: 54, borderRadius: 14, border: 'none', cursor: 'pointer',
                        background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 800,
                        fontFamily: 'Raleway,sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: '0 6px 24px rgba(37,211,102,0.3)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Envoyer le devis sur WhatsApp
                    </button>

                    <button onClick={() => { setStep('infos'); handleGenerate() }}
                      style={{ height: 48, borderRadius: 14,
                        border: '1px solid rgba(201,169,110,0.3)',
                        background: 'transparent', cursor: 'pointer',
                        color: '#C9A96E', fontSize: 13, fontWeight: 700,
                        fontFamily: 'Raleway,sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      📄 Re-télécharger le PDF
                    </button>

                    <button onClick={onClose}
                      style={{ height: 44, borderRadius: 12,
                        border: '1px solid rgba(61,53,40,0.7)',
                        background: 'rgba(26,22,14,0.9)',
                        cursor: 'pointer', color: '#8A7860', fontSize: 12, fontWeight: 600,
                        fontFamily: 'Raleway,sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── FOOTER BOUTON ── */}
            {step === 'infos' && (
              <div style={{
                padding: '12px 20px',
                paddingBottom: 'max(16px,env(safe-area-inset-bottom,0px))',
                borderTop: '1px solid rgba(61,53,40,0.5)',
                background: 'rgba(13,11,8,0.97)',
              }}>
                {!isValid && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#7A6E60',
                    marginBottom: 8 }}>
                    Ajoutez des produits au panier pour générer un devis
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={isValid ? handleGenerate : undefined}
                  disabled={!isValid || generating}
                  style={{
                    width: '100%', height: 56, borderRadius: 16, border: 'none',
                    cursor: isValid && !generating ? 'pointer' : 'not-allowed',
                    background: isValid
                      ? 'linear-gradient(135deg,#9A7840,#C9A96E,#E8C98A)'
                      : 'rgba(46,40,32,0.8)',
                    color: isValid ? '#0D0B08' : '#5A4E42',
                    fontSize: 15, fontWeight: 800, fontFamily: 'Raleway,sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: isValid ? '0 8px 32px rgba(201,169,110,0.35)' : 'none',
                    transition: 'all .2s',
                  }}>
                  {generating
                    ? <><span style={{ fontSize: 20 }}>⏳</span> Génération en cours…</>
                    : <><span style={{ fontSize: 22 }}>📄</span> Télécharger le devis PDF</>
                  }
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
