// Fichier : app/simulation/page.tsx
// Orchestrateur — Phase 1 (Mesure) → Phase 2 (Simulation 3D Live)
'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import RoomMeasurer from '@/components/RoomMeasurer'
import type { RoomDimensions } from '@/lib/roomScaler'
import type { PlacedItem } from '@/components/ProductPlacer'
import type { Product } from '@/lib/store'
import { productDims } from '@/lib/roomScaler'
import { useMuroStore } from '@/lib/store'

// Chargement dynamique pour éviter le SSR (Three.js + getUserMedia)
const LiveCameraSimulation = dynamic(
  () => import('@/components/LiveCameraSimulation'),
  {
    ssr: false,
    loading: () => (
      <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#0D0B08',gap:18 }}>
        <div style={{ width:60,height:60,borderRadius:18,background:'linear-gradient(145deg,#9A7840,#C9A96E)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30 }}>🏠</div>
        <div style={{ color:'#C9A96E',fontSize:13,fontWeight:700,fontFamily:'Raleway,sans-serif' }}>Chargement du simulateur 3D…</div>
        <div style={{ display:'flex',gap:6 }}>
          {[0,1,2].map(i=><div key={i} style={{ width:7,height:7,borderRadius:'50%',background:'#C9A96E',opacity:0,animation:`fadeIn .8s ease ${i*.2}s infinite alternate` }}/>)}
        </div>
      </div>
    ),
  }
)

const ProductPlacer = dynamic(() => import('@/components/ProductPlacer'), { ssr: false })
const PhotoOverlay  = dynamic(() => import('@/components/PhotoOverlay'),  { ssr: false })

const nanoid = () => Math.random().toString(36).slice(2, 9)

type Phase = 'mesure' | 'sim3d'
type WallSide = PlacedItem['wall']
type ViewMode = 'perspective' | 'front' | 'top'

export default function SimulationPage() {
  const router    = useRouter()
  const addToCart = useMuroStore(s => s.addToCart)

  // ── Phase + Room ───────────────────────────────────────────────
  const [phase,     setPhase]     = useState<Phase>('mesure')
  const [room,      setRoom]      = useState<RoomDimensions>({ longueur:5.5, largeur:4.2, hauteur:2.7 })
  const [roomName,  setRoomName]  = useState('Salon')
  const [roomIcon,  setRoomIcon]  = useState('🛋️')

  // ── Objets placés ──────────────────────────────────────────────
  const [placed,      setPlaced]      = useState<PlacedItem[]>([])
  const [selectedId,  setSelectedId]  = useState<string|null>(null)
  const [pendingProd, setPendingProd] = useState<Product|null>(null)

  // ── UI ─────────────────────────────────────────────────────────
  const [showRecap,    setShowRecap]    = useState(false)
  const [showPhoto,    setShowPhoto]    = useState(false)
  const [photoUrl,     setPhotoUrl]     = useState<string|null>(null)
  const [activeWall,   setActiveWall]   = useState<WallSide>('front')
  const [viewMode,     setViewMode]     = useState<ViewMode>('perspective')

  // ── Handlers ───────────────────────────────────────────────────

  // Phase 1 → Phase 2
  const handleMeasureDone = useCallback((dims: RoomDimensions, name: string, icon: string) => {
    setRoom(dims)
    setRoomName(name)
    setRoomIcon(icon)
    setPhase('sim3d')
  }, [])

  // Placement produit sur un mur
  const handleWallHit = useCallback((wall: WallSide, normX: number, normY: number) => {
    if (!pendingProd) return
    const dims  = productDims(pendingProd.dimensions)
    const newItem: PlacedItem = {
      id:      nanoid(),
      product: pendingProd,
      wall,
      normX,
      normY,
      scaleW:  dims.w,
      scaleH:  dims.h,
    }
    setPlaced(prev => [...prev, newItem])
    setSelectedId(newItem.id)
    // Garder le produit sélectionné pour placement multiple
  }, [pendingProd])

  const handleDeletePlaced = useCallback((id: string) => {
    setPlaced(prev => prev.filter(p => p.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const handleAddToCart = useCallback((item: PlacedItem) => {
    addToCart(item.product, 1)
  }, [addToCart])

  // Calcul total devis live
  const totalDevis = placed.reduce((s, p) => s + p.product.priceDA, 0)

  // ══════════════════════════════════════════════════════════════
  if (phase === 'mesure') {
    return <RoomMeasurer onDone={handleMeasureDone} />
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 2 — Simulation 3D
  return (
    <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',background:'#0D0B08' }}>

      {/* ── ZONE VIDÉO + 3D (flex:1) ── */}
      <div style={{ flex:1,position:'relative',minHeight:0 }}>
        <LiveCameraSimulation
          room={room}
          roomName={roomName}
          roomIcon={roomIcon}
          placed={placed}
          selectedId={selectedId}
          pendingProduct={pendingProd}
          onWallHit={handleWallHit}
          onObjSelect={id => setSelectedId(prev => prev===id ? null : id)}
          onBack={() => setPhase('mesure')}
          showRecap={showRecap}
          onOpenRecap={() => setShowRecap(true)}
          onCloseRecap={() => setShowRecap(false)}
          photoUrl={photoUrl}
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeWall={activeWall}
          setActiveWall={setActiveWall}
        />

        {/* Bouton Photo Overlay */}
        <button onClick={() => setShowPhoto(true)}
          style={{ position:'absolute',bottom:12,left:12,zIndex:40,padding:'8px 14px',borderRadius:12,border:'1px solid rgba(201,169,110,.3)',background:'rgba(13,11,8,.8)',backdropFilter:'blur(10px)',color:'#C9A96E',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'Raleway,sans-serif',display:'flex',alignItems:'center',gap:6 }}>
          🖼️ Photo Overlay
        </button>
      </div>

      {/* ── PANNEAU CATALOGUE BAS (hauteur fixe) ── */}
      <div style={{ flexShrink:0,height:'44vh',maxHeight:320,minHeight:220 }}>
        <ProductPlacer
          placed={placed}
          selectedId={selectedId}
          pendingProduct={pendingProd}
          onSelectProduct={setPendingProd}
          onSelectPlaced={id => setSelectedId(prev => prev===id ? null : id)}
          onDeletePlaced={handleDeletePlaced}
          onAddToCart={handleAddToCart}
          totalDevis={totalDevis}
          onOpenRecap={() => setShowRecap(true)}
        />
      </div>

      {/* ── PHOTO OVERLAY MODAL ── */}
      <PhotoOverlay
        isOpen={showPhoto}
        onClose={() => setShowPhoto(false)}
        onPhotoReady={url => { setPhotoUrl(url); setShowPhoto(false) }}
      />
    </div>
  )
}
