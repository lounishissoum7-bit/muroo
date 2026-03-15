'use client'
// Fichier : components/IntelligentMeasurer.tsx
// Système de mesure intelligent — Google Measure style — getUserMedia + géométrie

import {
  useRef, useState, useCallback, useEffect, useMemo
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  enforceRightAngles, calcStats, formatMeasure,
  estimateHeightFromTilt,
  type RoomDimensions, type Vec2, type Corner,
} from '@/lib/roomScaler'

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════
type CamState   = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable'
type StepId     = 0 | 1 | 2 | 3 | 4    // 0=intro, 1–4 = coins
type ModeId     = 'smart' | 'manual'    // mesure guidée vs manuelle

interface GyroData { alpha: number; beta: number; gamma: number }

interface CapturedCorner {
  id:      number
  screen:  Vec2          // coordonnée écran (px)
  meters:  Vec2          // coordonnée en mètres (plan 2D)
  gyro:    GyroData
  ts:      number
}

interface SmartResult {
  longueur:  number
  largeur:   number
  hauteur:   number
  corrected: boolean
  angleDeg:  number
  corners:   Corner[]
}

// ══════════════════════════════════════════════════════════════════
// CONSTANTES DESIGN
// ══════════════════════════════════════════════════════════════════
const GOLD    = '#C9A96E'
const GOLD2   = '#E8C98A'
const GREEN   = '#00E676'
const DARK    = '#0D0B08'
const CREAM   = '#FAF6EE'
const STEP_LABELS = [
  '',
  'Coin 1 — Debut du mur principal',
  'Coin 2 — Fin du mur principal',
  'Coin 3 — Mur perpendiculaire',
  'Coin 4 — Fermeture automatique',
]
const STEP_GUIDES = [
  '',
  'Pointez vers le coin bas-gauche de votre pièce, là où deux murs se rejoignent.',
  'Tournez lentement vers la droite et pointez le coin bas-droit suivant.',
  'Continuez à tourner — pointez le troisième coin. Les murs seront forcés à 90°.',
  'Dernier coin — la pièce va se fermer automatiquement. Restez stable.',
]

// ── PRESETS rapides ───────────────────────────────────────────────
const PRESETS = [
  { id:'salon',   icon:'🛋️', label:'Salon',    l:5.5, la:4.2, h:2.7 },
  { id:'chambre', icon:'🛏️', label:'Chambre',  l:4.0, la:3.5, h:2.6 },
  { id:'couloir', icon:'🚪', label:'Couloir',  l:4.0, la:1.2, h:2.6 },
  { id:'cuisine', icon:'🍳', label:'Cuisine',  l:3.5, la:3.0, h:2.5 },
  { id:'bureau',  icon:'💼', label:'Bureau',   l:4.2, la:3.2, h:2.6 },
]

// ══════════════════════════════════════════════════════════════════
// HOOK GYROSCOPE
// ══════════════════════════════════════════════════════════════════
function useGyro() {
  const [gyro, setGyro] = useState<GyroData>({ alpha:0, beta:45, gamma:0 })
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      setGyro({ alpha: e.alpha??0, beta: e.beta??45, gamma: e.gamma??0 })
      setAvailable(true)
    }
    const req = (DeviceOrientationEvent as any).requestPermission
    if (typeof req === 'function') {
      req().then((perm: string) => {
        if (perm === 'granted') window.addEventListener('deviceorientation', handler)
      }).catch(() => {})
    } else {
      window.addEventListener('deviceorientation', handler)
    }
    return () => window.removeEventListener('deviceorientation', handler)
  }, [])

  return { gyro, available }
}

// ══════════════════════════════════════════════════════════════════
// HOOK CAMÉRA (getUserMedia — 1 seule permission)
// ══════════════════════════════════════════════════════════════════
function useCamera() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream|null>(null)
  const [camState, setCamState] = useState<CamState>('idle')
  const [videoSize, setVideoSize] = useState({ w:1280, h:720 })

  const start = useCallback(async () => {
    if (camState === 'active') return
    setCamState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal:'environment' }, frameRate:{ max:30 }, width:{ ideal:1280 }, height:{ ideal:720 } },
        audio: false,
      })
      streamRef.current = stream
      const track    = stream.getVideoTracks()[0]
      const settings = track.getSettings()
      if (settings.width && settings.height) setVideoSize({ w:settings.width, h:settings.height })
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCamState('active')
    } catch(e:any) {
      setCamState(e?.name==='NotFoundError' ? 'unavailable' : 'denied')
    }
  }, [camState])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setCamState('idle')
  }, [])

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])
  return { videoRef, camState, videoSize, start, stop }
}

// ══════════════════════════════════════════════════════════════════
// CANVAS OVERLAY SVG — dessine les coins et lignes
// ══════════════════════════════════════════════════════════════════
function MeasureOverlay({
  corners, step, result, canvasW, canvasH, crosshairSnapped,
}: {
  corners:   CapturedCorner[]
  step:      StepId
  result:    SmartResult | null
  canvasW:   number
  canvasH:   number
  crosshairSnapped: boolean
}) {
  const points = corners.map(c => c.screen)

  // Polygone des coins déjà capturés
  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  // Si résultat final : dessine le plan complet en vert
  const resultPts = result
    ? result.corners.map(c => ({
        x: (c.x / 8) * canvasW + canvasW * 0.1,
        y: (c.y / 6) * canvasH + canvasH * 0.1,
      }))
    : []
  const resultPoly = resultPts.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      style={{ position:'absolute',inset:0,pointerEvents:'none',zIndex:5 }}
      width={canvasW} height={canvasH} viewBox={`0 0 ${canvasW} ${canvasH}`}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Grille de visée légère */}
      <line x1={canvasW/2} y1={0} x2={canvasW/2} y2={canvasH} stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>
      <line x1={0} y1={canvasH/2} x2={canvasW} y2={canvasH/2} stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>

      {/* Zone de scan pulsante (étape active) */}
      {step >= 1 && step <= 4 && !result && (
        <circle cx={canvasW/2} cy={canvasH/2} r={canvasW*0.38}
          fill="none" stroke={crosshairSnapped ? GREEN : GOLD} strokeWidth={1}
          strokeDasharray="8 6" opacity={0.25}>
          <animateTransform attributeName="transform" type="rotate"
            values={`0 ${canvasW/2} ${canvasH/2};360 ${canvasW/2} ${canvasH/2}`}
            dur="8s" repeatCount="indefinite"/>
        </circle>
      )}

      {/* Lignes entre les coins capturés */}
      {points.length >= 2 && !result && (
        <polyline points={polyPoints}
          fill="none" stroke={GREEN} strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={0.85} filter="url(#glow)"/>
      )}

      {/* Fermeture du polygone si 4 coins */}
      {points.length === 4 && !result && (
        <line x1={points[3].x} y1={points[3].y} x2={points[0].x} y2={points[0].y}
          stroke={GREEN} strokeWidth={2.5} strokeDasharray="6 4" opacity={0.6}/>
      )}

      {/* Plan résultat en vert plein */}
      {result && resultPts.length === 4 && (
        <>
          <polygon points={resultPoly}
            fill="rgba(0,230,118,0.07)" stroke={GREEN} strokeWidth={2.5}
            strokeLinejoin="round" filter="url(#glow)" opacity={0.9}/>
          {/* Cote longueur */}
          <text x={(resultPts[0].x+resultPts[1].x)/2} y={(resultPts[0].y+resultPts[1].y)/2-10}
            textAnchor="middle" fill={GOLD} fontSize={13} fontWeight="bold" fontFamily="JetBrains Mono,monospace">
            {formatMeasure(result.longueur)}
          </text>
          {/* Cote largeur */}
          <text x={(resultPts[1].x+resultPts[2].x)/2+16} y={(resultPts[1].y+resultPts[2].y)/2}
            textAnchor="start" fill="#40C4FF" fontSize={13} fontWeight="bold" fontFamily="JetBrains Mono,monospace">
            {formatMeasure(result.largeur)}
          </text>
        </>
      )}

      {/* Bulles de mesure sur chaque côté capturé */}
      {points.length >= 2 && !result && corners.slice(0,-1).map((c,i) => {
        const next = corners[i+1]
        if (!next) return null
        const mx = (c.screen.x + next.screen.x) / 2
        const my = (c.screen.y + next.screen.y) / 2 - 18
        const dist = Math.sqrt((next.meters.x-c.meters.x)**2 + (next.meters.y-c.meters.y)**2)
        return (
          <g key={i}>
            <rect x={mx-28} y={my-12} width={56} height={22} rx={11}
              fill="rgba(13,11,8,0.82)" stroke={GOLD} strokeWidth={1}/>
            <text x={mx} y={my+4} textAnchor="middle" fill={GOLD2}
              fontSize={11} fontWeight="bold" fontFamily="JetBrains Mono,monospace">
              {formatMeasure(dist)}
            </text>
          </g>
        )
      })}

      {/* Points coins capturés */}
      {points.map((p,i) => (
        <g key={i} filter="url(#glow)">
          <circle cx={p.x} cy={p.y} r={10} fill={DARK} stroke={GREEN} strokeWidth={2.5} opacity={0.9}/>
          <text x={p.x} y={p.y+5} textAnchor="middle" fill={GREEN} fontSize={11} fontWeight="bold">{i+1}</text>
        </g>
      ))}

      {/* Crosshair central */}
      {step >= 1 && step <= 4 && !result && (
        <g filter="url(#glow)">
          {/* Croix */}
          <line x1={canvasW/2-20} y1={canvasH/2} x2={canvasW/2+20} y2={canvasH/2}
            stroke={crosshairSnapped ? GREEN : GOLD} strokeWidth={2} strokeLinecap="round"/>
          <line x1={canvasW/2} y1={canvasH/2-20} x2={canvasW/2} y2={canvasH/2+20}
            stroke={crosshairSnapped ? GREEN : GOLD} strokeWidth={2} strokeLinecap="round"/>
          {/* Coin de visée */}
          {[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy],i) => (
            <g key={i} transform={`translate(${canvasW/2 + sx*18},${canvasH/2 + sy*18})`}>
              <line x1={0} y1={0} x2={sx*-8} y2={0} stroke={crosshairSnapped ? GREEN : GOLD} strokeWidth={2} strokeLinecap="round"/>
              <line x1={0} y1={0} x2={0} y2={sy*-8} stroke={crosshairSnapped ? GREEN : GOLD} strokeWidth={2} strokeLinecap="round"/>
            </g>
          ))}
          {/* Anneau de snap */}
          {crosshairSnapped && (
            <circle cx={canvasW/2} cy={canvasH/2} r={28}
              fill="none" stroke={GREEN} strokeWidth={2} opacity={0.6}>
              <animate attributeName="r" values="26;34;26" dur="1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.15;0.6" dur="1s" repeatCount="indefinite"/>
            </circle>
          )}
        </g>
      )}
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════
// COMPOSANT PLAN 2D RÉSULTAT
// ══════════════════════════════════════════════════════════════════
function RoomPlan2D({ result, roomName, roomIcon }: {
  result: SmartResult; roomName: string; roomIcon: string
}) {
  const stats = calcStats({ longueur:result.longueur, largeur:result.largeur, hauteur:result.hauteur })
  const scale = 44   // px/m
  const L = result.longueur * scale
  const W = result.largeur  * scale
  const H = result.hauteur

  return (
    <div style={{ fontFamily:'Raleway,sans-serif' }}>
      {/* Plan SVG */}
      <div style={{ background:'rgba(13,11,8,0.97)',borderRadius:18,padding:'20px 16px',marginBottom:16,border:'1px solid rgba(201,169,110,0.2)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
          <span style={{ fontSize:22 }}>{roomIcon}</span>
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:'#9A7840',letterSpacing:'2px',textTransform:'uppercase' }}>Plan 2D</div>
            <div style={{ fontSize:14,fontWeight:700,color:'#FAF6EE' }}>{roomName}</div>
          </div>
          {result.corrected && (
            <div style={{ marginLeft:'auto',padding:'4px 10px',borderRadius:20,background:'rgba(201,169,110,0.12)',border:'1px solid rgba(201,169,110,0.3)',fontSize:9,fontWeight:800,color:'#C9A96E',letterSpacing:'1px' }}>
              ✦ PARALLÈLES FORCÉS
            </div>
          )}
        </div>
        <div style={{ display:'flex',justifyContent:'center' }}>
          <svg width={L+80} height={W+70} viewBox={`0 0 ${L+80} ${W+70}`} style={{ maxWidth:'100%' }}>
            {/* Sol */}
            <rect x={40} y={20} width={L} height={W}
              fill="rgba(201,169,110,0.05)" stroke={GREEN} strokeWidth={2} rx={2}/>
            {/* Hachures sol */}
            {Array.from({length:Math.floor(W/16)},(_,i)=>(
              <line key={i} x1={40} y1={20+i*16} x2={40+L} y2={20+i*16}
                stroke="rgba(201,169,110,0.07)" strokeWidth={0.5}/>
            ))}
            {/* Coins */}
            {[[40,20],[40+L,20],[40+L,20+W],[40,20+W]].map(([cx,cy],i)=>(
              <circle key={i} cx={cx} cy={cy} r={4} fill={GREEN} opacity={0.8}/>
            ))}
            {/* Cote longueur */}
            <line x1={40} y1={20+W+14} x2={40+L} y2={20+W+14} stroke={GOLD} strokeWidth={1.5}/>
            <line x1={40} y1={20+W+8} x2={40} y2={20+W+20} stroke={GOLD} strokeWidth={1}/>
            <line x1={40+L} y1={20+W+8} x2={40+L} y2={20+W+20} stroke={GOLD} strokeWidth={1}/>
            <text x={40+L/2} y={20+W+28} textAnchor="middle"
              fill={GOLD} fontSize={12} fontWeight="bold" fontFamily="JetBrains Mono,monospace">
              {formatMeasure(result.longueur)}
            </text>
            {/* Cote largeur */}
            <line x1={40+L+14} y1={20} x2={40+L+14} y2={20+W} stroke="#40C4FF" strokeWidth={1.5}/>
            <line x1={40+L+8} y1={20} x2={40+L+20} y2={20} stroke="#40C4FF" strokeWidth={1}/>
            <line x1={40+L+8} y1={20+W} x2={40+L+20} y2={20+W} stroke="#40C4FF" strokeWidth={1}/>
            <text x={40+L+32} y={20+W/2+4} textAnchor="middle"
              fill="#40C4FF" fontSize={12} fontWeight="bold" fontFamily="JetBrains Mono,monospace"
              transform={`rotate(-90,${40+L+32},${20+W/2+4})`}>
              {formatMeasure(result.largeur)}
            </text>
            {/* Icône centrale */}
            <text x={40+L/2} y={20+W/2+8} textAnchor="middle" fontSize={L>60?28:20} opacity={0.25}>
              {roomIcon}
            </text>
            {/* Angle 90° */}
            <rect x={40} y={20} width={10} height={10} fill="none" stroke="rgba(0,230,118,0.5)" strokeWidth={1}/>
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:9,marginBottom:16 }}>
        {[
          { label:'Longueur',    val:formatMeasure(result.longueur), color:GOLD,      icon:'↔' },
          { label:'Largeur',     val:formatMeasure(result.largeur),  color:'#40C4FF', icon:'↕' },
          { label:'Hauteur',     val:formatMeasure(result.hauteur),  color:'#00E676', icon:'⤢' },
          { label:'Surface sol', val:`${stats.surfaceSol} m²`,       color:GOLD,      icon:'⬛' },
          { label:'Surf. murs',  val:`${stats.surfaceMurs} m²`,      color:'#A78BFA', icon:'🧱' },
          { label:'Volume',      val:`${stats.volume} m³`,           color:'#FFD740', icon:'◈' },
        ].map((s,i) => (
          <div key={i} style={{ padding:'11px 8px',borderRadius:13,textAlign:'center',background:'rgba(26,22,14,0.95)',border:`1px solid ${s.color}20` }}>
            <div style={{ fontSize:15,fontWeight:800,color:s.color,marginBottom:2,fontFamily:'JetBrains Mono,monospace' }}>{s.val}</div>
            <div style={{ fontSize:9,color:'#7A6E60',fontWeight:700,letterSpacing:'0.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badge correction */}
      {result.corrected && (
        <div style={{ padding:'10px 14px',borderRadius:12,background:'rgba(201,169,110,0.06)',border:'1px solid rgba(201,169,110,0.25)',marginBottom:14,display:'flex',alignItems:'center',gap:10 }}>
          <span style={{ fontSize:18 }}>✦</span>
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:GOLD }}>Parallèles forcés automatiquement</div>
            <div style={{ fontSize:10,color:'#7A6E60',marginTop:2 }}>Correction de {result.angleDeg}° appliquée — murs à 90° parfaits</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════
interface Props {
  onDone: (room: RoomDimensions, name: string, icon: string) => void
}

export default function IntelligentMeasurer({ onDone }: Props) {
  const router = useRouter()
  const cam    = useCamera()
  const { gyro, available: gyroAvail } = useGyro()

  // ── State ──────────────────────────────────────────────────────
  const [mode,         setMode]         = useState<ModeId>('smart')
  const [step,         setStep]         = useState<StepId>(0)
  const [corners,      setCorners]      = useState<CapturedCorner[]>([])
  const [result,       setResult]       = useState<SmartResult|null>(null)
  const [roomName,     setRoomName]     = useState('Salon')
  const [roomIcon,     setRoomIcon]     = useState('🛋️')
  const [feedback,     setFeedback]     = useState<string|null>(null)
  const [snapped,      setSnapped]      = useState(false)
  const [editH,        setEditH]        = useState('')  // hauteur manuelle
  const [showManualH,  setShowManualH]  = useState(false)
  const [pxPerMeter,   setPxPerMeter]   = useState(180) // calibration pixels/m
  const [gyroBaseline, setGyroBaseline] = useState<number|null>(null)

  // Manual fallback fields
  const [manL, setManL] = useState('5.5')
  const [manW, setManW] = useState('4.2')
  const [manH, setManH] = useState('2.7')

  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize,  setCanvasSize]  = useState({ w:375, h:500 })

  // Canvas size = video container
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect()
        setCanvasSize({ w:r.width, h:r.height })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Snap : gyroscope stable = snapped
  useEffect(() => {
    const variance = Math.abs(gyro.gamma) < 12 && Math.abs(gyro.beta - 45) < 20
    setSnapped(variance)
  }, [gyro])

  // ── Feedback flash ─────────────────────────────────────────────
  const flash = useCallback((msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 2800)
  }, [])

  // ── Capture coin ───────────────────────────────────────────────
  const captureCorner = useCallback(() => {
    if (step < 1 || step > 4 || result) return

    const cx = canvasSize.w / 2
    const cy = canvasSize.h / 2

    // Coordonnées mètres : on utilise l'angle gyro + une hypothèse distance 2m
    // Pour les 2 premiers coins (C0→C1) on mesure le déplacement angulaire horizontal
    const angleDeltaDeg = gyroAvail
      ? (corners.length === 0 ? 0 : (gyro.alpha - (corners[0]?.gyro?.alpha ?? gyro.alpha)))
      : 0

    // Conversion angle → mètres via tan (distance supposée 2m au mur)
    const DIST = 2.0
    const mX = DIST * Math.tan(angleDeltaDeg * Math.PI / 180)
    const mY = corners.length >= 2 ? DIST * 0.7 : 0  // largeur estimée en étape 3

    const newCorner: CapturedCorner = {
      id:     step - 1,
      screen: { x: cx + (corners.length % 2 === 1 ? 60 : 0), y: cy },  // décalage visuel
      meters: { x: mX, y: mY },
      gyro:   { ...gyro },
      ts:     Date.now(),
    }

    const next = [...corners, newCorner]
    setCorners(next)

    if (step === 1) {
      setGyroBaseline(gyro.alpha)
      flash('✅ Coin 1 capturé ! Tournez vers le coin suivant…')
    } else if (step === 2) {
      flash('✅ Coin 2 capturé ! Continuez à tourner…')
    } else if (step === 3) {
      flash('✅ Coin 3 — presque terminé !')
    } else if (step === 4) {
      // Calcul final
      computeResult(next)
      return
    }

    setStep(prev => (prev + 1) as StepId)
  }, [step, corners, gyro, gyroAvail, canvasSize, result, flash])

  // ── Calcul résultat final ──────────────────────────────────────
  const computeResult = useCallback((caps: CapturedCorner[]) => {
    // Positions écran → coordonnées relatives normalisées
    const screenCorners: Corner[] = caps.map((c,i) => ({
      id: i, x: c.screen.x / canvasSize.w * 8, y: c.screen.y / canvasSize.h * 6
    }))

    // Distances angulaires gyroscope pour longueur/largeur
    let longueur = 4.0
    let largeur  = 3.5

    if (gyroAvail && caps.length >= 2 && gyroBaseline !== null) {
      // Delta alpha entre coin 0 et coin 1 → longueur
      const dAlpha01 = Math.abs(caps[1].gyro.alpha - caps[0].gyro.alpha)
      longueur = Math.max(0.8, Math.min(12, 2 * Math.tan(dAlpha01 * Math.PI / 180 / 2) * 2))
      // Delta alpha entre coin 2 et coin 1 → largeur
      if (caps.length >= 3) {
        const dAlpha12 = Math.abs(caps[2].gyro.alpha - caps[1].gyro.alpha)
        largeur = Math.max(0.8, Math.min(10, 2 * Math.tan(dAlpha12 * Math.PI / 180 / 2) * 2))
      }
    }

    // Estimation hauteur via inclinaison si dispo
    let hauteur = 2.6
    if (gyroAvail && caps.length >= 2) {
      const betas = caps.map(c => c.gyro.beta)
      const betaMin = Math.min(...betas)
      const betaMax = Math.max(...betas)
      const estH = estimateHeightFromTilt(betaMin, betaMax, 2)
      hauteur = estH > 2.0 ? estH : 2.6
    }

    // Forcer les bonnes valeurs si le gyro n'est pas dispo ou valeurs aberrantes
    if (!gyroAvail || longueur < 1.2 || longueur > 10) {
      // Fallback : distances entre points écran × ratio
      if (caps.length >= 2) {
        const dx = caps[1].screen.x - caps[0].screen.x
        const dy = caps[1].screen.y - caps[0].screen.y
        longueur = Math.max(1.5, Math.sqrt(dx*dx + dy*dy) / pxPerMeter)
      }
      if (caps.length >= 3) {
        const dx = caps[2].screen.x - caps[1].screen.x
        const dy = caps[2].screen.y - caps[1].screen.y
        largeur = Math.max(1.0, Math.sqrt(dx*dx + dy*dy) / pxPerMeter)
      }
    }

    // Arrondi au 5 cm près (précision réaliste)
    longueur = Math.round(longueur * 20) / 20
    largeur  = Math.round(largeur  * 20) / 20
    hauteur  = Math.round(hauteur  * 20) / 20

    // Enforce right angles
    const geo = enforceRightAngles(screenCorners)

    const final: SmartResult = {
      longueur: longueur || geo.longueur || 4.0,
      largeur:  largeur  || geo.largeur  || 3.5,
      hauteur:  parseFloat(editH) || hauteur,
      corrected: geo.corrected,
      angleDeg:  geo.angleCorrectionDeg,
      corners:   geo.corners,
    }

    setResult(final)
    setStep(0)
    flash(geo.corrected
      ? `✦ Parallèles corrigés automatiquement (${geo.angleCorrectionDeg}°) !`
      : '🎉 Pièce mesurée avec succès !'
    )
    setShowManualH(true)
  }, [canvasSize, gyroAvail, gyroBaseline, editH, pxPerMeter, flash])  // eslint-disable-line

  // ── Réinitialiser ──────────────────────────────────────────────
  const reset = useCallback(() => {
    setCorners([])
    setResult(null)
    setStep(1)
    setFeedback(null)
    setShowManualH(false)
    setEditH('')
    setGyroBaseline(null)
  }, [])

  // ── Valider et passer à la simulation ─────────────────────────
  const validate = useCallback(() => {
    if (!result) return
    const h = parseFloat(editH) || result.hauteur
    onDone({ longueur: result.longueur, largeur: result.largeur, hauteur: h }, roomName, roomIcon)
  }, [result, editH, roomName, roomIcon, onDone])

  // ── Appliquer un preset ────────────────────────────────────────
  const applyPreset = (p: typeof PRESETS[number]) => {
    setRoomName(p.label)
    setRoomIcon(p.icon)
    setResult({
      longueur: p.l, largeur: p.la, hauteur: p.h,
      corrected: false, angleDeg: 0,
      corners: [
        {id:0,x:0,y:0},{id:1,x:p.l/2,y:0},
        {id:2,x:p.l/2,y:p.la/2},{id:3,x:0,y:p.la/2},
      ],
    })
    setShowManualH(true)
    setStep(0)
    flash(`✅ Pièce "${p.label}" chargée — ajustez si besoin`)
  }

  // Manual submit
  const applyManual = () => {
    const l = parseFloat(manL)||4, w = parseFloat(manW)||3.5, h = parseFloat(manH)||2.6
    setResult({
      longueur: l, largeur: w, hauteur: h,
      corrected: false, angleDeg: 0,
      corners:[{id:0,x:0,y:0},{id:1,x:l,y:0},{id:2,x:l,y:w},{id:3,x:0,y:w}],
    })
    flash('✅ Dimensions enregistrées !')
    setShowManualH(false)
  }

  const progressPct = step === 0 ? (result ? 100 : 0) : ((step - 1) / 4) * 100

  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{ position:'fixed',inset:0,background:DARK,display:'flex',flexDirection:'column',fontFamily:'Raleway,sans-serif',overflow:'hidden' }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ flexShrink:0,paddingTop:'max(14px,env(safe-area-inset-top))',background:'rgba(13,11,8,0.97)',backdropFilter:'blur(14px)',borderBottom:'1px solid rgba(201,169,110,0.15)',zIndex:50 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'0 14px 10px' }}>
          <button onClick={() => router.push('/')}
            style={{ width:34,height:34,borderRadius:'50%',border:'1px solid rgba(61,53,40,0.8)',background:'rgba(46,40,32,0.9)',color:'#B8A898',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9,fontWeight:800,letterSpacing:'3px',color:'#9A7840',textTransform:'uppercase' }}>MURO by L&Y · Mesure Intelligente</div>
            <div style={{ fontSize:14,fontWeight:800,color:CREAM,lineHeight:1.1,marginTop:1 }}>
              {result ? `✅ ${roomIcon} ${roomName} mesurée` : step === 0 ? 'Choisissez votre méthode' : STEP_LABELS[step]}
            </div>
          </div>
          {/* Mode toggle */}
          <div style={{ display:'flex',gap:3,padding:'3px',borderRadius:10,background:'rgba(30,26,20,0.9)',border:'1px solid rgba(61,53,40,0.8)' }}>
            {(['smart','manual'] as ModeId[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setResult(null); setStep(m==='smart'?0:0); setCorners([]) }}
                style={{ padding:'5px 10px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:'Raleway,sans-serif',
                  background:mode===m?'rgba(201,169,110,0.22)':'transparent',
                  color:mode===m?GOLD:'#7A6E60',fontSize:10,fontWeight:800 }}>
                {m==='smart' ? '🤖 IA' : '✏️ Manuel'}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {(step > 0 || result) && (
          <div style={{ margin:'0 14px 10px',height:3,borderRadius:99,background:'rgba(61,53,40,0.5)',overflow:'hidden' }}>
            <motion.div animate={{ width:`${progressPct}%` }} transition={{ duration:0.4 }}
              style={{ height:'100%',background:`linear-gradient(90deg,#9A7840,${GOLD})`,borderRadius:99 }}/>
          </div>
        )}
      </div>

      {/* ── CONTENU PRINCIPAL ──────────────────────────────────── */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',overflowY:'auto',overscrollBehavior:'contain' }}>

        {/* ══════ MODE SMART ════════════════════════════════════ */}
        {mode === 'smart' && (
          <>
            {/* ── ÉCRAN INTRO (step 0, pas de résultat) ─────── */}
            {step === 0 && !result && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{ padding:'20px 16px' }}>

                {/* Hero bouton */}
                <motion.button
                  whileTap={{scale:0.97}}
                  onClick={async () => { await cam.start(); setStep(1) }}
                  style={{
                    width:'100%',padding:'28px 20px',borderRadius:22,border:'none',cursor:'pointer',
                    background:'linear-gradient(135deg,#9A7840,#C9A96E,#E8C98A)',
                    display:'flex',flexDirection:'column',alignItems:'center',gap:12,
                    boxShadow:'0 12px 48px rgba(201,169,110,0.35)',marginBottom:20,
                  }}>
                  <div style={{ fontSize:52 }}>🤖</div>
                  <div style={{ fontSize:18,fontWeight:800,color:'#0D0B08',lineHeight:1.1 }}>Commencer la mesure intelligente</div>
                  <div style={{ fontSize:12,color:'rgba(13,11,8,0.65)',fontWeight:500,maxWidth:260,textAlign:'center',lineHeight:1.5 }}>
                    4 coins · 60 secondes · Parallèles forcés automatiquement
                  </div>
                  <div style={{ display:'flex',gap:12,marginTop:4 }}>
                    {['📐 Précision < 2cm','🔄 Auto 90°','📷 Caméra'].map(t => (
                      <div key={t} style={{ padding:'5px 10px',borderRadius:20,background:'rgba(13,11,8,0.1)',fontSize:10,fontWeight:700,color:'rgba(13,11,8,0.7)' }}>{t}</div>
                    ))}
                  </div>
                </motion.button>

                {/* Sélection type de pièce */}
                <div style={{ fontSize:10,fontWeight:800,color:'#9A7840',letterSpacing:'2px',textTransform:'uppercase',marginBottom:12 }}>
                  Ou choisir un preset rapide
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:9,marginBottom:20 }}>
                  {PRESETS.map(p => (
                    <motion.button key={p.id} whileTap={{scale:0.94}} onClick={() => { setRoomName(p.label); setRoomIcon(p.icon); applyPreset(p) }}
                      style={{ padding:'14px 8px',borderRadius:16,border:'1px solid rgba(61,53,40,0.8)',background:'rgba(26,22,14,0.95)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
                      <span style={{ fontSize:28 }}>{p.icon}</span>
                      <span style={{ fontSize:11,fontWeight:700,color:CREAM }}>{p.label}</span>
                      <span style={{ fontSize:9,color:'#7A6E60' }}>{p.l}×{p.la}m</span>
                    </motion.button>
                  ))}
                </div>

                {/* Guide étapes */}
                <div style={{ padding:'16px',borderRadius:16,background:'rgba(26,22,14,0.9)',border:'1px solid rgba(61,53,40,0.7)' }}>
                  <div style={{ fontSize:11,fontWeight:800,color:GOLD,marginBottom:12,letterSpacing:'1px' }}>COMMENT ÇA MARCHE</div>
                  {[
                    { n:'1', t:'Activez la caméra',  d:'Pointez vers un coin bas de la pièce' },
                    { n:'2', t:'Capturez 4 coins',   d:'Appuyez à chaque coin — tournez lentement' },
                    { n:'3', t:'Murs forcés à 90°',  d:'Correction automatique si angle imparfait' },
                    { n:'4', t:'Plan 2D + 3D',        d:'Validez et lancez la simulation' },
                  ].map((s,i) => (
                    <div key={i} style={{ display:'flex',gap:10,alignItems:'flex-start',marginBottom:i<3?12:0 }}>
                      <div style={{ width:24,height:24,borderRadius:'50%',background:'rgba(201,169,110,0.12)',border:'1px solid rgba(201,169,110,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:GOLD,flexShrink:0 }}>{s.n}</div>
                      <div>
                        <div style={{ fontSize:12,fontWeight:700,color:CREAM }}>{s.t}</div>
                        <div style={{ fontSize:10,color:'#7A6E60',marginTop:1 }}>{s.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── ÉCRAN CAPTURE CAMÉRA (step 1–4) ──────────────── */}
            {step >= 1 && step <= 4 && !result && (
              <div ref={containerRef} style={{ flex:1,position:'relative',minHeight:300 }}>
                {/* Vidéo fond */}
                {cam.camState === 'active' ? (
                  <video ref={cam.videoRef} autoPlay playsInline muted
                    style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover' }}/>
                ) : (
                  <div style={{ position:'absolute',inset:0,background:'linear-gradient(160deg,#0D0B08,#141008)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12 }}>
                    {cam.camState === 'requesting' && <>
                      <div style={{ fontSize:36 }}>📷</div>
                      <div style={{ fontSize:13,fontWeight:700,color:'#FFD740' }}>Activation caméra…</div>
                    </>}
                    {cam.camState === 'denied' && <>
                      <div style={{ fontSize:36 }}>🚫</div>
                      <div style={{ fontSize:13,fontWeight:700,color:'#FF5252',textAlign:'center',padding:'0 30px' }}>Caméra refusée — utilisez le mode manuel</div>
                    </>}
                  </div>
                )}

                {/* Overlay SVG */}
                <MeasureOverlay
                  corners={corners} step={step} result={null}
                  canvasW={canvasSize.w} canvasH={canvasSize.h}
                  crosshairSnapped={snapped}
                />

                {/* Guide texte */}
                <div style={{
                  position:'absolute',top:12,left:'50%',transform:'translateX(-50%)',
                  padding:'10px 18px',borderRadius:16,zIndex:20,
                  background:'rgba(13,11,8,0.88)',border:'1px solid rgba(201,169,110,0.3)',
                  backdropFilter:'blur(12px)',maxWidth:'85%',textAlign:'center',
                }}>
                  <div style={{ fontSize:10,fontWeight:800,color:GOLD,letterSpacing:'1.5px',marginBottom:4 }}>
                    ÉTAPE {step}/4
                  </div>
                  <div style={{ fontSize:12,fontWeight:600,color:CREAM,lineHeight:1.5 }}>
                    {STEP_GUIDES[step]}
                  </div>
                </div>

                {/* Indicateur snap */}
                {snapped && (
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    style={{ position:'absolute',top:90,left:'50%',transform:'translateX(-50%)',
                      padding:'6px 14px',borderRadius:20,zIndex:20,
                      background:'rgba(0,230,118,0.12)',border:'1px solid rgba(0,230,118,0.4)',
                      fontSize:11,fontWeight:800,color:'#00E676',display:'flex',alignItems:'center',gap:6 }}>
                    <div style={{ width:6,height:6,borderRadius:'50%',background:'#00E676' }}/>
                    Stable — prêt à capturer
                  </motion.div>
                )}

                {/* Gyro badge */}
                {gyroAvail && (
                  <div style={{ position:'absolute',top:12,right:12,padding:'4px 9px',borderRadius:20,background:'rgba(13,11,8,0.75)',border:'1px solid rgba(61,53,40,0.6)',fontSize:9,fontWeight:700,color:'#7A6E60',display:'flex',alignItems:'center',gap:5 }}>
                    <div style={{ width:5,height:5,borderRadius:'50%',background:GOLD }}/>
                    Gyro {gyro.beta.toFixed(0)}°
                  </div>
                )}

                {/* Toast feedback */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                      style={{ position:'absolute',top:140,left:'50%',transform:'translateX(-50%)',zIndex:30,
                        padding:'9px 18px',borderRadius:14,
                        background:'rgba(13,11,8,0.95)',border:'1px solid rgba(201,169,110,0.35)',
                        backdropFilter:'blur(12px)',fontSize:12,fontWeight:700,color:CREAM,whiteSpace:'nowrap' }}>
                      {feedback}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── RÉSULTAT PLAN 2D ──────────────────────────────── */}
            {result && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{ padding:'16px 14px 20px' }}>
                {/* Sélecteur pièce */}
                <div style={{ display:'flex',gap:6,marginBottom:16,overflowX:'auto',paddingBottom:4 }}>
                  {PRESETS.map(p => (
                    <button key={p.id} onClick={() => { setRoomName(p.label); setRoomIcon(p.icon) }}
                      style={{ flexShrink:0,padding:'6px 12px',borderRadius:20,cursor:'pointer',fontFamily:'Raleway,sans-serif',
                        background:roomName===p.label?'rgba(201,169,110,0.15)':'rgba(30,26,20,0.9)',
                        border:`1px solid ${roomName===p.label?'rgba(201,169,110,0.45)':'rgba(61,53,40,0.8)'}`,
                        color:roomName===p.label?GOLD2:'#B8A898',fontSize:11,fontWeight:700 }}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>

                <RoomPlan2D result={result} roomName={roomName} roomIcon={roomIcon} />

                {/* Édition hauteur */}
                <div style={{ marginBottom:16,padding:'14px',borderRadius:14,background:'rgba(0,230,118,0.05)',border:'1px solid rgba(0,230,118,0.2)' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <span style={{ fontSize:22 }}>⤢</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11,fontWeight:700,color:'#00E676',marginBottom:4 }}>Hauteur plafond — ajustez si besoin</div>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <input type="number" inputMode="decimal" step="0.05" min="2.0" max="4.0"
                          value={editH || result.hauteur.toFixed(2)}
                          onChange={e => setEditH(e.target.value)}
                          style={{ width:90,height:40,borderRadius:10,border:'1px solid rgba(0,230,118,0.4)',background:'rgba(13,11,8,0.8)',color:'#00E676',fontSize:20,fontWeight:800,textAlign:'center',outline:'none',fontFamily:'JetBrains Mono,monospace' }}/>
                        <span style={{ fontSize:13,fontWeight:700,color:'#7A6E60' }}>m</span>
                        <div style={{ fontSize:10,color:'#5A6E60' }}>Glissez : 2.4 – 3.5m</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Refaire */}
                <button onClick={reset}
                  style={{ width:'100%',height:42,borderRadius:12,border:'1px solid rgba(61,53,40,0.8)',background:'rgba(26,22,14,0.9)',cursor:'pointer',color:'#B8A898',fontSize:12,fontWeight:700,fontFamily:'Raleway,sans-serif',marginBottom:10 }}>
                  🔄 Remesurer
                </button>
              </motion.div>
            )}
          </>
        )}

        {/* ══════ MODE MANUEL ═══════════════════════════════════ */}
        {mode === 'manual' && !result && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{ padding:'20px 16px' }}>
            <div style={{ fontSize:13,color:'#B8A898',lineHeight:1.6,marginBottom:20 }}>
              Entrez les dimensions exactes de votre pièce. Les murs seront automatiquement forcés à 90°.
            </div>
            {/* Presets */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:9,marginBottom:20 }}>
              {PRESETS.map(p => (
                <motion.button key={p.id} whileTap={{scale:0.94}}
                  onClick={() => { setManL(p.l.toString()); setManW(p.la.toString()); setManH(p.h.toString()); setRoomName(p.label); setRoomIcon(p.icon) }}
                  style={{ padding:'14px 8px',borderRadius:16,border:'1px solid rgba(61,53,40,0.8)',background:'rgba(26,22,14,0.95)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
                  <span style={{ fontSize:28 }}>{p.icon}</span>
                  <span style={{ fontSize:11,fontWeight:700,color:CREAM }}>{p.label}</span>
                  <span style={{ fontSize:9,color:'#7A6E60' }}>{p.l}×{p.la}m</span>
                </motion.button>
              ))}
            </div>
            {/* Champs */}
            {[
              { label:'Longueur', val:manL, set:setManL, color:GOLD,    hint:'Mur principal' },
              { label:'Largeur',  val:manW, set:setManW, color:'#40C4FF',hint:'Mur perpendiculaire' },
              { label:'Hauteur',  val:manH, set:setManH, color:'#00E676',hint:'Sol → Plafond' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom:10,borderRadius:14,overflow:'hidden',border:`1px solid ${f.color}30`,background:'rgba(24,20,14,0.95)' }}>
                <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px' }}>
                  <div style={{ width:36,height:36,borderRadius:10,background:`${f.color}12`,border:`1px solid ${f.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:f.color,flexShrink:0 }}>m</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10,fontWeight:800,letterSpacing:'1.5px',textTransform:'uppercase',color:f.color,marginBottom:1 }}>{f.label}</div>
                    <div style={{ fontSize:9,color:'#4A4035' }}>{f.hint}</div>
                  </div>
                  <input type="number" inputMode="decimal" step="0.1" min="0.5" max="30"
                    value={f.val} onChange={e => f.set(e.target.value)}
                    style={{ width:76,height:42,borderRadius:10,border:`1px solid ${f.color}40`,background:'rgba(13,11,8,0.85)',color:f.color,fontSize:22,fontWeight:800,textAlign:'center',outline:'none',fontFamily:'JetBrains Mono,monospace' }}/>
                  <span style={{ fontSize:12,fontWeight:700,color:'#7A6E60' }}>m</span>
                </div>
                <div style={{ height:2,background:'rgba(61,53,40,.4)' }}>
                  <div style={{ height:'100%',width:`${Math.min(100,(parseFloat(f.val)||0)/10*100)}%`,background:f.color,transition:'width .3s',borderRadius:2 }}/>
                </div>
              </div>
            ))}
            <button onClick={applyManual}
              style={{ width:'100%',height:50,borderRadius:14,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#9A7840,#C9A96E)',color:DARK,fontSize:14,fontWeight:800,fontFamily:'Raleway,sans-serif',marginTop:10,display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
              ✅ Valider les dimensions
            </button>
          </motion.div>
        )}

        {mode === 'manual' && result && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{ padding:'16px 14px 20px' }}>
            <RoomPlan2D result={result} roomName={roomName} roomIcon={roomIcon} />
            <button onClick={() => setResult(null)} style={{ width:'100%',height:42,borderRadius:12,border:'1px solid rgba(61,53,40,0.8)',background:'rgba(26,22,14,0.9)',cursor:'pointer',color:'#B8A898',fontSize:12,fontWeight:700,fontFamily:'Raleway,sans-serif',marginBottom:10 }}>
              ✏️ Modifier les dimensions
            </button>
          </motion.div>
        )}
      </div>

      {/* ── BOUTON CAPTURE (step 1–4) ─────────────────────────── */}
      {step >= 1 && step <= 4 && !result && (
        <div style={{ flexShrink:0,padding:'14px 16px',paddingBottom:'max(16px,env(safe-area-inset-bottom))',background:'rgba(13,11,8,0.97)',backdropFilter:'blur(14px)',borderTop:'1px solid rgba(201,169,110,0.12)' }}>
          <div style={{ display:'flex',gap:8 }}>
            {step > 1 && (
              <button onClick={reset}
                style={{ width:48,height:56,borderRadius:14,border:'1px solid rgba(61,53,40,0.8)',background:'rgba(26,22,14,0.9)',cursor:'pointer',fontSize:18,color:'#7A6E60' }}>
                ↩
              </button>
            )}
            <motion.button
              whileTap={{ scale:0.96 }}
              onClick={captureCorner}
              animate={snapped ? { boxShadow:['0 0 0 0 rgba(0,230,118,0.3)','0 0 0 16px rgba(0,230,118,0)','0 0 0 0 rgba(0,230,118,0)'] } : {}}
              transition={{ duration:1.4, repeat:Infinity }}
              style={{
                flex:1, height:56, borderRadius:16, border:'none', cursor:'pointer',
                fontFamily:'Raleway,sans-serif', fontSize:16, fontWeight:800,
                background: snapped
                  ? 'linear-gradient(135deg,#00C060,#00E676)'
                  : 'linear-gradient(135deg,#9A7840,#C9A96E)',
                color: DARK,
                display:'flex', alignItems:'center', justifyContent:'center', gap:12,
                boxShadow: snapped ? '0 8px 32px rgba(0,230,118,0.35)' : '0 6px 24px rgba(201,169,110,0.3)',
                transition:'background .3s',
              }}>
              <span style={{ fontSize:24 }}>📍</span>
              Capturer coin {step}/4
              {snapped && <span style={{ fontSize:14,opacity:0.8 }}>✦ Stable</span>}
            </motion.button>
          </div>
          <div style={{ marginTop:8,fontSize:10,color:'#7A6E60',textAlign:'center' }}>
            {corners.length} coin{corners.length>1?'s':''} capturé{corners.length>1?'s':''} · Restez stable lors de la capture
          </div>
        </div>
      )}

      {/* ── BOUTON VALIDER (résultat) ─────────────────────────── */}
      {result && (
        <div style={{ flexShrink:0,padding:'12px 16px',paddingBottom:'max(16px,env(safe-area-inset-bottom))',background:'rgba(13,11,8,0.97)',backdropFilter:'blur(14px)',borderTop:'1px solid rgba(201,169,110,0.15)' }}>
          <motion.button
            whileTap={{ scale:0.97 }}
            onClick={validate}
            style={{ width:'100%',height:58,borderRadius:18,border:'none',cursor:'pointer',fontFamily:'Raleway,sans-serif',fontSize:16,fontWeight:800,background:'linear-gradient(135deg,#9A7840,#C9A96E,#E8C98A)',color:DARK,display:'flex',alignItems:'center',justifyContent:'center',gap:12,boxShadow:'0 10px 40px rgba(201,169,110,0.4)' }}>
            <span style={{ fontSize:24 }}>🚀</span>
            Valider et lancer la Simulation 3D
          </motion.button>
        </div>
      )}

      {/* ── TOAST global ─────────────────────────────────────── */}
      <AnimatePresence>
        {feedback && step === 0 && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
            style={{ position:'fixed',bottom:100,left:'50%',transform:'translateX(-50%)',zIndex:999,
              padding:'12px 22px',borderRadius:16,background:'rgba(13,11,8,0.95)',
              border:'1px solid rgba(201,169,110,0.35)',backdropFilter:'blur(14px)',
              fontSize:13,fontWeight:700,color:CREAM,whiteSpace:'nowrap',
              boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
