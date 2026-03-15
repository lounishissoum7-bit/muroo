'use client'
// Fichier : app/simulation/page.tsx
// Orchestrateur Phase 1 (Mesure) → Phase 2 (Simulation 3D Live)
// Deep-link : /simulation?product=<id> pré-sélectionne le produit

import dynamic from 'next/dynamic'
import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import IntelligentMeasurer from '@/components/IntelligentMeasurer'
import type { RoomDimensions } from '@/lib/roomScaler'
import type { PlacedItem } from '@/components/ProductPlacer'
import type { Product } from '@/lib/store'
import { productDims } from '@/lib/roomScaler'
import { useMuroStore } from '@/lib/store'
import { getProductById } from '@/lib/products'

const LiveCameraSimulation = dynamic(() => import('@/components/LiveCameraSimulation'), {
  ssr: false,
  loading: () => (
    <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#0D0B08',gap:18 }}>
      <div style={{ width:60,height:60,borderRadius:18,background:'linear-gradient(145deg,#9A7840,#C9A96E)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30 }}>🏠</div>
      <div style={{ color:'#C9A96E',fontSize:13,fontWeight:700,fontFamily:'Raleway,sans-serif' }}>Chargement simulateur 3D…</div>
      <div style={{ display:'flex',gap:6 }}>
        {[0,1,2].map(i=><div key={i} style={{ width:7,height:7,borderRadius:'50%',background:'#C9A96E',animation:`pulse 1.2s ease-in-out ${i*.25}s infinite` }}/>)}
      </div>
    </div>
  ),
})

const ProductPlacer   = dynamic(() => import('@/components/ProductPlacer'),   { ssr: false })
const PhotoOverlay    = dynamic(() => import('@/components/PhotoOverlay'),    { ssr: false })
const MobileBottomNav = dynamic(() => import('@/components/MobileBottomNav'), { ssr: false })

const nanoid = () => Math.random().toString(36).slice(2, 9)

type Phase    = 'mesure' | 'sim3d'
type WallSide = PlacedItem['wall']
type ViewMode = 'perspective' | 'front' | 'top'

// ── Wrapper Suspense pour useSearchParams ─────────────────────────
function SimulationInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const {
    addToCart, pendingProductId, setPendingProductId, setLastRoom,
  } = useMuroStore(s => ({
    addToCart:           s.addToCart,
    pendingProductId:    s.pendingProductId,
    setPendingProductId: s.setPendingProductId,
    setLastRoom:         s.setLastRoom,
  }))

  // ── State ───────────────────────────────────────────────────────
  const [phase,      setPhase]      = useState<Phase>('mesure')
  const [room,       setRoom]       = useState<RoomDimensions>({ longueur:5.5, largeur:4.2, hauteur:2.7 })
  const [roomName,   setRoomName]   = useState('Salon')
  const [roomIcon,   setRoomIcon]   = useState('🛋️')
  const [placed,     setPlaced]     = useState<PlacedItem[]>([])
  const [selectedId, setSelectedId] = useState<string|null>(null)
  const [pendingProd,setPendingProd]= useState<Product|null>(null)
  const [showRecap,  setShowRecap]  = useState(false)
  const [showPhoto,  setShowPhoto]  = useState(false)
  const [photoUrl,   setPhotoUrl]   = useState<string|null>(null)
  const [activeWall, setActiveWall] = useState<WallSide>('front')
  const [viewMode,   setViewMode]   = useState<ViewMode>('perspective')
  const [deepLinkBanner, setDeepLinkBanner] = useState<Product|null>(null)

  // ── Deep-link : ?product=<id> OU pendingProductId Zustand ──────
  useEffect(() => {
    const qParam   = searchParams?.get('product')
    const storeId  = pendingProductId
    const productId = qParam ?? storeId

    if (!productId) return
    const product = getProductById(productId)
    if (!product) return

    // Pré-sélectionner le produit et sauter la phase mesure vers sim3D
    setPendingProd(product)
    setDeepLinkBanner(product)
    setPendingProductId(null)  // consomme le store

    // Auto-banner 4 secondes
    const t = setTimeout(() => setDeepLinkBanner(null), 4000)
    return () => clearTimeout(t)
  }, [searchParams, pendingProductId])  // eslint-disable-line

  // ── Handlers ────────────────────────────────────────────────────
  const handleMeasureDone = useCallback((dims: RoomDimensions, name: string, icon: string) => {
    setRoom(dims); setRoomName(name); setRoomIcon(icon); setPhase('sim3d')
    setLastRoom({ ...dims, name, icon })  // persiste dans Zustand
  }, [setLastRoom])

  const handleWallHit = useCallback((wall: WallSide, normX: number, normY: number) => {
    if (!pendingProd) return
    const dims = productDims(pendingProd.dimensions)
    const item: PlacedItem = { id: nanoid(), product: pendingProd, wall, normX, normY, scaleW: dims.w, scaleH: dims.h }
    setPlaced(prev => [...prev, item])
    setSelectedId(item.id)
  }, [pendingProd])

  const handleDeletePlaced = useCallback((id: string) => {
    setPlaced(prev => prev.filter(p => p.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const handleAddToCart = useCallback((item: PlacedItem) => {
    addToCart(item.product, 1)
  }, [addToCart])

  const totalDevis = placed.reduce((s, p) => s + p.product.priceDA, 0)

  // ── Phase 1 ─────────────────────────────────────────────────────
  if (phase === 'mesure') {
    return (
      <>
      <div style={{ position:'fixed',inset:0 }}>
        <IntelligentMeasurer onDone={handleMeasureDone} />

        {/* Bannière deep-link si produit pré-sélectionné */}
        {deepLinkBanner && (
          <div style={{
            position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',zIndex:200,
            padding:'12px 20px',borderRadius:16,
            background:'linear-gradient(135deg,rgba(154,120,64,.95),rgba(212,175,119,.95))',
            backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:10,
            boxShadow:'0 8px 32px rgba(154,120,64,.35)',fontFamily:'Raleway,sans-serif',
            border:'1px solid rgba(255,255,255,.15)',
          }}>
            <span style={{ fontSize:24 }}>{deepLinkBanner.emoji}</span>
            <div>
              <div style={{ fontSize:11,fontWeight:800,color:'rgba(28,22,16,.7)',letterSpacing:'1px' }}>PRODUIT PRÉ-SÉLECTIONNÉ</div>
              <div style={{ fontSize:13,fontWeight:800,color:'#1C1610' }}>{deepLinkBanner.name}</div>
            </div>
            <div style={{ marginLeft:4,fontSize:11,fontWeight:700,color:'rgba(28,22,16,.7)' }}>→ Mesurez la pièce</div>
          </div>
        )}
      </div>
      <MobileBottomNav />
      </>
    )
  }

  // ── Phase 2 ─────────────────────────────────────────────────────
  return (
    <>
    {/* Hint paysage */}
    <div className="sim-cam-hint" style={{ display:'none', position:'fixed', inset:0, zIndex:999, background:'rgba(13,11,8,0.95)', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <span style={{ fontSize:48 }}>🔄</span>
      <div style={{ fontFamily:'Raleway,sans-serif', fontSize:16, fontWeight:800, color:'#C9A96E' }}>Retournez en portrait</div>
      <div style={{ fontFamily:'Raleway,sans-serif', fontSize:12, color:'#7A6E60' }}>La simulation caméra fonctionne en mode portrait uniquement</div>
    </div>
    <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',background:'#0D0B08' }}>

      {/* Bannière deep-link en phase sim */}
      {deepLinkBanner && (
        <div style={{
          position:'absolute',top:80,left:'50%',transform:'translateX(-50%)',zIndex:200,
          padding:'9px 18px',borderRadius:14,
          background:'linear-gradient(135deg,rgba(154,120,64,.92),rgba(212,175,119,.92))',
          backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:8,
          fontFamily:'Raleway,sans-serif',fontSize:12,fontWeight:700,color:'#1C1610',
          boxShadow:'0 6px 24px rgba(154,120,64,.3)',whiteSpace:'nowrap',
        }}>
          <span style={{ fontSize:18 }}>{deepLinkBanner.emoji}</span>
          {deepLinkBanner.name} pré-sélectionné — touchez un mur pour le placer
          <button onClick={()=>setDeepLinkBanner(null)} style={{ marginLeft:4,width:20,height:20,borderRadius:'50%',border:'none',background:'rgba(28,22,16,.2)',cursor:'pointer',fontSize:11,color:'#1C1610',display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
        </div>
      )}

      <div style={{ flex:1,position:'relative',minHeight:0 }}>
        <LiveCameraSimulation
          room={room} roomName={roomName} roomIcon={roomIcon}
          placed={placed} selectedId={selectedId} pendingProduct={pendingProd}
          onWallHit={handleWallHit}
          onObjSelect={id => setSelectedId(prev => prev===id ? null : id)}
          onBack={() => setPhase('mesure')}
          showRecap={showRecap}
          onOpenRecap={() => setShowRecap(true)}
          onCloseRecap={() => setShowRecap(false)}
          photoUrl={photoUrl}
          viewMode={viewMode} setViewMode={setViewMode}
          activeWall={activeWall} setActiveWall={setActiveWall}
        />
        <button onClick={() => setShowPhoto(true)}
          style={{ position:'absolute',bottom:12,left:12,zIndex:40,padding:'8px 14px',borderRadius:12,border:'1px solid rgba(201,169,110,.3)',background:'rgba(13,11,8,.8)',backdropFilter:'blur(10px)',color:'#C9A96E',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'Raleway,sans-serif',display:'flex',alignItems:'center',gap:6 }}>
          🖼️ Photo Overlay
        </button>
      </div>

      <div style={{ flexShrink:0,height:'44vh',maxHeight:320,minHeight:220 }}>
        <ProductPlacer
          placed={placed} selectedId={selectedId} pendingProduct={pendingProd}
          onSelectProduct={setPendingProd}
          onSelectPlaced={id => setSelectedId(prev => prev===id ? null : id)}
          onDeletePlaced={handleDeletePlaced}
          onAddToCart={handleAddToCart}
          totalDevis={totalDevis}
          onOpenRecap={() => setShowRecap(true)}
        />
      </div>

      <PhotoOverlay
        isOpen={showPhoto}
        onClose={() => setShowPhoto(false)}
        onPhotoReady={url => { setPhotoUrl(url); setShowPhoto(false) }}
      />
    </div>
    </>
  )
}

// ── Export avec Suspense (requis pour useSearchParams) ────────────
export default function SimulationPage() {
  return (
    <Suspense fallback={
      <div style={{ position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#0D0B08' }}>
        <div style={{ color:'#C9A96E',fontFamily:'Raleway,sans-serif',fontSize:14,fontWeight:700 }}>Chargement…</div>
      </div>
    }>
      <SimulationInner />
    </Suspense>
  )
}
