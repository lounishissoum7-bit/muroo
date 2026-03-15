// Fichier : components/RoomMeasurer.tsx
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calcStats, type RoomDimensions } from '@/lib/roomScaler'

// ── Types de pièces avec presets ─────────────────────────────────
const PRESETS = [
  { id: 'salon',   icon: '🛋️', label: 'Salon',   labelAr: 'الصالون',  l: 5.5, la: 4.2, h: 2.7 },
  { id: 'chambre', icon: '🛏️', label: 'Chambre', labelAr: 'الغرفة',   l: 4.0, la: 3.5, h: 2.6 },
  { id: 'couloir', icon: '🚪', label: 'Couloir', labelAr: 'الممر',    l: 4.0, la: 1.2, h: 2.6 },
  { id: 'cuisine', icon: '🍳', label: 'Cuisine', labelAr: 'المطبخ',   l: 3.5, la: 3.0, h: 2.5 },
  { id: 'bureau',  icon: '💼', label: 'Bureau',  labelAr: 'المكتب',   l: 4.0, la: 3.0, h: 2.6 },
  { id: 'custom',  icon: '⬜', label: 'Autre',   labelAr: 'أخرى',     l: 4.0, la: 3.5, h: 2.6 },
] as const

type CamState = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable'

interface Props {
  onDone: (room: RoomDimensions, name: string, icon: string) => void
}

// ── Composant field numérique ─────────────────────────────────────
function NumField({
  label, value, onChange, color = '#C9A96E', hint
}: {
  label: string; value: string; onChange: (v: string) => void
  color?: string; hint?: string
}) {
  const [focused, setFocused] = useState(false)
  const v = parseFloat(value) || 0
  const pct = Math.min(100, (v / 10) * 100)
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      border: `1px solid ${focused ? color + '70' : 'rgba(61,53,40,0.9)'}`,
      background: focused ? `${color}06` : 'rgba(24,20,14,0.95)',
      transition: 'all .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `${color}14`, border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color,
        }}>m</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: focused ? color : '#7A6E60', marginBottom: 2 }}>{label}</div>
          {hint && <div style={{ fontSize: 9, color: '#4A4035' }}>{hint}</div>}
        </div>
        <input
          type="number" inputMode="decimal" step="0.1" min="0.3" max="30"
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: 76, height: 42, borderRadius: 10, textAlign: 'center', outline: 'none',
            border: `1px solid ${focused ? color + '50' : 'rgba(61,53,40,0.8)'}`,
            background: 'rgba(13,11,8,0.85)', color: focused ? color : '#FAF6EE',
            fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#7A6E60', marginLeft: -4 }}>m</span>
      </div>
      <div style={{ height: 2, background: 'rgba(61,53,40,.5)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width .3s', borderRadius: 2 }} />
      </div>
    </div>
  )
}

// ── Schéma isométrique SVG ────────────────────────────────────────
function IsoSketch({ l, la, h, icon }: { l: number; la: number; h: number; icon: string }) {
  const S = 22  // scale pixels/metre
  const W = l * S, D = la * S, H = h * S * 0.65
  const iso = (x: number, y: number, z: number) => ({
    px: 150 + (x - y) * 0.866,
    py: 90  + (x + y) * 0.5 - z,
  })
  const corners = {
    A: iso(0,0,0), B: iso(W,0,0), C: iso(W,D,0), D2: iso(0,D,0),
    E: iso(0,0,H), F: iso(W,0,H), G: iso(W,D,H), GH: iso(0,D,H),
  }
  const poly = (pts: {px:number;py:number}[]) => pts.map(p=>`${p.px},${p.py}`).join(' ')
  return (
    <svg width={300} height={200} style={{ display: 'block', margin: '0 auto' }}>
      {/* Sol */}
      <polygon points={poly([corners.A,corners.B,corners.C,corners.D2])} fill="rgba(201,169,110,0.07)" stroke="#C9A96E" strokeWidth={1.2} />
      {/* Mur face */}
      <polygon points={poly([corners.A,corners.B,corners.F,corners.E])} fill="rgba(201,169,110,0.05)" stroke="#C9A96E" strokeWidth={1.2} />
      {/* Mur latéral */}
      <polygon points={poly([corners.D2,corners.C,corners.G,corners.GH])} fill="rgba(64,196,255,0.06)" stroke="#40C4FF" strokeWidth={1.2} />
      {/* Arêtes verticales */}
      {([['A','E'],['B','F'],['C','G'],['D2','GH']] as const).map(([a,b],i)=>(
        <line key={i} x1={corners[a].px} y1={corners[a].py} x2={corners[b].px} y2={corners[b].py} stroke="rgba(201,169,110,.25)" strokeWidth={1}/>
      ))}
      {/* Icône */}
      <text x="150" y="115" textAnchor="middle" fontSize={28} opacity={0.5}>{icon}</text>
      {/* Cotes */}
      <text x={(corners.A.px+corners.B.px)/2} y={(corners.A.py+corners.B.py)/2+14} textAnchor="middle" fill="#C9A96E" fontSize={10} fontFamily="JetBrains Mono,monospace" fontWeight="bold">{l.toFixed(1)}m</text>
      <text x={(corners.D2.px+corners.C.px)/2-10} y={(corners.D2.py+corners.C.py)/2+8} textAnchor="middle" fill="#40C4FF" fontSize={10} fontFamily="JetBrains Mono,monospace" fontWeight="bold">{la.toFixed(1)}m</text>
      <text x={corners.E.px-18} y={(corners.A.py+corners.E.py)/2} textAnchor="middle" fill="#00E676" fontSize={10} fontFamily="JetBrains Mono,monospace" fontWeight="bold">{h.toFixed(1)}m</text>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function RoomMeasurer({ onDone }: Props) {
  const [step,       setStep]       = useState<'type'|'dims'|'recap'>('type')
  const [preset,     setPreset]     = useState(PRESETS[0])
  const [longueur,   setLongueur]   = useState('5.5')
  const [largeur,    setLargeur]    = useState('4.2')
  const [hauteur,    setHauteur]    = useState('2.7')
  const [camState,   setCamState]   = useState<CamState>('idle')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream|null>(null)

  const L  = parseFloat(longueur) || 0
  const la = parseFloat(largeur)  || 0
  const H  = parseFloat(hauteur)  || 0
  const stats = calcStats({ longueur: L, largeur: la, hauteur: H })

  // ── Camera ───────────────────────────────────────────────────
  const startCam = useCallback(async () => {
    setCamState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, frameRate: { max: 30 },
                 width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCamState('active')
    } catch (e: any) {
      setCamState(e?.name === 'NotFoundError' ? 'unavailable' : 'denied')
    }
  }, [])

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setCamState('idle')
  }, [])

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  const selectPreset = (p: typeof PRESETS[number]) => {
    setPreset(p)
    setLongueur(p.l.toFixed(1))
    setLargeur(p.la.toFixed(1))
    setHauteur(p.h.toFixed(1))
    setStep('dims')
  }

  const handleDone = () => {
    stopCam()
    onDone({ longueur: L, largeur: la, hauteur: H }, preset.label, preset.icon)
  }

  // ── CAM ERROR MESSAGES ────────────────────────────────────────
  const camMsg: Record<CamState, string> = {
    idle:        '',
    requesting:  'Demande de permission caméra…',
    active:      'Caméra active · visez le mur principal',
    denied:      'Permission caméra refusée — utilisez les champs manuels',
    unavailable: 'Aucune caméra détectée sur cet appareil',
  }
  const camColor: Record<CamState, string> = {
    idle:'#7A6E60', requesting:'#FFD740', active:'#00E676', denied:'#FF5252', unavailable:'#FF5252'
  }

  return (
    <main style={{ position:'fixed', inset:0, background:'#0D0B08', display:'flex', flexDirection:'column', fontFamily:'Raleway,sans-serif' }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ flexShrink:0, paddingTop:'max(14px,env(safe-area-inset-top))', background:'rgba(13,11,8,.97)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(201,169,110,.12)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 14px 12px' }}>
          {step !== 'type' && (
            <button onClick={() => setStep(step==='recap'?'dims':'type')}
              style={{ width:34,height:34,borderRadius:'50%',border:'1px solid rgba(61,53,40,.8)',background:'rgba(46,40,32,.9)',color:'#B8A898',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>←</button>
          )}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9,fontWeight:800,letterSpacing:'3px',textTransform:'uppercase',color:'#7A6E60' }}>MURO by L&Y — Mesure</div>
            <div style={{ fontSize:15,fontWeight:800,color:'#FAF6EE',lineHeight:1.1,marginTop:1 }}>
              {step==='type'?'Choisir la pièce':step==='dims'?`${preset.icon} ${preset.label}`:'Récapitulatif'}
            </div>
          </div>
          <div style={{ display:'flex',gap:4 }}>
            {(['type','dims','recap'] as const).map((s,i)=>(
              <div key={s} style={{ height:5,borderRadius:3,transition:'all .3s',
                width: s===step?20:5,
                background: s===step?'#C9A96E': i<(['type','dims','recap'] as const).indexOf(step)?'#9A7840':'#2E2820' }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENU ────────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', overscrollBehavior:'contain' }}>
        <AnimatePresence mode="wait">

          {/* ── STEP 1 : CHOIX TYPE ────────────────────────────── */}
          {step === 'type' && (
            <motion.div key="type" initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-24}} style={{ padding:'20px 14px' }}>
              <p style={{ fontSize:12,color:'#B8A898',marginBottom:18,lineHeight:1.6 }}>
                Sélectionnez le type de pièce. Les dimensions standards sont pré-remplies — ajustez-les si nécessaire.
              </p>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:9 }}>
                {PRESETS.map(p => (
                  <motion.button key={p.id} whileTap={{scale:.94}} onClick={()=>selectPreset(p)}
                    style={{ padding:'16px 6px',borderRadius:16,border:'1px solid rgba(61,53,40,.8)',background:'rgba(26,22,14,.95)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:7 }}>
                    <span style={{ fontSize:30 }}>{p.icon}</span>
                    <span style={{ fontSize:11,fontWeight:700,color:'#FAF6EE',textAlign:'center',lineHeight:1.2 }}>{p.label}</span>
                    <span style={{ fontSize:9,color:'#7A6E60' }}>{p.l}×{p.la}m</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2 : DIMENSIONS ────────────────────────────── */}
          {step === 'dims' && (
            <motion.div key="dims" initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-24}} style={{ padding:'16px 14px 100px' }}>

              {/* Bouton caméra */}
              <div style={{ marginBottom:16 }}>
                {camState === 'idle' || camState === 'denied' || camState === 'unavailable' ? (
                  <motion.button whileTap={{scale:.97}} onClick={startCam}
                    style={{ width:'100%',padding:'14px 16px',borderRadius:14,border:'1px solid rgba(201,169,110,.3)',background:'rgba(201,169,110,.06)',cursor:'pointer',display:'flex',alignItems:'center',gap:12,fontFamily:'Raleway,sans-serif' }}>
                    <span style={{ fontSize:28 }}>📷</span>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:13,fontWeight:800,color:'#E8C98A' }}>Mesurer avec la caméra</div>
                      <div style={{ fontSize:10,color:'#7A6E60',marginTop:2 }}>Activez la caméra arrière pour visualiser la pièce</div>
                    </div>
                    <span style={{ marginLeft:'auto',fontSize:20 }}>→</span>
                  </motion.button>
                ) : camState === 'requesting' ? (
                  <div style={{ padding:'14px',borderRadius:14,border:'1px solid rgba(255,215,64,.25)',background:'rgba(255,215,64,.06)',fontSize:12,color:'#FFD740',textAlign:'center',fontWeight:600 }}>
                    ⏳ Demande de permission en cours…
                  </div>
                ) : (
                  <div style={{ borderRadius:14,overflow:'hidden',position:'relative' }}>
                    <video ref={videoRef} autoPlay playsInline muted
                      style={{ width:'100%',height:180,objectFit:'cover',display:'block' }} />
                    <div style={{ position:'absolute',top:8,left:8,display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:20,background:'rgba(0,0,0,.6)',backdropFilter:'blur(8px)' }}>
                      <div style={{ width:7,height:7,borderRadius:'50%',background:'#00E676',animation:'pulse 1.5s ease-in-out infinite' }}/>
                      <span style={{ fontSize:10,fontWeight:700,color:'#00E676' }}>CAMÉRA LIVE</span>
                    </div>
                    <button onClick={stopCam} style={{ position:'absolute',top:8,right:8,width:30,height:30,borderRadius:'50%',border:'none',background:'rgba(0,0,0,.7)',color:'#fff',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
                  </div>
                )}
                {camState !== 'idle' && camState !== 'active' && (
                  <div style={{ marginTop:6,fontSize:10,color:camColor[camState],textAlign:'center',fontWeight:600 }}>
                    {camMsg[camState]}
                  </div>
                )}
              </div>

              {/* Schéma 2D live */}
              <div style={{ marginBottom:16,borderRadius:14,background:'rgba(24,20,14,.9)',border:'1px solid rgba(61,53,40,.7)',padding:'14px 8px' }}>
                <IsoSketch l={L||preset.l} la={la||preset.la} h={H||preset.h} icon={preset.icon} />
              </div>

              {/* Champs */}
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                <NumField label="Longueur" value={longueur} onChange={setLongueur} color="#C9A96E" hint="Mur principal (axe X)" />
                <NumField label="Largeur"  value={largeur}  onChange={setLargeur}  color="#40C4FF" hint="Mur perpendiculaire (axe Z)" />
                <NumField label="Hauteur"  value={hauteur}  onChange={setHauteur}  color="#00E676" hint="Sol → Plafond (axe Y)" />
              </div>

              {/* Stats live */}
              {L > 0 && la > 0 && H > 0 && (
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  style={{ marginTop:14,padding:'14px',borderRadius:14,background:'rgba(201,169,110,.05)',border:'1px solid rgba(201,169,110,.15)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
                  {[['Sol',`${stats.surfaceSol} m²`],['Murs',`${stats.surfaceMurs} m²`],['Volume',`${stats.volume} m³`]].map(([l,v])=>(
                    <div key={l} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:15,fontWeight:800,color:'#C9A96E' }}>{v}</div>
                      <div style={{ fontSize:9,color:'#7A6E60',marginTop:2 }}>{l}</div>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── STEP 3 : RÉCAP ─────────────────────────────────── */}
          {step === 'recap' && (
            <motion.div key="recap" initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-24}} style={{ padding:'20px 14px 100px' }}>
              <IsoSketch l={L} la={la} h={H} icon={preset.icon} />
              <div style={{ display:'flex',flexDirection:'column',gap:9,marginTop:16 }}>
                {[['↔ Longueur',`${L.toFixed(2)} m`,'#C9A96E'],['↕ Largeur',`${la.toFixed(2)} m`,'#40C4FF'],['⤢ Hauteur',`${H.toFixed(2)} m`,'#00E676']].map(([label,val,col])=>(
                  <div key={label} style={{ display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderRadius:13,background:'rgba(26,22,14,.95)',border:`1px solid ${col}22` }}>
                    <span style={{ fontSize:13,fontWeight:700,color:col,flex:1 }}>{label}</span>
                    <span style={{ fontSize:20,fontWeight:800,color:col,fontFamily:'JetBrains Mono,monospace' }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginTop:12 }}>
                {[['Surface sol',`${stats.surfaceSol} m²`],['Surface murs',`${stats.surfaceMurs} m²`],['Périmètre',`${stats.perimetre} m`],['Volume',`${stats.volume} m³`]].map(([l,v])=>(
                  <div key={l} style={{ padding:'14px',borderRadius:13,background:'rgba(26,22,14,.95)',border:'1px solid rgba(61,53,40,.8)',textAlign:'center' }}>
                    <div style={{ fontSize:18,fontWeight:800,color:'#C9A96E' }}>{v}</div>
                    <div style={{ fontSize:10,fontWeight:700,color:'#FAF6EE',marginTop:3 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:14,padding:'12px 16px',borderRadius:12,background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.2)',fontSize:11,color:'#A78BFA',lineHeight:1.6 }}>
                💡 Ces mesures seront appliquées exactement à la scène 3D — 1 unité Three.js = 1 mètre réel.
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── FOOTER BOUTON ──────────────────────────────────────── */}
      {step !== 'type' && (
        <div style={{ flexShrink:0,padding:'12px 14px',paddingBottom:'max(14px,env(safe-area-inset-bottom))',background:'rgba(13,11,8,.97)',backdropFilter:'blur(14px)',borderTop:'1px solid rgba(201,169,110,.12)' }}>
          {step === 'dims' ? (
            <button onClick={() => setStep('recap')} disabled={!L||!la||!H}
              style={{ width:'100%',height:52,borderRadius:16,border:'none',cursor:(!L||!la||!H)?'not-allowed':'pointer',fontFamily:'Raleway,sans-serif',fontSize:14,fontWeight:800,
                background:(!L||!la||!H)?'rgba(46,40,32,.9)':'linear-gradient(135deg,#9A7840,#C9A96E)',
                color:(!L||!la||!H)?'#7A6E60':'#0D0B08',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
              Voir le récapitulatif →
            </button>
          ) : (
            <button onClick={handleDone}
              style={{ width:'100%',height:56,borderRadius:16,border:'none',cursor:'pointer',fontFamily:'Raleway,sans-serif',fontSize:15,fontWeight:800,background:'linear-gradient(135deg,#9A7840,#C9A96E)',color:'#0D0B08',display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
              <span style={{ fontSize:22 }}>🚀</span> Lancer la Simulation 3D
            </button>
          )}
        </div>
      )}
    </main>
  )
}
