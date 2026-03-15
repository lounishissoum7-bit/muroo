// @ts-nocheck
import React from 'react'
// Fichier : components/Simulation3D.tsx
// Caméra réelle via getUserMedia — ZERO WebXR — fonctionne sur tout Android/iPhone
'use client'

import {
  useRef, useEffect, useState, useCallback, Suspense
} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, Box, Plane, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useMuroStore } from '@/lib/store'
import type { Product } from '@/lib/store'
import { PRODUCTS, formatPrice } from '@/lib/products'
import ModelViewer from '@/components/ModelViewer'

interface ARSegment {
  id: string; p1: THREE.Vector3; p2: THREE.Vector3
  type: 'wall' | 'door' | 'window'; distM: number
}
interface PlacedMesh {
  id: string; product: Product
  position: [number, number, number]; rotation: number
}
type CamState = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable'

// ── HOOK CAMÉRA ──────────────────────────────────────────────
function useCamera() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [camState, setCamState] = useState<CamState>('idle')

  const startCamera = useCallback(async () => {
    if (camState === 'active' || camState === 'requesting') return
    setCamState('requesting')
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setCamState('active')
    } catch (err: any) {
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
      setCamState(isDenied ? 'denied' : 'unavailable')
    }
  }, [camState])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCamState('idle')
  }, [])

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])
  return { videoRef, camState, startCamera, stopCamera }
}

// ── PRODUCT MESH ─────────────────────────────────────────────
function ProductMesh({ product, position, rotation, selected, onPress }: {
  product: Product; position: [number,number,number]
  rotation: number; selected: boolean; onPress: () => void
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => { if (ref.current && selected) ref.current.rotation.y += 0.008 })
  const dims = parseDims(product.dimensions)
  return (
    <group ref={ref} position={position} rotation={[0, rotation, 0]} onClick={onPress}>
      <Box args={[dims.w, dims.h, dims.d]}>
        <meshStandardMaterial color={selected ? '#E8C98A' : prodColor(product.category)}
          roughness={0.4} metalness={product.category === 'lumiere' ? 0.7 : 0.1}
          emissive={selected ? '#C9A96E' : '#000'} emissiveIntensity={selected ? 0.15 : 0} />
      </Box>
      {product.category === 'tv' && (
        <Box args={[dims.w*0.95, 0.02, 0.02]} position={[0, -dims.h/2+0.01, dims.d/2+0.01]}>
          <meshStandardMaterial color="#FFD740" emissive="#FFD740" emissiveIntensity={0.8} />
        </Box>
      )}
      {selected && (
        <Text position={[0, dims.h/2+0.2, 0]} fontSize={0.08} color="#E8C98A"
          anchorX="center" anchorY="middle" outlineWidth={0.004} outlineColor="#0D0B08">
          {product.name}
        </Text>
      )}
      <Plane args={[dims.w*1.2, dims.d*1.2]} rotation={[-Math.PI/2,0,0]}
        position={[0,-dims.h/2-0.001,0]}>
        <meshBasicMaterial color="#000" transparent opacity={selected ? 0.28 : 0.14} />
      </Plane>
    </group>
  )
}

// ── MESURE SEGMENT ───────────────────────────────────────────
function MeasureSeg({ seg }: { seg: ARSegment }) {
  const mid   = new THREE.Vector3().addVectors(seg.p1, seg.p2).multiplyScalar(0.5)
  const dir   = new THREE.Vector3().subVectors(seg.p2, seg.p1)
  const len   = dir.length()
  const angle = Math.atan2(dir.x, dir.z)
  const col   = seg.type === 'wall' ? '#00E676' : seg.type === 'door' ? '#FFD740' : '#40C4FF'
  return (
    <group>
      <mesh position={[mid.x,mid.y,mid.z]} rotation={[0,angle,0]}>
        <boxGeometry args={[0.015,0.015,len]} /><meshBasicMaterial color={col} />
      </mesh>
      {[seg.p1, seg.p2].map((pt,i) => (
        <mesh key={i} position={[pt.x,pt.y,pt.z]}>
          <sphereGeometry args={[0.04,10,10]} /><meshBasicMaterial color={col} />
        </mesh>
      ))}
      <Text position={[mid.x,mid.y+0.18,mid.z]} fontSize={0.1} color={col}
        anchorX="center" anchorY="middle" outlineWidth={0.005} outlineColor="#0D0B08">
        {`${seg.distM.toFixed(2)} m`}
      </Text>
    </group>
  )
}

// ── FLOOR + DEMO ROOM ────────────────────────────────────────
function ARFloor({ onClick }: { onClick: (p: THREE.Vector3) => void }) {
  return (
    <Plane args={[20,20]} rotation={[-Math.PI/2,0,0]} position={[0,0,0]}
      onClick={e => { e.stopPropagation(); onClick(e.point) }}>
      <meshBasicMaterial transparent opacity={0} />
    </Plane>
  )
}
function DemoRoom() {
  return (
    <group>
      <Plane args={[8,8]} rotation={[-Math.PI/2,0,0]}>
        <meshStandardMaterial color="#1A1610" roughness={0.9} />
      </Plane>
      <Plane args={[8,3.2]} position={[0,1.6,-4]}>
        <meshStandardMaterial color="#221E18" roughness={0.8} />
      </Plane>
      <Plane args={[8,3.2]} rotation={[0,Math.PI/2,0]} position={[-4,1.6,0]}>
        <meshStandardMaterial color="#1E1A14" roughness={0.8} />
      </Plane>
      <gridHelper args={[8,16,'#3D3528','#2A2418']} position={[0,0.001,0]} />
    </group>
  )
}

// ── SCÈNE ────────────────────────────────────────────────────
function Scene({ segments, placed, selectedId, nextPoint, onFloorClick, onObjectClick, demo }: {
  segments: ARSegment[]; placed: PlacedMesh[]; selectedId: string | null
  nextPoint: THREE.Vector3 | null; onFloorClick: (p: THREE.Vector3) => void
  onObjectClick: (id: string) => void; demo: boolean
}) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4,6,3]} intensity={1.3} castShadow />
      <pointLight position={[0,3,0]} intensity={0.5} color="#E8C98A" />
      {demo && <DemoRoom />}
      <ARFloor onClick={onFloorClick} />
      {segments.map(s => <MeasureSeg key={s.id} seg={s} />)}
      {nextPoint && (
        <mesh position={[nextPoint.x,nextPoint.y,nextPoint.z]}>
          <sphereGeometry args={[0.05,10,10]} /><meshBasicMaterial color="#FFD740" />
        </mesh>
      )}
      {placed.map(pm => (
        <Suspense key={pm.id} fallback={null}>
          <ModelViewer product={pm.product} position={pm.position}
            rotation={pm.rotation} selected={pm.id === selectedId}
            onClick={() => onObjectClick(pm.id)} />
        </Suspense>
      ))}
    </>
  )
}

// ── ÉCRAN PERMISSION ─────────────────────────────────────────
function PermScreen({ state, onRetry }: { state: CamState; onRetry: () => void }) {
  const S: React.CSSProperties = {
    position:'absolute',inset:0,display:'flex',alignItems:'center',
    justifyContent:'center',background:'rgba(13,11,8,0.92)',
    backdropFilter:'blur(8px)',padding:24,
  }
  const C: React.CSSProperties = {
    background:'#1E1A12',border:'1px solid rgba(201,169,110,0.2)',
    borderRadius:24,padding:32,textAlign:'center',maxWidth:300,width:'100%',
  }
  if (state === 'requesting') return (
    <div style={S}><div style={C}>
      <div style={{fontSize:48,marginBottom:12}}>📷</div>
      <div style={{fontSize:17,fontWeight:700,color:'#FAF6EE',marginBottom:8}}>Accès caméra…</div>
      <div style={{fontSize:12,color:'#B8A898',lineHeight:1.6}}>Acceptez la permission dans votre navigateur</div>
    </div></div>
  )
  if (state === 'denied') return (
    <div style={S}><div style={C}>
      <div style={{fontSize:48,marginBottom:12}}>🔒</div>
      <div style={{fontSize:17,fontWeight:700,color:'#FAF6EE',marginBottom:8}}>Permission refusée</div>
      <div style={{fontSize:12,color:'#B8A898',lineHeight:1.6,marginBottom:20}}>
        Allez dans les paramètres de votre navigateur<br/>et autorisez la caméra pour ce site.
      </div>
      <button onClick={onRetry} style={{
        padding:'11px 28px',borderRadius:12,border:'none',cursor:'pointer',fontFamily:'inherit',
        background:'linear-gradient(135deg,#9A7840,#C9A96E)',color:'#0D0B08',fontSize:13,fontWeight:800,
      }}>Réessayer</button>
    </div></div>
  )
  if (state === 'unavailable') return (
    <div style={S}><div style={C}>
      <div style={{fontSize:48,marginBottom:12}}>📵</div>
      <div style={{fontSize:17,fontWeight:700,color:'#FAF6EE',marginBottom:8}}>Caméra indisponible</div>
      <div style={{fontSize:12,color:'#B8A898',lineHeight:1.6}}>Utilisez le mode Simulation 3D ↓</div>
    </div></div>
  )
  return null
}

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────
export default function Simulation3D() {
  const { videoRef, camState, startCamera, stopCamera } = useCamera()
  const [segments,    setSegments]    = useState<ARSegment[]>([])
  const [placed,      setPlaced]      = useState<PlacedMesh[]>([])
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [measureStep, setMeasureStep] = useState<0 | 1>(0)
  const [firstPt,     setFirstPt]     = useState<THREE.Vector3 | null>(null)
  const [activeMode,  setActiveMode]  = useState<'view'|'measure'|'place'>('view')
  const [measureType, setMeasureType] = useState<'wall'|'door'|'window'>('wall')
  const [catFilter,   setCatFilter]   = useState('tv')
  const [toast,       setToast]       = useState<string | null>(null)
  const { selectedProduct, setSelectedProduct, addMeasurement, activeRoomId } = useMuroStore()

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 2800)
  }, [])

  const handleFloorClick = useCallback((pos: THREE.Vector3) => {
    if (activeMode === 'place' && selectedProduct) {
      const id = Math.random().toString(36).slice(2,8)
      setPlaced(prev => [...prev, { id, product: selectedProduct, position:[pos.x,0,pos.z], rotation:0 }])
      showToast(`✅ ${selectedProduct.name} placé`); return
    }
    if (activeMode !== 'measure') return
    if (measureStep === 0) {
      setFirstPt(pos.clone()); setMeasureStep(1)
      showToast('✅ Point A — touchez le Point B'); return
    }
    if (measureStep === 1 && firstPt) {
      const dist = firstPt.distanceTo(pos)
      const id   = Math.random().toString(36).slice(2,8)
      setSegments(prev => [...prev, { id, p1:firstPt, p2:pos.clone(), type:measureType, distM:Math.round(dist*100)/100 }])
      if (activeRoomId) addMeasurement({ type:measureType, valueM:dist, label:`${measureType} ${segments.length+1}`, roomId:activeRoomId })
      showToast(`📐 ${measureType} : ${dist.toFixed(2)} m`)
      setFirstPt(null); setMeasureStep(0)
    }
  }, [activeMode, selectedProduct, measureStep, firstPt, measureType, segments.length, activeRoomId, addMeasurement, showToast])

  const handleObjectClick = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id)
  }, [])

  const camActive      = camState === 'active'
  const showPerm       = camState === 'requesting' || camState === 'denied' || camState === 'unavailable'
  const filteredProds  = PRODUCTS.filter(p => p.category === catFilter)

  // btn styles helpers
  const modeBtn = (m: string) => ({
    flex:'0 0 auto', display:'flex', flexDirection:'column' as const, alignItems:'center', gap:2,
    padding:'10px 22px', fontSize:10, fontWeight:700, letterSpacing:'0.5px',
    background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit',
    color: activeMode === m ? '#C9A96E' : '#7A6E60',
    borderBottom: activeMode === m ? '2px solid #C9A96E' : '2px solid transparent',
  })
  const filterBtn = (active: boolean) => ({
    flexShrink:0, padding:'6px 14px', borderRadius:20, fontSize:11, fontWeight:600,
    cursor:'pointer', fontFamily:'inherit',
    background: active ? 'rgba(201,169,110,0.15)' : 'rgba(46,40,32,0.8)',
    border: `1px solid ${active ? 'rgba(201,169,110,0.4)' : 'rgba(61,53,40,0.8)'}`,
    color: active ? '#E8C98A' : '#B8A898',
  })

  return (
    <div style={{position:'relative',width:'100%',height:'100%',display:'flex',flexDirection:'column',background:'#0D0B08'}}>

      {/* ── VIEWPORT ────────────────────────────────── */}
      <div style={{flex:1,position:'relative',overflow:'hidden'}}>

        {/* Flux vidéo caméra (arrière-plan) */}
        <video ref={videoRef} autoPlay playsInline muted style={{
          position:'absolute',inset:0,width:'100%',height:'100%',
          objectFit:'cover',opacity:camActive ? 1 : 0,transition:'opacity 0.4s',zIndex:0,
        }} />

        {/* Fond sombre si pas de caméra */}
        {!camActive && (
          <div style={{position:'absolute',inset:0,zIndex:1,background:'linear-gradient(160deg,#141208,#0D0B08)'}} />
        )}

        {/* Three.js overlay transparent */}
        <Canvas style={{position:'absolute',inset:0,zIndex:2}} shadows
          camera={{position:[0,2.5,4.5],fov:58}}
          gl={{alpha:true,antialias:true,preserveDrawingBuffer:true}}>
          <Suspense fallback={null}>
            <Scene segments={segments} placed={placed} selectedId={selectedId}
              nextPoint={firstPt} onFloorClick={handleFloorClick}
              onObjectClick={handleObjectClick} demo={!camActive} />
          </Suspense>
          <OrbitControls enableDamping dampingFactor={0.06}
            enabled={activeMode==='view'} maxPolarAngle={Math.PI/2-0.04} />
        </Canvas>

        {/* Écran permission */}
        {showPerm && <div style={{position:'absolute',inset:0,zIndex:10}}><PermScreen state={camState} onRetry={startCamera} /></div>}

        {/* Status chips */}
        <div style={{position:'absolute',top:12,left:12,zIndex:20,display:'flex',gap:6,flexWrap:'wrap'}}>
          <div className="ar-chip">
            <div className="ar-live-dot" />
            <span>{camActive ? '📷 Caméra active' : 'Mode 3D'}</span>
          </div>
          {segments.length > 0 && <div className="ar-chip">📐 {segments.length} mesure{segments.length>1?'s':''}</div>}
          {placed.length > 0  && <div className="ar-chip">🛋️ {placed.length} objet{placed.length>1?'s':''}</div>}
        </div>

        {/* Bouton caméra */}
        <div style={{position:'absolute',top:12,right:12,zIndex:20}}>
          {!camActive ? (
            <button onClick={startCamera} style={{
              padding:'8px 14px',borderRadius:12,border:'none',cursor:'pointer',fontFamily:'inherit',
              background:'linear-gradient(135deg,#9A7840,#C9A96E)',color:'#0D0B08',fontSize:12,fontWeight:800,
              display:'flex',alignItems:'center',gap:5,
            }}>📷 Activer caméra</button>
          ) : (
            <button onClick={stopCamera} style={{
              padding:'8px 14px',borderRadius:12,border:'1px solid rgba(239,68,68,0.4)',cursor:'pointer',
              background:'rgba(239,68,68,0.1)',color:'#F87171',fontSize:12,fontWeight:700,fontFamily:'inherit',
              display:'flex',alignItems:'center',gap:5,backdropFilter:'blur(8px)',
            }}>⬜ Arrêter</button>
          )}
        </div>

        {/* Viseur */}
        {(activeMode==='measure'||activeMode==='place') && (
          <div style={{position:'absolute',inset:0,zIndex:15,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
            <div style={{position:'relative',width:48,height:48,opacity:0.75}}>
              {[
                {top:0,left:'50%',width:2,height:16,transform:'translateX(-50%)'},
                {bottom:0,left:'50%',width:2,height:16,transform:'translateX(-50%)'},
                {left:0,top:'50%',width:16,height:2,transform:'translateY(-50%)'},
                {right:0,top:'50%',width:16,height:2,transform:'translateY(-50%)'},
              ].map((s,i) => <div key={i} style={{position:'absolute',background:'#C9A96E',...s}} />)}
              <div style={{position:'absolute',top:'50%',left:'50%',width:6,height:6,borderRadius:'50%',background:'#C9A96E',transform:'translate(-50%,-50%)'}} />
            </div>
            <div style={{
              position:'absolute',bottom:100,padding:'8px 18px',borderRadius:14,textAlign:'center',
              background:'rgba(13,11,8,0.82)',backdropFilter:'blur(10px)',
              border:'1px solid rgba(201,169,110,0.25)',fontSize:12,fontWeight:600,color:'#EEE8E0',lineHeight:1.5,
            }}>
              {activeMode==='place'
                ? `Touchez le sol pour placer ${selectedProduct?.name??'le meuble'}`
                : measureStep===0 ? '① Touchez le Point A sur le sol' : '② Touchez le Point B'}
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:30,
            padding:'10px 20px',borderRadius:18,whiteSpace:'nowrap',
            background:'rgba(13,11,8,0.92)',border:'1px solid rgba(201,169,110,0.3)',
            backdropFilter:'blur(12px)',fontSize:12,fontWeight:600,color:'#FAF6EE',
          }}>{toast}</div>
        )}

        {/* Supprimer */}
        {selectedId && (
          <button onClick={() => { setPlaced(p => p.filter(x=>x.id!==selectedId)); setSelectedId(null) }}
            style={{
              position:'absolute',bottom:24,right:16,zIndex:25,
              width:48,height:48,borderRadius:'50%',border:'none',cursor:'pointer',
              background:'rgba(239,68,68,0.85)',backdropFilter:'blur(8px)',
              fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',
            }}>🗑</button>
        )}
      </div>

      {/* ── TOOLBAR ─────────────────────────────────── */}
      <div style={{
        flexShrink:0,background:'rgba(13,11,8,0.97)',
        borderTop:'1px solid rgba(201,169,110,0.12)',backdropFilter:'blur(14px)',
        paddingBottom:'max(12px,env(safe-area-inset-bottom))',
      }}>

        {/* Modes */}
        <div style={{display:'flex',borderBottom:'1px solid rgba(61,53,40,0.6)',overflowX:'auto'}}>
          {([['view','👆','Vue'],['measure','📐','Mesurer'],['place','🛋️','Placer']] as const).map(([m,ic,lb]) => (
            <button key={m} onClick={() => setActiveMode(m)} style={modeBtn(m)}>
              <span style={{fontSize:18}}>{ic}</span>{lb.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Mesure type */}
        {activeMode === 'measure' && (
          <div style={{display:'flex',gap:8,padding:'10px 12px 4px',overflowX:'auto'}}>
            {([['wall','🧱','Mur'],['door','🚪','Porte'],['window','🪟','Fenêtre']] as const).map(([t,ic,lb]) => (
              <button key={t} onClick={() => setMeasureType(t)} style={filterBtn(measureType===t)}>{ic} {lb}</button>
            ))}
            {measureStep===1 && (
              <button onClick={() => { setFirstPt(null); setMeasureStep(0) }} style={{
                flexShrink:0,padding:'6px 14px',borderRadius:20,fontSize:11,fontWeight:600,
                cursor:'pointer',fontFamily:'inherit',
                background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',color:'#F87171',
              }}>✕ Annuler</button>
            )}
          </div>
        )}

        {/* Place catalogue */}
        {activeMode === 'place' && (
          <div style={{paddingTop:10,paddingBottom:4}}>
            <div style={{display:'flex',gap:8,padding:'0 12px 8px',overflowX:'auto'}}>
              {(['tv','murs','lumiere','mobilier'] as const).map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)} style={filterBtn(catFilter===cat)}>{cat}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:10,padding:'0 12px 4px',overflowX:'auto'}}>
              {filteredProds.map(p => (
                <button key={p.id}
                  onClick={() => { setSelectedProduct(p); showToast(`Sélectionné : ${p.name} — touchez le sol`) }}
                  style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',background:'transparent',border:'none',cursor:'pointer',width:72}}>
                  <div style={{
                    width:60,height:60,borderRadius:14,fontSize:28,marginBottom:4,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    background:selectedProduct?.id===p.id ? 'rgba(201,169,110,0.2)' : 'rgba(30,26,20,0.9)',
                    border:`1px solid ${selectedProduct?.id===p.id ? 'rgba(201,169,110,0.5)' : 'rgba(61,53,40,0.8)'}`,
                    boxShadow:selectedProduct?.id===p.id ? '0 0 0 2px rgba(201,169,110,0.3)' : 'none',
                  }}>{p.emoji}</div>
                  <span style={{fontSize:9,fontWeight:600,color:'#B8A898',lineHeight:1.3,textAlign:'center',maxHeight:30,overflow:'hidden'}}>{p.name}</span>
                  <span style={{fontSize:9,fontWeight:800,color:'#C9A96E',marginTop:2}}>{formatPrice(p.priceDA)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vue CTA */}
        {activeMode==='view' && segments.length===0 && placed.length===0 && (
          <div style={{padding:'10px 12px 4px',display:'flex',gap:8}}>
            <button onClick={() => setActiveMode('measure')} style={{
              flex:1,padding:'12px 0',borderRadius:14,border:'none',cursor:'pointer',fontFamily:'inherit',
              background:'linear-gradient(135deg,#9A7840,#C9A96E)',color:'#0D0B08',fontSize:12,fontWeight:800,
            }}>📐 Commencer la mesure</button>
            <button onClick={() => setActiveMode('place')} style={{
              flex:1,padding:'12px 0',borderRadius:14,cursor:'pointer',fontFamily:'inherit',
              background:'rgba(46,40,32,0.8)',border:'1px solid rgba(61,53,40,0.8)',
              color:'#E8DFD0',fontSize:12,fontWeight:700,
            }}>🛋️ Placer meuble</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── UTILS ────────────────────────────────────────────────────
function parseDims(dim: string) {
  const m = dim.match(/\d+/g)?.map(Number) ?? [60,60,60]
  const [a=60,b=60,c=60] = m
  return { w:a/100, h:b/100, d:c/100 }
}
function prodColor(cat: string): string {
  return ({tv:'#3D3528',murs:'#4A4035',lumiere:'#5C4A1E',mobilier:'#3A3025',services:'#2A2820'} as any)[cat] ?? '#3D3528'
}
