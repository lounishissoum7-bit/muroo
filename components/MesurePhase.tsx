// @ts-nocheck
// components/MesurePhase.tsx
// PHASE 1 — Saisie des mesures de la pièce (manuelle + caméra)
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { RoomData } from '@/lib/roomScaler'

// ── Types pièce ─────────────────────────────────────────────────
const ROOM_TYPES = [
  { id: 'salon',    label: 'Salon',    icon: '🛋️', l: 5.5, la: 4.2, h: 2.7 },
  { id: 'chambre',  label: 'Chambre',  icon: '🛏️', l: 4.0, la: 3.5, h: 2.6 },
  { id: 'cuisine',  label: 'Cuisine',  icon: '🍳', l: 3.5, la: 3.0, h: 2.5 },
  { id: 'couloir',  label: 'Couloir',  icon: '🚪', l: 4.0, la: 1.2, h: 2.6 },
  { id: 'sdb',      label: 'S. de bain',icon:'🚿', l: 2.5, la: 2.0, h: 2.4 },
  { id: 'custom',   label: 'Autre',    icon: '⬜', l: 4.0, la: 3.5, h: 2.6 },
] as const

type RoomTypeId = typeof ROOM_TYPES[number]['id']

// ── Hook caméra ──────────────────────────────────────────────────
function useCamera() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [active, setActive] = useState(false)

  const start = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = s
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play() }
      setActive(true)
    } catch { setActive(false) }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setActive(false)
  }, [])

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])
  return { videoRef, active, start, stop }
}

// ── Composant principal ──────────────────────────────────────────
export default function MesurePhase({ onDone }: { onDone: (r: RoomData) => void }) {
  const router = useRouter()
  const { videoRef, active: camActive, start: startCam, stop: stopCam } = useCamera()

  const [step,       setStep]       = useState<'type' | 'mesures' | 'recap'>('type')
  const [roomType,   setRoomType]   = useState<RoomTypeId | null>(null)
  const [roomIcon,   setRoomIcon]   = useState('🛋️')
  const [roomLabel,  setRoomLabel]  = useState('Salon')
  const [longueur,   setLongueur]   = useState('')
  const [largeur,    setLargeur]    = useState('')
  const [hauteur,    setHauteur]    = useState('')
  const [activeField,setActiveField]= useState<'longueur'|'largeur'|'hauteur'|null>(null)
  const [camMode,    setCamMode]    = useState(false)

  const selectType = (t: typeof ROOM_TYPES[number]) => {
    setRoomType(t.id)
    setRoomIcon(t.icon)
    setRoomLabel(t.label)
    setLongueur(t.l.toFixed(1))
    setLargeur(t.la.toFixed(1))
    setHauteur(t.h.toFixed(1))
    setStep('mesures')
  }

  const toggleCam = async () => {
    if (camMode) { stopCam(); setCamMode(false) }
    else { setCamMode(true); await startCam() }
  }

  const goRecap = () => {
    if (!longueur || !largeur || !hauteur) return
    setStep('recap')
  }

  const goSim = () => {
    onDone(
      { longueur: parseFloat(longueur) || 4, largeur: parseFloat(largeur) || 3.5, hauteur: parseFloat(hauteur) || 2.6 },
      roomLabel,
      roomIcon,
    )
  }

  // Surface, périmètre, volume
  const L = parseFloat(longueur) || 0
  const la = parseFloat(largeur) || 0
  const H  = parseFloat(hauteur) || 0
  const surface   = L * la
  const perimetre = 2 * (L + la)
  const surfMurs  = perimetre * H

  return (
    <main style={{ position:'fixed',inset:0,background:'#0D0B08',display:'flex',flexDirection:'column',fontFamily:'Raleway,sans-serif' }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{
        flexShrink:0, paddingTop:'max(16px,env(safe-area-inset-top))',
        background:'rgba(13,11,8,0.97)', backdropFilter:'blur(14px)',
        borderBottom:'1px solid rgba(201,169,110,0.12)',
      }}>
        <div style={{ display:'flex',alignItems:'center',gap:12,padding:'0 16px 14px' }}>
          <button onClick={() => step === 'type' ? router.push('/') : setStep(step === 'recap' ? 'mesures' : 'type')}
            style={{ width:36,height:36,borderRadius:'50%',border:'1px solid rgba(61,53,40,0.8)',
              background:'rgba(46,40,32,0.9)',color:'#B8A898',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
            ←
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:'3px',color:'#7A6E60',textTransform:'uppercase',marginBottom:2 }}>
              MURO by L&Y
            </div>
            <div style={{ fontSize:17,fontWeight:800,color:'#FAF6EE',lineHeight:1 }}>
              {step === 'type'   ? 'Choisir la pièce'   :
               step === 'mesures'? `${roomIcon} ${roomLabel}` :
                                   'Récapitulatif'}
            </div>
          </div>
          {/* Étapes */}
          <div style={{ display:'flex',gap:5,alignItems:'center' }}>
            {(['type','mesures','recap'] as const).map((s,i) => (
              <div key={s} style={{
                width: step === s ? 22 : 7, height:7, borderRadius:4, transition:'all 0.3s',
                background: step === s ? '#C9A96E' : i < ['type','mesures','recap'].indexOf(step) ? '#9A7840' : '#2E2820',
              }}/>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENU ─────────────────────────────────────────── */}
      <div style={{ flex:1,overflowY:'auto',overscrollBehavior:'contain' }}>
        <AnimatePresence mode="wait">

          {/* ── STEP 1: TYPE DE PIÈCE ── */}
          {step === 'type' && (
            <motion.div key="type" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
              style={{ padding:'24px 16px' }}>
              <div style={{ fontSize:13,color:'#B8A898',marginBottom:20,lineHeight:1.6 }}>
                Sélectionnez le type de pièce. Les dimensions standard seront pré-remplies
                — vous pourrez les ajuster.
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
                {ROOM_TYPES.map(t => (
                  <motion.button key={t.id} whileTap={{scale:0.95}} onClick={() => selectType(t)}
                    style={{
                      padding:'16px 8px', borderRadius:16, border:'1px solid rgba(61,53,40,0.8)',
                      background:'rgba(30,26,20,0.9)', cursor:'pointer', display:'flex',
                      flexDirection:'column', alignItems:'center', gap:8,
                    }}>
                    <span style={{ fontSize:32 }}>{t.icon}</span>
                    <span style={{ fontSize:11,fontWeight:700,color:'#FAF6EE',textAlign:'center',lineHeight:1.2 }}>{t.label}</span>
                    <span style={{ fontSize:10,color:'#7A6E60' }}>{t.l}×{t.la}m</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: MESURES ── */}
          {step === 'mesures' && (
            <motion.div key="mesures" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
              style={{ padding:'20px 16px 100px' }}>

              {/* Caméra optionnelle */}
              <div style={{ marginBottom:20 }}>
                <button onClick={toggleCam} style={{
                  width:'100%', padding:'12px 16px', borderRadius:14,
                  border:`1px solid ${camMode ? 'rgba(201,169,110,0.4)' : 'rgba(61,53,40,0.8)'}`,
                  background: camMode ? 'rgba(201,169,110,0.08)' : 'rgba(30,26,20,0.9)',
                  color: camMode ? '#E8C98A' : '#B8A898', fontSize:12, fontWeight:700,
                  cursor:'pointer', display:'flex', alignItems:'center', gap:10,
                }}>
                  <span style={{ fontSize:20 }}>📷</span>
                  <span>{camMode ? 'Caméra active — visez le mur pour mesurer' : 'Activer la caméra (facultatif)'}</span>
                  {camActive && <div style={{ width:8,height:8,borderRadius:'50%',background:'#10B981',marginLeft:'auto',flexShrink:0 }}/>}
                </button>

                {camMode && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:180,opacity:1}}
                    style={{ marginTop:8, borderRadius:14, overflow:'hidden', position:'relative' }}>
                    <video ref={videoRef} autoPlay playsInline muted
                      style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                    <div style={{ position:'absolute',inset:0,border:'2px dashed rgba(201,169,110,0.35)',borderRadius:14,
                      display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none' }}>
                      <div style={{ padding:'6px 12px',borderRadius:8,background:'rgba(13,11,8,0.75)',fontSize:11,color:'#E8C98A',fontWeight:600 }}>
                        Saisissez les mesures ci-dessous
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Schéma de la pièce */}
              <RoomSchema longueur={longueur} largeur={largeur} hauteur={hauteur} icon={roomIcon} />

              {/* Champs de saisie */}
              <div style={{ display:'flex',flexDirection:'column',gap:12,marginTop:20 }}>
                <MesureInput label="Longueur" sublabel="Mur principal" value={longueur}
                  onChange={setLongueur} icon="↔" active={activeField==='longueur'}
                  onFocus={() => setActiveField('longueur')} onBlur={() => setActiveField(null)}
                  color="#C9A96E" />
                <MesureInput label="Largeur" sublabel="Mur perpendiculaire" value={largeur}
                  onChange={setLargeur} icon="↕" active={activeField==='largeur'}
                  onFocus={() => setActiveField('largeur')} onBlur={() => setActiveField(null)}
                  color="#40C4FF" />
                <MesureInput label="Hauteur" sublabel="Sol → Plafond" value={hauteur}
                  onChange={setHauteur} icon="⤢" active={activeField==='hauteur'}
                  onFocus={() => setActiveField('hauteur')} onBlur={() => setActiveField(null)}
                  color="#00E676" />
              </div>

              {/* Calculs instantanés */}
              {surface > 0 && (
                <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                  style={{ marginTop:20, padding:'16px', borderRadius:16,
                    background:'rgba(201,169,110,0.05)', border:'1px solid rgba(201,169,110,0.15)' }}>
                  <div style={{ fontSize:10,fontWeight:800,letterSpacing:'2px',color:'#9A7840',textTransform:'uppercase',marginBottom:12 }}>
                    Calculs automatiques
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
                    <CalcStat label="Surface sol" value={`${surface.toFixed(1)} m²`} />
                    <CalcStat label="Périmètre" value={`${perimetre.toFixed(1)} m`} />
                    <CalcStat label="Surface murs" value={`${surfMurs.toFixed(1)} m²`} />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── STEP 3: RÉCAPITULATIF ── */}
          {step === 'recap' && (
            <motion.div key="recap" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
              style={{ padding:'24px 16px 100px' }}>

              {/* Schéma 3D isométrique */}
              <IsoRoom longueur={L} largeur={la} hauteur={H} icon={roomIcon} label={roomLabel} />

              {/* Mesures récapitulatives */}
              <div style={{ display:'flex',flexDirection:'column',gap:10,marginTop:20 }}>
                {[
                  { label:'Longueur', val:`${L.toFixed(2)} m`, color:'#C9A96E', icon:'↔' },
                  { label:'Largeur',  val:`${la.toFixed(2)} m`, color:'#40C4FF', icon:'↕' },
                  { label:'Hauteur',  val:`${H.toFixed(2)} m`,  color:'#00E676', icon:'⤢' },
                ].map((item,i) => (
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 16px',
                    borderRadius:14,background:'rgba(30,26,20,0.9)',border:`1px solid ${item.color}30` }}>
                    <div style={{ width:36,height:36,borderRadius:10,background:`${item.color}12`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:16,color:item.color,border:`1px solid ${item.color}25`,flexShrink:0 }}>
                      {item.icon}
                    </div>
                    <span style={{ flex:1,fontSize:13,fontWeight:600,color:'#B8A898' }}>{item.label}</span>
                    <span style={{ fontSize:18,fontWeight:800,color:item.color }}>{item.val}</span>
                  </div>
                ))}
              </div>

              {/* Stats pro */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:16 }}>
                {[
                  { label:'Surface sol',  val:`${surface.toFixed(2)} m²`,   sub:'plancher' },
                  { label:'Surface murs', val:`${surfMurs.toFixed(2)} m²`,  sub:'revêtement' },
                  { label:'Périmètre',    val:`${perimetre.toFixed(2)} m`,   sub:'linéaire' },
                  { label:'Volume',       val:`${(L*la*H).toFixed(1)} m³`,  sub:'espace' },
                ].map((s,i) => (
                  <div key={i} style={{ padding:'14px',borderRadius:14,
                    background:'rgba(30,26,20,0.9)',border:'1px solid rgba(61,53,40,0.8)',textAlign:'center' }}>
                    <div style={{ fontSize:18,fontWeight:800,color:'#C9A96E',marginBottom:2 }}>{s.val}</div>
                    <div style={{ fontSize:11,fontWeight:700,color:'#FAF6EE',marginBottom:2 }}>{s.label}</div>
                    <div style={{ fontSize:10,color:'#7A6E60' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Note pro */}
              <div style={{ marginTop:16,padding:'12px 16px',borderRadius:12,
                background:'rgba(139,92,246,0.06)',border:'1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ fontSize:11,color:'#A78BFA',fontWeight:600,lineHeight:1.6 }}>
                  💡 Ces mesures seront utilisées pour dimensionner exactement les meubles TV,
                  revêtements et quantités de matériaux dans la simulation 3D.
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── BOUTON BAS ──────────────────────────────────────── */}
      {step !== 'type' && (
        <div style={{
          flexShrink:0, padding:'12px 16px',
          paddingBottom:'max(16px,env(safe-area-inset-bottom))',
          background:'rgba(13,11,8,0.97)', backdropFilter:'blur(14px)',
          borderTop:'1px solid rgba(201,169,110,0.12)',
        }}>
          {step === 'mesures' ? (
            <button onClick={goRecap} disabled={!longueur||!largeur||!hauteur}
              style={{
                width:'100%',height:54,borderRadius:16,border:'none',cursor:'pointer',
                background: (!longueur||!largeur||!hauteur) ? 'rgba(46,40,32,0.9)' : 'linear-gradient(135deg,#9A7840,#C9A96E)',
                color: (!longueur||!largeur||!hauteur) ? '#7A6E60' : '#0D0B08',
                fontSize:14,fontWeight:800,fontFamily:'Raleway,sans-serif',
                display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              }}>
              Voir le récapitulatif →
            </button>
          ) : (
            <button onClick={goSim}
              style={{
                width:'100%',height:58,borderRadius:16,border:'none',cursor:'pointer',
                background:'linear-gradient(135deg,#9A7840,#C9A96E)',
                color:'#0D0B08',fontSize:15,fontWeight:800,fontFamily:'Raleway,sans-serif',
                display:'flex',alignItems:'center',justifyContent:'center',gap:10,
              }}>
              <span style={{ fontSize:22 }}>🚀</span>
              Lancer la Simulation 3D
            </button>
          )}
        </div>
      )}
    </main>
  )
}

// ── Composant champ mesure ───────────────────────────────────────
function MesureInput({ label, sublabel, value, onChange, icon, active, onFocus, onBlur, color }: {
  label:string; sublabel:string; value:string; onChange:(v:string)=>void
  icon:string; active:boolean; onFocus:()=>void; onBlur:()=>void; color:string
}) {
  return (
    <div style={{ borderRadius:16, border:`1px solid ${active ? color+'60' : 'rgba(61,53,40,0.8)'}`,
      background: active ? `${color}06` : 'rgba(30,26,20,0.9)',
      transition:'all 0.2s', overflow:'hidden' }}>
      <div style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 16px' }}>
        <div style={{ width:40,height:40,borderRadius:12,background:`${color}12`,
          border:`1px solid ${color}25`,display:'flex',alignItems:'center',
          justifyContent:'center',fontSize:18,color,flexShrink:0,fontWeight:700 }}>
          {icon}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11,fontWeight:700,color: active ? color : '#B8A898',letterSpacing:'0.5px',marginBottom:2 }}>
            {label.toUpperCase()}
          </div>
          <div style={{ fontSize:10,color:'#7A6E60' }}>{sublabel}</div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
          <input type="number" inputMode="decimal" step="0.1" min="0.5" max="30"
            value={value} onChange={e => onChange(e.target.value)}
            onFocus={onFocus} onBlur={onBlur}
            style={{
              width:80,height:44,borderRadius:10,border:`1px solid ${active ? color+'50':'rgba(61,53,40,0.8)'}`,
              background:'rgba(13,11,8,0.8)',color: active ? color : '#FAF6EE',
              fontSize:22,fontWeight:800,textAlign:'center',outline:'none',
              fontFamily:'JetBrains Mono,monospace',
            }}/>
          <span style={{ fontSize:13,fontWeight:700,color:'#7A6E60' }}>m</span>
        </div>
      </div>
      {/* Barre progressive */}
      <div style={{ height:2,background:'rgba(61,53,40,0.5)' }}>
        <div style={{ height:'100%',background:color,
          width: value ? `${Math.min(100, (parseFloat(value)/12)*100)}%` : '0%',
          transition:'width 0.3s', borderRadius:2 }}/>
      </div>
    </div>
  )
}

// ── Stat calculée ────────────────────────────────────────────────
function CalcStat({ label, value }: { label:string; value:string }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:15,fontWeight:800,color:'#C9A96E',marginBottom:2 }}>{value}</div>
      <div style={{ fontSize:10,color:'#7A6E60' }}>{label}</div>
    </div>
  )
}

// ── Schéma plan 2D de la pièce ───────────────────────────────────
function RoomSchema({ longueur, largeur, hauteur, icon }: {
  longueur:string; largeur:string; hauteur:string; icon:string
}) {
  const L  = parseFloat(longueur) || 4
  const la = parseFloat(largeur)  || 3.5
  const H  = parseFloat(hauteur)  || 2.6
  const maxDim = Math.max(L, la, 8)
  const W = 240
  const scale = W / maxDim
  const rW = L  * scale
  const rH = la * scale

  return (
    <div style={{ display:'flex',justifyContent:'center',padding:'16px 0' }}>
      <div style={{ position:'relative' }}>
        <svg width={W+60} height={rH+70} style={{ overflow:'visible' }}>
          {/* Grille fond */}
          <defs>
            <pattern id="grid" width={scale} height={scale} patternUnits="userSpaceOnUse">
              <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="rgba(61,53,40,0.4)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect x={30} y={20} width={rW} height={rH} fill="url(#grid)" rx={4} />

          {/* Murs */}
          <rect x={30} y={20} width={rW} height={rH} fill="rgba(201,169,110,0.04)"
            stroke="#C9A96E" strokeWidth={2} rx={4} />

          {/* Icône pièce */}
          <text x={30+rW/2} y={20+rH/2+6} textAnchor="middle" fontSize={28} opacity={0.4}>{icon}</text>

          {/* Cote longueur */}
          <line x1={30} y1={20+rH+16} x2={30+rW} y2={20+rH+16} stroke="#C9A96E" strokeWidth={1} strokeDasharray="3,2"/>
          <text x={30+rW/2} y={20+rH+30} textAnchor="middle" fill="#C9A96E"
            fontSize={11} fontFamily="JetBrains Mono,monospace" fontWeight={700}>
            {L.toFixed(1)} m
          </text>

          {/* Cote largeur */}
          <line x1={30+rW+12} y1={20} x2={30+rW+12} y2={20+rH} stroke="#40C4FF" strokeWidth={1} strokeDasharray="3,2"/>
          <text x={30+rW+28} y={20+rH/2+4} textAnchor="middle" fill="#40C4FF"
            fontSize={11} fontFamily="JetBrains Mono,monospace" fontWeight={700} transform={`rotate(90,${30+rW+28},${20+rH/2+4})`}>
            {la.toFixed(1)} m
          </text>
        </svg>

        {/* Badge hauteur */}
        <div style={{ position:'absolute',top:0,left:0,padding:'4px 8px',borderRadius:8,
          background:'rgba(0,230,118,0.12)',border:'1px solid rgba(0,230,118,0.3)',
          fontSize:10,fontWeight:700,color:'#00E676' }}>
          H: {H.toFixed(1)} m
        </div>
      </div>
    </div>
  )
}

// ── Schéma isométrique 3D ────────────────────────────────────────
function IsoRoom({ longueur, largeur, hauteur, icon, label }: {
  longueur:number; largeur:number; hauteur:number; icon:string; label:string
}) {
  const scale = 28
  const L  = longueur * scale
  const la = largeur  * scale
  const H  = hauteur  * scale * 0.7

  // Projection isométrique
  const iso = (x:number,y:number,z:number) => ({
    px: 160 + (x - y) * 0.866,
    py: 80  + (x + y) * 0.5 - z,
  })

  const pts = {
    A: iso(0,0,0), B: iso(L,0,0), C: iso(L,la,0), D: iso(0,la,0),
    E: iso(0,0,H), F: iso(L,0,H), G: iso(L,la,H), GH: iso(0,la,H),
  }

  const poly = (points: {px:number,py:number}[], fill:string, stroke:string) =>
    `M${points.map(p=>`${p.px},${p.py}`).join('L')}Z`

  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 0' }}>
      <svg width={320} height={220} style={{ overflow:'visible' }}>
        {/* Sol */}
        <path d={poly([pts.A,pts.B,pts.C,pts.D], 'rgba(201,169,110,0.06)', '#C9A96E')}
          fill="rgba(201,169,110,0.06)" stroke="#C9A96E" strokeWidth={1.5} opacity={0.7}/>

        {/* Mur gauche */}
        <path d={poly([pts.D,pts.C,pts.G,pts.GH], '#fff', '#40C4FF')}
          fill="rgba(64,196,255,0.05)" stroke="#40C4FF" strokeWidth={1.5} opacity={0.8}/>

        {/* Mur principal */}
        <path d={poly([pts.A,pts.B,pts.F,pts.E], '#fff', '#C9A96E')}
          fill="rgba(201,169,110,0.05)" stroke="#C9A96E" strokeWidth={1.5} opacity={0.8}/>

        {/* Plafond (transparent) */}
        <path d={poly([pts.E,pts.F,pts.G,pts.GH], '#fff', '#fff')}
          fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4,3"/>

        {/* Arêtes verticales */}
        {[[pts.A,pts.E],[pts.B,pts.F],[pts.C,pts.G],[pts.D,pts.GH]].map(([p1,p2],i) => (
          <line key={i} x1={p1.px} y1={p1.py} x2={p2.px} y2={p2.py}
            stroke="rgba(201,169,110,0.3)" strokeWidth={1}/>
        ))}

        {/* Icône */}
        <text x={160} y={140} textAnchor="middle" fontSize={32} opacity={0.6}>{icon}</text>

        {/* Cotes */}
        <text x={(pts.A.px+pts.B.px)/2} y={(pts.A.py+pts.B.py)/2+14}
          textAnchor="middle" fill="#C9A96E" fontSize={10}
          fontFamily="JetBrains Mono,monospace" fontWeight={700}>{longueur.toFixed(1)}m</text>
        <text x={(pts.D.px+pts.C.px)/2-12} y={(pts.D.py+pts.C.py)/2+10}
          textAnchor="middle" fill="#40C4FF" fontSize={10}
          fontFamily="JetBrains Mono,monospace" fontWeight={700}>{largeur.toFixed(1)}m</text>
        <text x={pts.E.px-16} y={(pts.A.py+pts.E.py)/2}
          textAnchor="middle" fill="#00E676" fontSize={10}
          fontFamily="JetBrains Mono,monospace" fontWeight={700}>{hauteur.toFixed(1)}m</text>
      </svg>

      <div style={{ fontSize:12,fontWeight:700,color:'#B8A898',marginTop:-8 }}>
        {icon} {label} · Plan isométrique
      </div>
    </div>
  )
}
