// @ts-nocheck
import React from 'react'
// components/Sim3D.tsx
// PHASE 2 — Simulation 3D professionnelle avec produits MURO
'use client'

import { useRef, useState, useCallback, useEffect, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, OrbitControls, PerspectiveCamera, Line } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { useMuroStore } from '@/lib/store'
import { PRODUCTS, formatPrice } from '@/lib/products'
import type { Product } from '@/lib/store'
import type { RoomData } from '@/lib/roomScaler'

// ── Types ────────────────────────────────────────────────────────
interface PlacedObj {
  id:        string
  product:   Product
  wall:      'front' | 'left' | 'right'  // mur d'application
  posX:      number  // position sur le mur (-1 à 1)
  posY:      number  // hauteur relative
  scaleW:    number  // largeur réelle en mètres
  scaleH:    number  // hauteur réelle en mètres
}

type WallSide = 'front' | 'left' | 'right'
type ViewMode = 'perspective' | 'front' | 'top'

const CAT_COLORS: Record<string,string> = {
  'tv-simple': '#C9A96E', 'tv-deco': '#A78BFA', 'tv': '#C9A96E',
  'murs': '#40C4FF', 'lumiere': '#FFD740', 'mobilier': '#00E676', 'services': '#FF6B6B',
}

// ── Utilitaires ──────────────────────────────────────────────────
const nanoid = () => Math.random().toString(36).slice(2,9)

function getDims(p: Product): { w:number; h:number; d:number } {
  const m = p.dimensions.match(/(\d+(?:\.\d+)?)/g)?.map(Number) ?? [80,50,40]
  const [a=80,b=50,c=40] = m
  // si unité cm → convertir en m
  const isM = p.dimensions.toLowerCase().includes(' m ') || p.dimensions.includes('×') && a < 10
  const factor = isM ? 1 : 0.01
  return { w: a*factor, h: b*factor, d: c*factor }
}

// ══════════════════════════════════════════════════════════════════
// SCÈNE 3D
// ══════════════════════════════════════════════════════════════════
function Room3D({ room, placed, selectedId, activeWall, viewMode, onWallClick, onObjClick }: {
  room: RoomData
  placed: PlacedObj[]
  selectedId: string | null
  activeWall: WallSide
  viewMode: ViewMode
  onWallClick: (wall: WallSide, x: number, y: number) => void
  onObjClick: (id: string) => void
}) {
  const L = room.longueur
  const la = room.largeur
  const H  = room.hauteur

  // Matériaux
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1A1410'), roughness: 0.9, metalness: 0.05
  }), [])
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1C1814'), roughness: 0.85, metalness: 0.02
  }), [])
  const wallMatHL = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#231F1A'), roughness: 0.8, metalness: 0.02,
    emissive: new THREE.Color('#C9A96E'), emissiveIntensity: 0.025
  }), [])
  const ceilMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#151210'), roughness: 0.9
  }), [])

  // Clic sur mur
  const handleWallClick = (wall: WallSide) => (e: any) => {
    e.stopPropagation()
    const lp = e.point
    let x = 0, y = 0
    if (wall === 'front') { x = lp.x / (L/2); y = (lp.y - H/2) / (H/2) }
    if (wall === 'left')  { x = lp.z / (la/2); y = (lp.y - H/2) / (H/2) }
    if (wall === 'right') { x = lp.z / (la/2); y = (lp.y - H/2) / (H/2) }
    onWallClick(wall, Math.max(-0.9, Math.min(0.9, x)), Math.max(-0.9, Math.min(0.9, y)))
  }

  return (
    <>
      {/* ── Éclairage ── */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[L*0.5, H*1.5, la*0.5]} intensity={0.8} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, H*0.8, 0]} intensity={0.4} color="#E8C98A" />
      <pointLight position={[L*0.4, H*0.7, la*0.4]} intensity={0.25} color="#fff" />

      {/* ── Sol ── */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow material={floorMat}>
        <planeGeometry args={[L, la]} />
      </mesh>

      {/* Grille sol */}
      <gridHelper args={[Math.max(L,la)*1.5, 20, '#2E2820', '#232018']} position={[0,0.001,0]}/>

      {/* ── Plafond ── */}
      <mesh rotation={[Math.PI/2,0,0]} position={[0,H,0]} material={ceilMat}>
        <planeGeometry args={[L, la]} />
      </mesh>

      {/* ── MUR PRINCIPAL (front, z=-la/2) ── */}
      <mesh position={[0, H/2, -la/2]} receiveShadow
        material={activeWall==='front' ? wallMatHL : wallMat}
        onClick={handleWallClick('front')}>
        <planeGeometry args={[L, H]} />
      </mesh>

      {/* ── MUR GAUCHE (left, x=-L/2) ── */}
      <mesh position={[-L/2, H/2, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow
        material={activeWall==='left' ? wallMatHL : wallMat}
        onClick={handleWallClick('left')}>
        <planeGeometry args={[la, H]} />
      </mesh>

      {/* ── MUR DROIT (right, x=+L/2) ── */}
      <mesh position={[L/2, H/2, 0]} rotation={[0, -Math.PI/2, 0]} receiveShadow
        material={activeWall==='right' ? wallMatHL : wallMat}
        onClick={handleWallClick('right')}>
        <planeGeometry args={[la, H]} />
      </mesh>

      {/* ── Bords & coins ── */}
      {/* Ligne de sol */}
      {[
        { p1:[-(L/2),0,-(la/2)], p2:[(L/2),0,-(la/2)] },
        { p1:[-(L/2),0,(la/2)],  p2:[(L/2),0,(la/2)] },
        { p1:[-(L/2),0,-(la/2)], p2:[-(L/2),0,(la/2)] },
        { p1:[(L/2),0,-(la/2)],  p2:[(L/2),0,(la/2)] },
      ].map((l,i) => (
        <Line key={i} points={[l.p1 as any, l.p2 as any]}
          color="#3D3528" lineWidth={1} />
      ))}

      {/* ── Cotes dimensionnelles ── */}
      <DimLine start={[-L/2,-0.08,-la/2-0.3]} end={[L/2,-0.08,-la/2-0.3]}
        label={`${room.longueur.toFixed(2)} m`} color="#C9A96E" />
      <DimLine start={[-L/2-0.3,-0.08,-la/2]} end={[-L/2-0.3,-0.08,la/2]}
        label={`${room.largeur.toFixed(2)} m`} color="#40C4FF" axis="z" />
      <DimLine start={[-L/2-0.4,0,-la/2]} end={[-L/2-0.4,H,-la/2]}
        label={`${room.hauteur.toFixed(2)} m`} color="#00E676" axis="y" />

      {/* ── Objets placés ── */}
      {placed.map(obj => (
        <React.Fragment key={obj.id}><PlacedMesh obj={obj} room={room}
          selected={obj.id === selectedId}
          onClick={() => onObjClick(obj.id)} /></React.Fragment>
      ))}
    </>
  )
}

// ── Cote dimensionnelle 3D ────────────────────────────────────────
function DimLine({ start, end, label, color, axis='x' }: {
  start:[number,number,number]; end:[number,number,number]
  label:string; color:string; axis?:'x'|'y'|'z'
}) {
  const mid: [number,number,number] = [
    (start[0]+end[0])/2, (start[1]+end[1])/2+0.02, (start[2]+end[2])/2
  ]
  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={1.5} />
      <Text position={mid} fontSize={0.08} color={color} anchorX="center" anchorY="bottom"
        outlineWidth={0.006} outlineColor="#0D0B08"
        rotation={axis==='y' ? [0,0,Math.PI/2] : [0,0,0]}>
        {label}
      </Text>
    </group>
  )
}

// ── Objet placé sur le mur ────────────────────────────────────────
function PlacedMesh({ obj, room, selected, onClick }: {
  obj: PlacedObj; room: RoomData; selected: boolean; onClick: ()=>void
}) {
  const ref = useRef<THREE.Group>(null)
  const dims = getDims(obj.product)
  const W = obj.scaleW; const Hh = obj.scaleH
  const col = CAT_COLORS[obj.product.category] ?? '#C9A96E'

  useFrame((state) => {
    if (!ref.current) return
    if (selected) {
      ref.current.children.forEach(c => {
        const mesh = c as THREE.Mesh
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.emissiveIntensity = 0.15 + Math.sin(state.clock.elapsedTime*3)*0.08
        }
      })
    }
  })

  // Position 3D selon le mur
  let position: [number,number,number] = [0,0,0]
  let rotation: [number,number,number] = [0,0,0]
  const L = room.longueur; const la = room.largeur; const H = room.hauteur

  if (obj.wall === 'front') {
    position = [obj.posX * (L/2 - W/2), H/2 + obj.posY*(H/2 - Hh/2), -la/2 + 0.02]
    rotation = [0,0,0]
  } else if (obj.wall === 'left') {
    position = [-L/2+0.02, H/2 + obj.posY*(H/2-Hh/2), obj.posX*(la/2-W/2)]
    rotation = [0, Math.PI/2, 0]
  } else {
    position = [L/2-0.02, H/2 + obj.posY*(H/2-Hh/2), obj.posX*(la/2-W/2)]
    rotation = [0, -Math.PI/2, 0]
  }

  return (
    <group ref={ref} position={position} rotation={rotation} onClick={onClick}>
      {/* Corps du produit */}
      <mesh castShadow>
        <boxGeometry args={[W, Hh, 0.04]} />
        <meshStandardMaterial
          color={selected ? col : darken(col, 0.3)}
          roughness={0.3} metalness={0.15}
          emissive={new THREE.Color(col)}
          emissiveIntensity={selected ? 0.15 : 0.05}
          transparent opacity={0.92}
        />
      </mesh>

      {/* Cadre contour */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(W, Hh, 0.045)]} />
        <lineBasicMaterial color={col} />
      </lineSegments>

      {/* Icône emoji */}
      <Text position={[0, Hh*0.15, 0.025]} fontSize={Math.min(W,Hh)*0.35}
        anchorX="center" anchorY="middle">
        {obj.product.emoji}
      </Text>

      {/* Label nom */}
      <Text position={[0, -Hh/2-0.06, 0.01]} fontSize={0.055} color={col}
        anchorX="center" anchorY="top" outlineWidth={0.005} outlineColor="#0D0B08"
        maxWidth={W*1.2}>
        {obj.product.name}
      </Text>

      {/* Badge taille si sélectionné */}
      {selected && (
        <Text position={[0, Hh/2+0.08, 0.01]} fontSize={0.052} color="#FAF6EE"
          anchorX="center" anchorY="bottom" outlineWidth={0.005} outlineColor="#0D0B08">
          {`${W.toFixed(2)}m × ${Hh.toFixed(2)}m · ${formatPrice(obj.product.priceDA)}`}
        </Text>
      )}

      {/* LED strip meuble TV */}
      {(obj.product.category==='tv'||obj.product.category==='tv-simple'||obj.product.category==='tv-deco') && (
        <mesh position={[0, -Hh/2+0.02, 0.03]}>
          <boxGeometry args={[W*0.9, 0.012, 0.005]} />
          <meshStandardMaterial color="#FFD740" emissive="#FFD740" emissiveIntensity={1.2} />
        </mesh>
      )}
    </group>
  )
}

function darken(hex: string, amount: number): string {
  try {
    const col = new THREE.Color(hex)
    return new THREE.Color(col.r*amount, col.g*amount, col.b*amount).getHexString()
  } catch { return hex }
}

// ── Caméra auto selon viewMode ────────────────────────────────────
function CameraController({ room, viewMode }: { room: RoomData; viewMode: ViewMode }) {
  const { camera } = useThree()
  const L = room.longueur; const la = room.largeur; const H = room.hauteur

  useEffect(() => {
    if (viewMode === 'perspective') {
      camera.position.set(L*0.7, H*0.8, la*0.8)
    } else if (viewMode === 'front') {
      camera.position.set(0, H/2, la*1.5)
    } else if (viewMode === 'top') {
      camera.position.set(0, H*2.5, 0.01)
    }
    camera.lookAt(0, H/2, 0)
  }, [viewMode, L, la, H, camera])

  return null
}

// ══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function Sim3D({ room, onBack }: { room: RoomData; onBack: ()=>void }) {
  const [placed,     setPlaced]     = useState<PlacedObj[]>([])
  const [selectedId, setSelectedId] = useState<string|null>(null)
  const [activeWall, setActiveWall] = useState<WallSide>('front')
  const [viewMode,   setViewMode]   = useState<ViewMode>('perspective')
  const [activeTab,  setActiveTab]  = useState<'produits'|'mur'|'recapitulatif'>('produits')
  const [catFilter,  setCatFilter]  = useState<string>('tv-simple')
  const [toast,      setToast]      = useState<string|null>(null)
  const [selectedProd, setSelectedProd] = useState<Product|null>(null)
  const [showProdDetail, setShowProdDetail] = useState(false)
  const { addToCart } = useMuroStore(s => ({ addToCart: s.addToCart }))

  const showToast = useCallback((msg:string) => {
    setToast(msg); setTimeout(() => setToast(null), 2500)
  }, [])

  // Clic sur mur → place le produit sélectionné
  const handleWallClick = useCallback((wall: WallSide, x: number, y: number) => {
    if (!selectedProd) {
      showToast('Sélectionnez d\'abord un produit dans le catalogue ↓')
      return
    }
    const dims = getDims(selectedProd)
    const id = nanoid()
    setPlaced(prev => [...prev, {
      id, product: selectedProd, wall, posX: x,
      posY: Math.max(-0.6, y),  // positionner pas trop bas
      scaleW: dims.w, scaleH: dims.h
    }])
    showToast(`✅ ${selectedProd.name} placé sur le mur`)
    setSelectedId(id)
  }, [selectedProd, showToast])

  const handleObjClick = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id)
  }, [])

  const deleteSelected = useCallback(() => {
    setPlaced(prev => prev.filter(p => p.id !== selectedId))
    setSelectedId(null)
  }, [selectedId])

  const addSelectedToCart = useCallback(() => {
    if (!selectedProd) return
    addToCart(selectedProd, 1)
    showToast(`🛒 ${selectedProd.name} ajouté au devis`)
  }, [selectedProd, addToCart, showToast])

  const selectedObj = placed.find(p => p.id === selectedId)
  const filteredProds = PRODUCTS.filter(p =>
    catFilter === 'all' ? true : p.category === catFilter
  )

  // Calculs récap
  const L = room.longueur; const la = room.largeur; const H = room.hauteur
  const surfSol = L * la
  const surfMurs = 2*(L+la)*H

  // ── Produits sélectionnés par catégorie pour le récap
  const prodByCat = useMemo(() => {
    const map: Record<string,PlacedObj[]> = {}
    placed.forEach(o => {
      const k = o.product.category
      if (!map[k]) map[k] = []
      map[k].push(o)
    })
    return map
  }, [placed])

  const totalEstimate = useMemo(() =>
    placed.reduce((s, o) => s + o.product.priceDA, 0)
  , [placed])

  return (
    <div style={{ position:'fixed',inset:0,background:'#0D0B08',display:'flex',flexDirection:'column',fontFamily:'Raleway,sans-serif' }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{
        flexShrink:0, paddingTop:'max(14px,env(safe-area-inset-top))',
        background:'rgba(13,11,8,0.97)', backdropFilter:'blur(14px)',
        borderBottom:'1px solid rgba(201,169,110,0.12)',
      }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'0 12px 10px' }}>
          <button onClick={onBack} style={{
            width:34,height:34,borderRadius:'50%',border:'1px solid rgba(61,53,40,0.8)',
            background:'rgba(46,40,32,0.9)',color:'#B8A898',fontSize:16,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center'
          }}>←</button>

          <div style={{ flex:1 }}>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:'2px',color:'#7A6E60',textTransform:'uppercase' }}>Simulation 3D</div>
            <div style={{ fontSize:14,fontWeight:800,color:'#FAF6EE',lineHeight:1.2 }}>
              🏠 Pièce · {L}×{la}×{H}m
            </div>
          </div>

          {/* View mode */}
          <div style={{ display:'flex',gap:4,padding:'4px',borderRadius:10,background:'rgba(30,26,20,0.9)',border:'1px solid rgba(61,53,40,0.8)' }}>
            {(['perspective','front','top'] as ViewMode[]).map((v,i) => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                width:30,height:26,borderRadius:7,border:'none',cursor:'pointer',
                background: viewMode===v ? 'rgba(201,169,110,0.2)' : 'transparent',
                color: viewMode===v ? '#C9A96E' : '#7A6E60',
                fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',
              }} title={v}>
                {i===0?'🔲':i===1?'🔳':'⬛'}
              </button>
            ))}
          </div>

          {/* Panier */}
          {placed.length > 0 && (
            <button onClick={() => setActiveTab('recapitulatif')} style={{
              padding:'6px 12px',borderRadius:10,border:'none',cursor:'pointer',
              background:'linear-gradient(135deg,#9A7840,#C9A96E)',
              color:'#0D0B08',fontSize:11,fontWeight:800,
              display:'flex',alignItems:'center',gap:4,
            }}>
              📊 <span>{placed.length}</span>
            </button>
          )}
        </div>

        {/* Mur actif */}
        <div style={{ display:'flex',gap:0,padding:'0 12px 8px' }}>
          {([['front','Mur principal','🧱'],['left','Mur gauche','◀'],['right','Mur droit','▶']] as const).map(([w,lb,ic]) => (
            <button key={w} onClick={() => setActiveWall(w)} style={{
              flex:1,padding:'7px 4px',border:'none',cursor:'pointer',
              background:'transparent',
              borderBottom:`2px solid ${activeWall===w ? '#C9A96E' : 'transparent'}`,
              color: activeWall===w ? '#C9A96E' : '#7A6E60',
              fontSize:11,fontWeight:700,fontFamily:'Raleway,sans-serif',
              display:'flex',flexDirection:'column',alignItems:'center',gap:1,
            }}>
              <span style={{ fontSize:14 }}>{ic}</span>
              <span>{lb}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CANVAS 3D ──────────────────────────────────────── */}
      <div style={{ flex:1,position:'relative',minHeight:0 }}>
        <Canvas shadows gl={{ antialias:true, alpha:false }}
          style={{ background:'linear-gradient(160deg,#0D0B08 0%,#141008 100%)' }}>
          <PerspectiveCamera makeDefault position={[room.longueur*0.7, room.hauteur*0.8, room.largeur*0.8]} fov={52} />
          <CameraController room={room} viewMode={viewMode} />
          <Suspense fallback={null}>
            <Room3D room={room} placed={placed} selectedId={selectedId}
              activeWall={activeWall} viewMode={viewMode}
              onWallClick={handleWallClick} onObjClick={handleObjClick} />
          </Suspense>
          <OrbitControls enableDamping dampingFactor={0.05}
            enabled={true} maxPolarAngle={Math.PI/2+0.15} minDistance={1} maxDistance={20} />
        </Canvas>

        {/* Overlay infos */}
        <div style={{ position:'absolute',top:10,left:10,display:'flex',gap:6,flexWrap:'wrap',zIndex:10,pointerEvents:'none' }}>
          <Chip icon="📐" label={`${room.longueur}×${room.largeur}×${room.hauteur}m`} />
          {placed.length>0 && <Chip icon="🛋️" label={`${placed.length} produit${placed.length>1?'s':''}`} color="#C9A96E" />}
          {selectedProd && <Chip icon={selectedProd.emoji} label="Touchez un mur" color="#00E676" pulse />}
        </div>

        {/* Guide toucher mur */}
        {selectedProd && (
          <div style={{
            position:'absolute',bottom:10,left:'50%',transform:'translateX(-50%)',
            padding:'8px 16px',borderRadius:12,zIndex:10,
            background:'rgba(13,11,8,0.88)',border:'1px solid rgba(201,169,110,0.3)',
            backdropFilter:'blur(10px)',fontSize:12,fontWeight:600,color:'#E8C98A',
            display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap',
          }}>
            <span style={{ fontSize:18 }}>{selectedProd.emoji}</span>
            Touchez le mur {activeWall==='front'?'principal':activeWall==='left'?'gauche':'droit'} pour placer
          </div>
        )}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
              style={{
                position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',zIndex:20,
                padding:'10px 18px',borderRadius:14,whiteSpace:'nowrap',
                background:'rgba(13,11,8,0.95)',border:'1px solid rgba(201,169,110,0.3)',
                backdropFilter:'blur(12px)',fontSize:12,fontWeight:600,color:'#FAF6EE',
              }}>{toast}</motion.div>
          )}
        </AnimatePresence>

        {/* Supprimer objet sélectionné */}
        <AnimatePresence>
          {selectedId && (
            <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}
              style={{ position:'absolute',top:10,right:10,zIndex:20,display:'flex',gap:6 }}>
              <button onClick={deleteSelected} style={{
                width:40,height:40,borderRadius:12,border:'1px solid rgba(239,68,68,0.4)',
                background:'rgba(239,68,68,0.15)',cursor:'pointer',color:'#F87171',
                fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',
              }}>🗑</button>
              {selectedObj && (
                <button onClick={() => { addToCart(selectedObj.product,1); showToast('Ajouté au devis') }} style={{
                  height:40,padding:'0 12px',borderRadius:12,border:'none',cursor:'pointer',
                  background:'linear-gradient(135deg,#9A7840,#C9A96E)',
                  color:'#0D0B08',fontSize:11,fontWeight:800,
                }}>+ Devis</button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── PANNEAU BAS ─────────────────────────────────────── */}
      <div style={{
        flexShrink:0, background:'rgba(13,11,8,0.98)',
        borderTop:'1px solid rgba(201,169,110,0.15)', backdropFilter:'blur(16px)',
        paddingBottom:'max(10px,env(safe-area-inset-bottom))',
        maxHeight:'48vh', display:'flex', flexDirection:'column',
      }}>
        {/* Tabs */}
        <div style={{ display:'flex',borderBottom:'1px solid rgba(61,53,40,0.6)' }}>
          {([
            ['produits','🛒','Catalogue'],
            ['mur','🧱','Mur actif'],
            ['recapitulatif','📊','Récap'],
          ] as const).map(([t,ic,lb]) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex:1,padding:'9px 4px',border:'none',cursor:'pointer',
              background:'transparent',fontFamily:'Raleway,sans-serif',
              borderBottom:`2px solid ${activeTab===t ? '#C9A96E' : 'transparent'}`,
              color: activeTab===t ? '#C9A96E' : '#7A6E60',
              fontSize:10,fontWeight:800,letterSpacing:'0.5px',
              display:'flex',flexDirection:'column',alignItems:'center',gap:1,
            }}>
              <span style={{ fontSize:16 }}>{ic}</span>
              {lb.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Contenu tab */}
        <div style={{ flex:1,overflowY:'auto',overscrollBehavior:'contain' }}>

          {/* ── CATALOGUE ── */}
          {activeTab === 'produits' && (
            <div style={{ padding:'10px 12px' }}>
              {/* Cat filter */}
              <div style={{ display:'flex',gap:6,marginBottom:10,overflowX:'auto',paddingBottom:4 }}>
                {[
                  {id:'tv-simple',label:'Meubles TV',emoji:'📺'},
                  {id:'tv-deco',  label:'TV+Placo',  emoji:'🏛️'},
                  {id:'murs',     label:'Murs',       emoji:'🪨'},
                  {id:'lumiere',  label:'Lumière',    emoji:'💡'},
                  {id:'mobilier', label:'Mobilier',   emoji:'🛋️'},
                ].map(c => (
                  <button key={c.id} onClick={() => setCatFilter(c.id)} style={{
                    flexShrink:0,padding:'5px 12px',borderRadius:20,border:'none',cursor:'pointer',
                    fontFamily:'Raleway,sans-serif',fontSize:11,fontWeight:700,
                    background: catFilter===c.id ? 'rgba(201,169,110,0.15)' : 'rgba(30,26,20,0.9)',
                    border: `1px solid ${catFilter===c.id ? 'rgba(201,169,110,0.4)' : 'rgba(61,53,40,0.8)'}`,
                    color: catFilter===c.id ? '#E8C98A' : '#B8A898',
                  }}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>

              {/* Grille produits */}
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))',gap:8 }}>
                {filteredProds.map(p => {
                  const isSelected = selectedProd?.id === p.id
                  const col = CAT_COLORS[p.category] ?? '#C9A96E'
                  return (
                    <motion.button key={p.id} whileTap={{scale:0.95}}
                      onClick={() => {
                        setSelectedProd(p)
                        showToast(`${p.emoji} Sélectionné — touchez le mur ${activeWall==='front'?'principal':activeWall}`)
                      }}
                      style={{
                        padding:'10px 6px',borderRadius:14,border:`1px solid ${isSelected ? col+'60' : 'rgba(61,53,40,0.8)'}`,
                        background: isSelected ? `${col}10` : 'rgba(24,20,14,0.95)',
                        cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,
                        boxShadow: isSelected ? `0 0 0 2px ${col}30` : 'none',
                      }}>
                      <span style={{ fontSize:26 }}>{p.emoji}</span>
                      <span style={{ fontSize:9,fontWeight:700,color:'#FAF6EE',textAlign:'center',lineHeight:1.2,maxHeight:24,overflow:'hidden' }}>
                        {p.name.split(' ').slice(0,3).join(' ')}
                      </span>
                      <span style={{ fontSize:9,fontWeight:800,color:col }}>
                        {formatPrice(p.priceDA)}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── MUR ACTIF — objects sur ce mur ── */}
          {activeTab === 'mur' && (
            <div style={{ padding:'10px 12px' }}>
              <div style={{ fontSize:11,fontWeight:700,color:'#9A7840',marginBottom:10,textTransform:'uppercase',letterSpacing:'1px' }}>
                Mur {activeWall==='front'?'principal':activeWall} — {placed.filter(p=>p.wall===activeWall).length} produit(s)
              </div>
              {placed.filter(p => p.wall === activeWall).length === 0 ? (
                <div style={{ textAlign:'center',padding:'24px 0',color:'#7A6E60',fontSize:12 }}>
                  <div style={{ fontSize:40,marginBottom:8,opacity:0.4 }}>🧱</div>
                  Touchez ce mur dans la vue 3D pour placer un produit
                </div>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {placed.filter(p=>p.wall===activeWall).map(obj => {
                    const col = CAT_COLORS[obj.product.category] ?? '#C9A96E'
                    return (
                      <div key={obj.id} onClick={() => setSelectedId(obj.id)}
                        style={{
                          display:'flex',alignItems:'center',gap:10,padding:'12px 14px',
                          borderRadius:14,cursor:'pointer',
                          background: selectedId===obj.id ? `${col}10` : 'rgba(30,26,20,0.9)',
                          border:`1px solid ${selectedId===obj.id ? col+'50' : 'rgba(61,53,40,0.8)'}`,
                        }}>
                        <span style={{ fontSize:24,flexShrink:0 }}>{obj.product.emoji}</span>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:12,fontWeight:700,color:'#FAF6EE',marginBottom:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                            {obj.product.name}
                          </div>
                          <div style={{ fontSize:10,color:'#7A6E60' }}>
                            {obj.scaleW.toFixed(2)}m × {obj.scaleH.toFixed(2)}m
                          </div>
                        </div>
                        <div style={{ textAlign:'right',flexShrink:0 }}>
                          <div style={{ fontSize:13,fontWeight:800,color:col }}>{formatPrice(obj.product.priceDA)}</div>
                          <button onClick={e => { e.stopPropagation(); setPlaced(prev => prev.filter(p=>p.id!==obj.id)); setSelectedId(null) }}
                            style={{ fontSize:10,color:'#F87171',background:'none',border:'none',cursor:'pointer',fontFamily:'Raleway,sans-serif',marginTop:2 }}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── RÉCAPITULATIF PRO ── */}
          {activeTab === 'recapitulatif' && (
            <div style={{ padding:'12px 14px' }}>
              {/* Pièce */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14 }}>
                {[
                  {l:'Surface sol',v:`${surfSol.toFixed(1)} m²`},
                  {l:'Surface murs',v:`${surfMurs.toFixed(1)} m²`},
                  {l:'Périmètre',v:`${(2*(L+la)).toFixed(1)} m`},
                ].map((s,i) => (
                  <div key={i} style={{ padding:'10px 8px',borderRadius:12,textAlign:'center',
                    background:'rgba(201,169,110,0.05)',border:'1px solid rgba(201,169,110,0.15)' }}>
                    <div style={{ fontSize:14,fontWeight:800,color:'#C9A96E',marginBottom:2 }}>{s.v}</div>
                    <div style={{ fontSize:9,color:'#7A6E60' }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Produits */}
              {placed.length === 0 ? (
                <div style={{ textAlign:'center',padding:'20px 0',color:'#7A6E60',fontSize:12 }}>
                  <div style={{ fontSize:36,marginBottom:8,opacity:0.3 }}>📊</div>
                  Placez des produits sur les murs pour voir le récapitulatif
                </div>
              ) : (
                <>
                  <div style={{ fontSize:10,fontWeight:800,color:'#9A7840',letterSpacing:'2px',textTransform:'uppercase',marginBottom:10 }}>
                    Produits sélectionnés
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:14 }}>
                    {placed.map((obj,i) => {
                      const col = CAT_COLORS[obj.product.category] ?? '#C9A96E'
                      return (
                        <div key={obj.id} style={{ display:'flex',alignItems:'center',gap:8,
                          padding:'10px 12px',borderRadius:12,
                          background:'rgba(30,26,20,0.9)',border:'1px solid rgba(61,53,40,0.8)' }}>
                          <span style={{ fontSize:18 }}>{obj.product.emoji}</span>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:11,fontWeight:700,color:'#FAF6EE',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                              {obj.product.name}
                            </div>
                            <div style={{ fontSize:9,color:'#7A6E60',marginTop:1 }}>
                              Mur {obj.wall==='front'?'principal':obj.wall} · {obj.scaleW.toFixed(2)}×{obj.scaleH.toFixed(2)}m
                            </div>
                          </div>
                          <span style={{ fontSize:12,fontWeight:800,color:col,flexShrink:0 }}>
                            {formatPrice(obj.product.priceDA)}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Total */}
                  <div style={{ padding:'14px',borderRadius:14,
                    background:'linear-gradient(135deg,rgba(154,120,64,0.12),rgba(201,169,110,0.08))',
                    border:'1px solid rgba(201,169,110,0.25)',marginBottom:12 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4 }}>
                      <span style={{ fontSize:11,color:'#B8A898',fontWeight:600 }}>Estimation totale HT</span>
                      <span style={{ fontSize:18,fontWeight:800,color:'#C9A96E' }}>{formatPrice(totalEstimate)}</span>
                    </div>
                    <div style={{ fontSize:10,color:'#7A6E60' }}>
                      Pose non incluse · Devis personnalisé sur demande
                    </div>
                  </div>

                  {/* CTA */}
                  <button onClick={() => { placed.forEach(o => addToCart(o.product,1)); showToast('✅ Tous les produits ajoutés au devis') }}
                    style={{
                      width:'100%',height:48,borderRadius:14,border:'none',cursor:'pointer',
                      background:'linear-gradient(135deg,#9A7840,#C9A96E)',
                      color:'#0D0B08',fontSize:13,fontWeight:800,fontFamily:'Raleway,sans-serif',
                      display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                    }}>
                    <span style={{ fontSize:18 }}>📄</span>
                    Générer le devis PDF
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Chip status ───────────────────────────────────────────────────
function Chip({ icon, label, color='rgba(255,255,255,0.7)', pulse=false }: {
  icon:string; label:string; color?:string; pulse?:boolean
}) {
  return (
    <div style={{
      display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:20,
      background:'rgba(13,11,8,0.85)',border:'1px solid rgba(61,53,40,0.8)',
      backdropFilter:'blur(8px)',fontSize:11,fontWeight:600,color,
    }}>
      {pulse && <div style={{ width:6,height:6,borderRadius:'50%',background:'#00E676',
        animation:'pulse 1.5s ease-in-out infinite',flexShrink:0 }}/>}
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  )
}
