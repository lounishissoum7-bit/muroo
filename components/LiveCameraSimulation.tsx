'use client'
import React from 'react'
// Fichier : components/LiveCameraSimulation.tsx
// getUserMedia + Three.js overlay aligné pixel-perfect sur la vidéo
import {
  useRef, useState, useCallback, useEffect, Suspense, useMemo,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, OrbitControls, PerspectiveCamera, Line } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { productDims, wallPosToWorld, WALL_ROTATION, CAT_COLOR, type RoomDimensions } from '@/lib/roomScaler'
import type { PlacedItem } from './ProductPlacer'
import type { Product } from '@/lib/store'

// ══════════════════════════════════════════════════════════════════
// HOOK useCamera — FIX ANDROID/iOS 2026
// Bug corrigé : la <video> doit être dans le DOM AVANT d'assigner srcObject
// Solution : setCamState('active') en premier → React re-render → vidéo montée
//            → attachStream() attache srcObject dans un setTimeout(0)
// ══════════════════════════════════════════════════════════════════
type CamState = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable'

function useCamera() {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const pendingRef  = useRef<MediaStream | null>(null)  // stream en attente de la vidéo
  const [state, setCamState] = useState<CamState>('idle')
  const [aspect, setAspect]  = useState(16 / 9)

  // Appelé après chaque render pour attacher le stream en attente
  useEffect(() => {
    if (!pendingRef.current) return
    const vid = videoRef.current
    if (!vid) return
    const stream = pendingRef.current
    pendingRef.current = null
    vid.srcObject  = stream
    vid.muted      = true
    // play() — gestion des politiques autoplay Android/iOS
    const tryPlay = () => {
      vid.play().catch(() => {
        // Si bloqué par politique autoplay, réessayer au prochain toucher
        document.addEventListener('touchstart', () => vid.play().catch(() => {}), { once: true })
        document.addEventListener('click',      () => vid.play().catch(() => {}), { once: true })
      })
    }
    tryPlay()
  })  // ← sans dépendances : s'exécute après CHAQUE render

  const start = useCallback(async () => {
    // Arrêter stream précédent
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null

    setCamState('requesting')

    try {
      let stream: MediaStream | null = null

      // Tentative 1 — caméra arrière (environment) HD
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width:      { ideal: 1280 },
            height:     { ideal: 720 },
            frameRate:  { ideal: 30, max: 30 },
          },
          audio: false,
        })
      } catch {
        // Tentative 2 — caméra arrière sans contraintes HD
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          })
        } catch {
          // Tentative 3 — n'importe quelle caméra (fallback absolu)
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        }
      }

      streamRef.current = stream
      const track = stream.getVideoTracks()[0]
      if (track) {
        const s = track.getSettings()
        if (s.width && s.height) setAspect(s.width / s.height)
      }

      // ⚠️ ORDRE CRITIQUE : setCamState('active') EN PREMIER
      // → React re-rend le composant → <video> apparaît dans le DOM
      // → useEffect (ci-dessus) attache le stream via pendingRef
      pendingRef.current = stream
      setCamState('active')

    } catch (err: unknown) {
      const name = (err as any)?.name ?? ''
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCamState('unavailable')
      } else {
        // NotAllowedError, PermissionDeniedError, SecurityError
        setCamState('denied')
      }
    }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    pendingRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    streamRef.current = null
    setCamState('idle')
  }, [])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  return { videoRef, state, aspect, start, stop }
}

// ══════════════════════════════════════════════════════════════════
// SCÈNE THREE.JS — pièce 3D + produits
// ══════════════════════════════════════════════════════════════════
function RoomScene({
  room, placed, selectedId, activeWall, pendingProduct,
  onWallHit, onObjSelect,
}: {
  room:           RoomDimensions
  placed:         PlacedItem[]
  selectedId:     string | null
  activeWall:     PlacedItem['wall']
  pendingProduct: Product | null
  onWallHit:      (wall: PlacedItem['wall'], nx: number, ny: number) => void
  onObjSelect:    (id: string) => void
}) {
  const { L, la, H } = { L: room.longueur, la: room.largeur, H: room.hauteur }

  // Matériaux murs semi-transparents pour voir la vidéo
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1C1814', roughness: 0.85, metalness: 0.02,
    transparent: true, opacity: 0.35, side: THREE.FrontSide,
  }), [])
  const wallMatHL = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#231F1A', roughness: 0.8, metalness: 0.02,
    transparent: true, opacity: 0.45,
    emissive: new THREE.Color('#C9A96E'), emissiveIntensity: 0.04,
  }), [])
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#14110A', roughness: 0.95,
    transparent: true, opacity: 0.55,
  }), [])

  // Clic sur mur → coordonnées normalisées
  const hitWall = (wall: PlacedItem['wall'], e: any, spanX: number, spanY: number) => {
    e.stopPropagation()
    if (!pendingProduct) return
    const p = e.point
    let nx = 0, ny = 0
    if (wall === 'front' || wall === 'back') { nx = p.x / (L / 2);  ny = p.y / H }
    else                                     { nx = p.z / (la / 2); ny = p.y / H }
    onWallHit(wall, Math.max(-0.95, Math.min(0.95, nx)), Math.max(0.05, Math.min(0.95, ny)))
  }

  return (
    <>
      {/* ── Éclairage ── */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[L*.6, H*1.4, la*.5]} intensity={0.9} />
      <pointLight position={[0, H*.75, 0]} intensity={0.35} color="#E8C98A" />

      {/* ── Sol ── */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} material={floorMat}>
        <planeGeometry args={[L, la]} />
      </mesh>
      <gridHelper args={[Math.max(L,la)*1.5, 20, '#2E2820', '#1E1C18']} position={[0,0.002,0]} />

      {/* ── Mur PRINCIPAL (front, z=−la/2) ── */}
      <mesh position={[0, H/2, -la/2]}
        material={activeWall==='front' ? wallMatHL : wallMat}
        onClick={e => hitWall('front', e, L, H)}>
        <planeGeometry args={[L, H]} />
      </mesh>

      {/* ── Mur ARRIÈRE (back, z=+la/2) ── */}
      <mesh position={[0, H/2, la/2]} rotation={[0, Math.PI, 0]}
        material={activeWall==='back' ? wallMatHL : wallMat}
        onClick={e => hitWall('back', e, L, H)}>
        <planeGeometry args={[L, H]} />
      </mesh>

      {/* ── Mur GAUCHE (left, x=−L/2) ── */}
      <mesh position={[-L/2, H/2, 0]} rotation={[0, Math.PI/2, 0]}
        material={activeWall==='left' ? wallMatHL : wallMat}
        onClick={e => hitWall('left', e, la, H)}>
        <planeGeometry args={[la, H]} />
      </mesh>

      {/* ── Mur DROIT (right, x=+L/2) ── */}
      <mesh position={[L/2, H/2, 0]} rotation={[0, -Math.PI/2, 0]}
        material={activeWall==='right' ? wallMatHL : wallMat}
        onClick={e => hitWall('right', e, la, H)}>
        <planeGeometry args={[la, H]} />
      </mesh>

      {/* ── Bords sol ── */}
      {[
        [[-L/2,0,-la/2],[L/2,0,-la/2]],
        [[-L/2,0, la/2],[L/2,0, la/2]],
        [[-L/2,0,-la/2],[-L/2,0,la/2]],
        [[ L/2,0,-la/2],[ L/2,0,la/2]],
      ].map((seg,i)=>(
        <Line key={i} points={seg as any} color="#3D3528" lineWidth={1} />
      ))}

      {/* ── Cotes dimensionnelles ── */}
      <DimArrow start={[-L/2,-0.1,-la/2-0.35]} end={[L/2,-0.1,-la/2-0.35]}
        label={`${L.toFixed(2)} m`} color="#C9A96E" />
      <DimArrow start={[-L/2-0.35,-0.1,-la/2]} end={[-L/2-0.35,-0.1,la/2]}
        label={`${la.toFixed(2)} m`} color="#40C4FF" />
      <DimArrow start={[-L/2-0.42,0,-la/2]} end={[-L/2-0.42,H,-la/2]}
        label={`${H.toFixed(2)} m`} color="#00E676" />

      {/* ── Objets placés ── */}
      {placed.map(item => (
        <React.Fragment key={item.id}>
          <PlacedMesh item={item} room={room}
            selected={item.id === selectedId}
            onClick={() => onObjSelect(item.id)} />
        </React.Fragment>
      ))}
    </>
  )
}

// ── Flèche de cote 3D ─────────────────────────────────────────────
function DimArrow({ start, end, label, color }: {
  start: [number,number,number]; end: [number,number,number]
  label: string; color: string
}) {
  const mid: [number,number,number] = [
    (start[0]+end[0])/2, (start[1]+end[1])/2+0.02, (start[2]+end[2])/2
  ]
  return (
    <>
      <Line points={[start, end]} color={color} lineWidth={1.5} />
      <Text position={mid} fontSize={0.09} color={color}
        anchorX="center" anchorY="bottom" outlineWidth={0.007} outlineColor="#0D0B08">
        {label}
      </Text>
    </>
  )
}

// ── Mesh produit placé ────────────────────────────────────────────
function PlacedMesh({ item, room, selected, onClick }: {
  item: PlacedItem; room: RoomDimensions; selected: boolean; onClick: ()=>void
}) {
  const meshRef  = useRef<THREE.Mesh>(null)
  const dims     = productDims(item.product.dimensions)
  const W        = item.scaleW
  const Hh       = item.scaleH
  const col      = CAT_COLOR[item.product.category] ?? '#C9A96E'
  const position = wallPosToWorld({ x: item.normX, y: item.normY * 2 - 1 }, item.wall, room, W, Hh)
  const rotation = WALL_ROTATION[item.wall]

  useFrame(state => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    if (selected) mat.emissiveIntensity = 0.14 + Math.sin(state.clock.elapsedTime * 3) * 0.07
    else           mat.emissiveIntensity = 0.04
  })

  return (
    <group position={position as any} rotation={rotation as any} onClick={onClick}>
      {/* Corps */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[W, Hh, 0.05]} />
        <meshStandardMaterial
          color={selected ? col : new THREE.Color(col).multiplyScalar(0.4).getHexString()}
          roughness={0.3} metalness={0.15}
          emissive={new THREE.Color(col)}
          emissiveIntensity={0.04}
          transparent opacity={0.9}
        />
      </mesh>
      {/* Contour */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(W, Hh, 0.055)]} />
        <lineBasicMaterial color={col} />
      </lineSegments>
      {/* Icône */}
      <Text position={[0, Hh*0.1, 0.03]} fontSize={Math.min(W,Hh)*0.32}
        anchorX="center" anchorY="middle">{item.product.emoji}</Text>
      {/* Dimensions (si sélectionné) */}
      {selected && (
        <>
          <Text position={[0, Hh/2+0.1, 0.02]} fontSize={0.055} color="#FAF6EE"
            anchorX="center" anchorY="bottom" outlineWidth={0.005} outlineColor="#0D0B08">
            {`${W.toFixed(2)}m × ${Hh.toFixed(2)}m`}
          </Text>
          <Text position={[0, -Hh/2-0.09, 0.02]} fontSize={0.05} color={col}
            anchorX="center" anchorY="top" outlineWidth={0.005} outlineColor="#0D0B08">
            {item.product.name.split(' ').slice(0,3).join(' ')}
          </Text>
        </>
      )}
      {/* LED bande TV */}
      {(item.product.category==='tv'||item.product.category==='tv-simple'||item.product.category==='tv-deco') && (
        <mesh position={[0, -Hh/2+0.015, 0.03]}>
          <boxGeometry args={[W*0.88, 0.01, 0.004]} />
          <meshStandardMaterial color="#FFD740" emissive="#FFD740" emissiveIntensity={1.5} />
        </mesh>
      )}
    </group>
  )
}

// ══════════════════════════════════════════════════════════════════
// RÉCAPITULATIF modal
// ══════════════════════════════════════════════════════════════════
import { buildDevis, fmtDA, openWhatsApp, exportPDF, exportCanvasAsImage } from '@/lib/calculateDevis'
import { formatPrice } from '@/lib/products'

function RecapModal({ placed, room, roomName, roomIcon, onClose, canvasRef }: {
  placed: PlacedItem[]; room: RoomDimensions; roomName: string; roomIcon: string
  onClose: () => void; canvasRef: React.RefObject<HTMLCanvasElement>
}) {
  const devis = useMemo(() => buildDevis(
    placed.map(p => ({ product: p.product, qty: 1 })), room, roomName, roomIcon
  ), [placed, room, roomName, roomIcon])
  const [exporting, setExporting] = useState(false)

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{ position:'fixed',inset:0,zIndex:300,background:'rgba(13,11,8,.9)',backdropFilter:'blur(14px)',display:'flex',flexDirection:'column',fontFamily:'Raleway,sans-serif' }}>

      {/* Header */}
      <div style={{ flexShrink:0,paddingTop:'max(14px,env(safe-area-inset-top))',padding:'14px 14px 0',display:'flex',alignItems:'center',gap:10 }}>
        <button onClick={onClose} style={{ width:34,height:34,borderRadius:'50%',border:'1px solid rgba(61,53,40,.8)',background:'rgba(46,40,32,.9)',color:'#B8A898',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:9,fontWeight:800,letterSpacing:'3px',color:'#9A7840',textTransform:'uppercase' }}>MURO by L&Y</div>
          <div style={{ fontSize:16,fontWeight:800,color:'#FAF6EE' }}>Devis · {roomIcon} {roomName}</div>
        </div>
      </div>

      <div style={{ flex:1,overflowY:'auto',padding:'16px 14px 100px' }}>
        {/* Lignes produits */}
        <div style={{ fontSize:10,fontWeight:800,letterSpacing:'2px',color:'#9A7840',textTransform:'uppercase',marginBottom:10 }}>Produits sélectionnés</div>
        <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:20 }}>
          {devis.lines.map((line,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:14,background:'rgba(26,22,14,.9)',border:'1px solid rgba(61,53,40,.8)' }}>
              <span style={{ fontSize:22 }}>{line.product.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12,fontWeight:700,color:'#FAF6EE' }}>{line.product.name}</div>
                <div style={{ fontSize:10,color:'#7A6E60',marginTop:2 }}>{line.product.dimensions}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:13,fontWeight:800,color:'#C9A96E' }}>{fmtDA(line.totalHT)}</div>
                <div style={{ fontSize:9,color:'#7A6E60' }}>{line.product.priceUnit}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div style={{ padding:'16px',borderRadius:16,background:'rgba(26,22,14,.9)',border:'1px solid rgba(61,53,40,.8)',marginBottom:16 }}>
          {[['Sous-total HT',fmtDA(devis.subtotalHT)],['TVA 19%',fmtDA(devis.tva)]].map(([l,v])=>(
            <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(46,40,32,.7)' }}>
              <span style={{ fontSize:12,color:'#B8A898' }}>{l}</span>
              <span style={{ fontSize:12,color:'#B8A898',fontWeight:600 }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex',justifyContent:'space-between',padding:'12px 0 0',marginTop:4 }}>
            <span style={{ fontSize:14,fontWeight:800,color:'#FAF6EE' }}>TOTAL TTC</span>
            <span style={{ fontSize:20,fontWeight:800,color:'#C9A96E',fontFamily:'JetBrains Mono,monospace' }}>{fmtDA(devis.totalTTC)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <button onClick={()=>openWhatsApp(devis)}
            style={{ width:'100%',height:52,borderRadius:14,border:'none',cursor:'pointer',background:'#25D366',color:'#fff',fontSize:14,fontWeight:800,fontFamily:'Raleway,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
            <span style={{ fontSize:20 }}>💬</span> Envoyer sur WhatsApp
          </button>
          <button onClick={async()=>{
              setExporting(true)
              try {
                const { generateDevisPDF, genDevisNum, today } = await import('@/lib/generateDevisPDF')
                const { useMuroStore } = await import('@/lib/store')
                const clientInfo = useMuroStore.getState().clientInfo ?? { name:'', phone:'', address:'Oran' }
                let screenshot: string | undefined
                try {
                  const cv = document.querySelector('canvas') as HTMLCanvasElement|null
                  if (cv) screenshot = cv.toDataURL('image/png', 0.8)
                } catch {}
                await generateDevisPDF({
                  cart: placed.map(p => ({ product:p.product, quantity:1, totalDA:p.product.priceDA })),
                  room: { name:roomName, icon:roomIcon, longueur:room.longueur, largeur:room.largeur, hauteur:room.hauteur },
                  client: clientInfo, devisNum: genDevisNum(), dateStr: today(),
                  whatsapp:'213xxxxxxxxx', screenshotDataUrl: screenshot,
                })
              } catch(e){ console.error(e) } finally { setExporting(false) }
            }}
            style={{ width:'100%',height:52,borderRadius:14,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#9A7840,#C9A96E)',color:'#0D0B08',fontSize:14,fontWeight:800,fontFamily:'Raleway,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
            {exporting ? '⏳ Génération…' : <><span style={{fontSize:20}}>📄</span> Exporter PDF pro</>}
          </button>
          <button onClick={()=>exportCanvasAsImage(canvasRef.current)}
            style={{ width:'100%',height:48,borderRadius:14,border:'1px solid rgba(61,53,40,.8)',background:'rgba(30,26,20,.9)',color:'#B8A898',fontSize:13,fontWeight:700,fontFamily:'Raleway,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer' }}>
            <span style={{fontSize:18}}>🖼️</span> Exporter image HD
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL LiveCameraSimulation
// ══════════════════════════════════════════════════════════════════
interface LiveCamProps {
  room:        RoomDimensions
  roomName:    string
  roomIcon:    string
  placed:      PlacedItem[]
  selectedId:  string | null
  pendingProduct: Product | null
  onWallHit:   (wall: PlacedItem['wall'], nx: number, ny: number) => void
  onObjSelect: (id: string) => void
  onBack:      () => void
  showRecap:   boolean
  onCloseRecap: () => void
  onOpenRecap:  () => void
  photoUrl:    string | null
  viewMode:    'perspective' | 'front' | 'top'
  setViewMode: (m: 'perspective'|'front'|'top') => void
  activeWall:  PlacedItem['wall']
  setActiveWall: (w: PlacedItem['wall']) => void
}

export default function LiveCameraSimulation({
  room, roomName, roomIcon, placed, selectedId, pendingProduct,
  onWallHit, onObjSelect, onBack, showRecap, onCloseRecap, onOpenRecap,
  photoUrl, viewMode, setViewMode, activeWall, setActiveWall,
}: LiveCamProps) {
  const cam = useCamera()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [toast, setToast] = useState<string|null>(null)
  const [beforeAfter, setBeforeAfter] = useState(false)  // toggle avant/après

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 2600)
  }, [])

  // Dès le montage, essayer d'activer la caméra
  useEffect(() => { cam.start() }, [])

  const L = room.longueur, la = room.largeur, H = room.hauteur

  // Position caméra Three.js selon viewMode
  const camPos = useMemo((): [number,number,number] => {
    if (viewMode === 'perspective') return [L*.75, H*.85, la*.85]
    if (viewMode === 'front')       return [0, H/2, la*1.6]
    return [0.01, H*2.8, 0]
  }, [viewMode, L, la, H])

  return (
    <div style={{ position:'fixed',inset:0,background:'#0D0B08',display:'flex',flexDirection:'column',fontFamily:'Raleway,sans-serif' }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ flexShrink:0,paddingTop:'max(12px,env(safe-area-inset-top))',background:'rgba(13,11,8,.88)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(201,169,110,.12)',zIndex:50 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'0 12px 8px' }}>
          <button onClick={onBack} style={{ width:34,height:34,borderRadius:'50%',border:'1px solid rgba(61,53,40,.8)',background:'rgba(46,40,32,.9)',color:'#B8A898',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9,fontWeight:800,letterSpacing:'2.5px',color:'#7A6E60',textTransform:'uppercase' }}>Simulation 3D Live</div>
            <div style={{ fontSize:13,fontWeight:800,color:'#FAF6EE',lineHeight:1.1,marginTop:1 }}>
              {roomIcon} {roomName} · {L}×{la}×{H}m
            </div>
          </div>
          {/* View mode */}
          <div style={{ display:'flex',gap:3,padding:'3px',borderRadius:9,background:'rgba(26,22,14,.9)',border:'1px solid rgba(61,53,40,.8)' }}>
            {(['perspective','front','top'] as const).map((v,i)=>(
              <button key={v} onClick={()=>setViewMode(v)} style={{ width:28,height:25,borderRadius:6,border:'none',cursor:'pointer',background:viewMode===v?'rgba(201,169,110,.2)':'transparent',color:viewMode===v?'#C9A96E':'#7A6E60',fontSize:14 }} title={v}>
                {i===0?'⬛':i===1?'▭':'⊞'}
              </button>
            ))}
          </div>
          {/* Devis CTA */}
          <button onClick={onOpenRecap} style={{ height:34,padding:'0 12px',borderRadius:10,border:'none',cursor:'pointer',background:placed.length>0?'linear-gradient(135deg,#9A7840,#C9A96E)':'rgba(30,26,20,.9)',color:placed.length>0?'#0D0B08':'#7A6E60',fontSize:10,fontWeight:800,fontFamily:'Raleway,sans-serif',display:'flex',alignItems:'center',gap:4 }}>
            📊 {placed.length > 0 ? `${placed.length} produit${placed.length>1?'s':''}` : 'Devis'}
          </button>
        </div>
        {/* Wall selector */}
        <div style={{ display:'flex',gap:0,padding:'0 12px 6px' }}>
          {([['front','🧱','Principal'],['back','🔲','Arrière'],['left','◀','Gauche'],['right','▶','Droit']] as const).map(([w,ic,lb])=>(
            <button key={w} onClick={()=>setActiveWall(w)} style={{ flex:1,padding:'6px 2px',border:'none',cursor:'pointer',background:'transparent',borderBottom:`2px solid ${activeWall===w?'#C9A96E':'transparent'}`,color:activeWall===w?'#C9A96E':'#7A6E60',fontSize:9,fontWeight:800,fontFamily:'Raleway,sans-serif',display:'flex',flexDirection:'column',alignItems:'center',gap:1 }}>
              <span style={{fontSize:13}}>{ic}</span>{lb}
            </button>
          ))}
        </div>
      </div>

      {/* ── ZONE VIDÉO + CANVAS 3D ──────────────────────────── */}
      <div style={{ flex:1,position:'relative',overflow:'hidden',minHeight:0 }}>

        {/* FOND photo overlay */}
        {photoUrl && (
          <img src={photoUrl} alt="overlay"
            style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:2 }} />
        )}

        {/* ⚠️ VIDEO TOUJOURS DANS LE DOM — display:none si inactif
            CRUCIAL : videoRef.current doit exister AVANT qu'on fasse srcObject = stream */}
        <video
          ref={cam.videoRef}
          autoPlay playsInline muted
          style={{
            position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', zIndex:1,
            opacity:   cam.state === 'active' && !photoUrl ? 1 : 0,
            display:   'block',
            pointerEvents: cam.state === 'active' ? 'none' : 'none',
          }}
        />

        {/* Fallback fond + messages état — masqué quand caméra active */}
        {(cam.state !== 'active' || photoUrl) && (
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(160deg,#0D0B08,#141008)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16 }}>
            {cam.state === 'requesting' && (
              <>
                <div style={{ fontSize:40 }}>📷</div>
                <div style={{ fontSize:13,fontWeight:700,color:'#FFD740' }}>Activation de la caméra…</div>
              </>
            )}
            {cam.state === 'denied' && (
              <>
                <div style={{ fontSize:40 }}>🚫</div>
                <div style={{ fontSize:13,fontWeight:700,color:'#FF5252',textAlign:'center',padding:'0 20px' }}>Permission caméra refusée</div>
                <div style={{ fontSize:11,color:'#7A6E60',textAlign:'center',padding:'0 20px',lineHeight:1.6,marginTop:4 }}>
                  Android : Paramètres → Chrome → Autorisations → Caméra ✓<br/>
                  iOS : Réglages → Safari → Caméra → Autoriser
                </div>
              </>
            )}
            {cam.state === 'unavailable' && (
              <>
                <div style={{ fontSize:40 }}>📵</div>
                <div style={{ fontSize:13,fontWeight:700,color:'#FF5252' }}>Aucune caméra détectée</div>
              </>
            )}
            {(cam.state === 'idle') && (
              <button onClick={cam.start}
                style={{ padding:'16px 32px',borderRadius:16,border:'none',cursor:'pointer',
                  background:'linear-gradient(135deg,#9A7840,#C9A96E)',color:'#0D0B08',
                  fontSize:14,fontWeight:800,fontFamily:'Raleway,sans-serif',
                  display:'flex',alignItems:'center',gap:10,
                  boxShadow:'0 8px 32px rgba(201,169,110,0.4)' }}>
                <span style={{fontSize:24}}>📷</span> Activer la caméra
              </button>
            )}
          {(cam.state === 'denied' || cam.state === 'unavailable') && (
              <button onClick={cam.start}
                style={{ padding:'14px 28px',borderRadius:14,cursor:'pointer',
                  background:'rgba(201,169,110,0.15)',color:'#C9A96E',
                  fontSize:13,fontWeight:800,fontFamily:'Raleway,sans-serif',
                  border:'1.5px solid rgba(201,169,110,0.4)',
                  display:'flex',alignItems:'center',gap:8 }}>
                <span style={{fontSize:20}}>🔄</span> Réessayer la caméra
              </button>
            )}
          </div>
        )}

        {/* OVERLAY THREE.JS — alpha transparent pour voir le fond */}
        <Canvas
          ref={canvasRef as any}
          shadows
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          style={{ position:'absolute',inset:0,width:'100%',height:'100%',background:'transparent' }}
          onCreated={({ gl }) => { gl.setClearColor(0x000000, 0) }}
        >
          <PerspectiveCamera makeDefault position={camPos} fov={52} />
          <Suspense fallback={null}>
            <RoomScene
              room={room}
              placed={placed}
              selectedId={selectedId}
              activeWall={activeWall}
              pendingProduct={pendingProduct}
              onWallHit={onWallHit}
              onObjSelect={onObjSelect}
            />
          </Suspense>
          <OrbitControls enableDamping dampingFactor={0.06}
            maxPolarAngle={Math.PI/2+0.2} minDistance={0.5} maxDistance={25} />
        </Canvas>

        {/* ── HUD Overlays ── */}

        {/* Status caméra */}
        <div style={{ position:'absolute',top:10,left:10,display:'flex',gap:6,flexWrap:'wrap',zIndex:10,pointerEvents:'none' }}>
          {cam.state === 'active' && (
            <div style={{ display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,background:'rgba(0,0,0,.65)',backdropFilter:'blur(8px)',border:'1px solid rgba(0,230,118,.3)' }}>
              <div style={{ width:7,height:7,borderRadius:'50%',background:'#00E676',animation:'pulse 1.5s ease-in-out infinite' }}/>
              <span style={{ fontSize:10,fontWeight:700,color:'#00E676' }}>LIVE</span>
            </div>
          )}
          {placed.length > 0 && (
            <div style={{ padding:'4px 10px',borderRadius:20,background:'rgba(0,0,0,.65)',backdropFilter:'blur(8px)',border:'1px solid rgba(201,169,110,.25)',fontSize:10,fontWeight:700,color:'#C9A96E' }}>
              {placed.length} obj · Mur {activeWall}
            </div>
          )}
        </div>

        {/* Avant/Après toggle */}
        {photoUrl && (
          <button onClick={()=>setBeforeAfter(!beforeAfter)}
            style={{ position:'absolute',top:10,right:10,zIndex:20,padding:'7px 14px',borderRadius:20,border:'1px solid rgba(201,169,110,.3)',background:'rgba(13,11,8,.8)',backdropFilter:'blur(10px)',color:'#C9A96E',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'Raleway,sans-serif' }}>
            {beforeAfter ? '✨ Après' : '📷 Avant'} →
          </button>
        )}

        {/* Guide placement */}
        {pendingProduct && (
          <div style={{ position:'absolute',bottom:10,left:'50%',transform:'translateX(-50%)',zIndex:10,padding:'9px 16px',borderRadius:14,background:'rgba(13,11,8,.9)',border:'1px solid rgba(201,169,110,.35)',backdropFilter:'blur(12px)',fontSize:12,fontWeight:700,color:'#E8C98A',display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap' }}>
            <span style={{fontSize:18}}>{pendingProduct.emoji}</span>
            Touchez le mur {activeWall==='front'?'principal':activeWall} pour placer
          </div>
        )}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
              style={{ position:'absolute',top:50,left:'50%',transform:'translateX(-50%)',zIndex:30,padding:'9px 18px',borderRadius:14,whiteSpace:'nowrap',background:'rgba(13,11,8,.95)',border:'1px solid rgba(201,169,110,.3)',backdropFilter:'blur(12px)',fontSize:12,fontWeight:600,color:'#FAF6EE' }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Caméra stop button */}
        {cam.state === 'active' && (
          <button onClick={cam.stop}
            style={{ position:'absolute',bottom:10,right:10,zIndex:10,padding:'6px 12px',borderRadius:10,border:'1px solid rgba(61,53,40,.7)',background:'rgba(13,11,8,.8)',backdropFilter:'blur(8px)',color:'#7A6E60',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Raleway,sans-serif' }}>
            Stopper cam
          </button>
        )}
      </div>

      {/* ── RÉCAP MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showRecap && (
          <RecapModal
            placed={placed} room={room} roomName={roomName} roomIcon={roomIcon}
            onClose={onCloseRecap} canvasRef={canvasRef as any}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
