// Fichier : components/Simulation3D.tsx
'use client'

import {
  useRef, useEffect, useState, useCallback, Suspense
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Environment, Text, Box, Plane, useGLTF,
  PerspectiveCamera, OrbitControls
} from '@react-three/drei'
import * as THREE from 'three'
import { useMuroStore } from '@/lib/store'
import type { Product } from '@/lib/store'
import { PRODUCTS, formatPrice } from '@/lib/products'
import ModelViewer from '@/components/ModelViewer'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
interface Point2D { x: number; y: number }

interface ARSegment {
  id:      string
  p1:      THREE.Vector3
  p2:      THREE.Vector3
  type:    'wall' | 'door' | 'window'
  distM:   number
}

interface PlacedMesh {
  id:       string
  product:  Product
  position: [number, number, number]
  rotation: number
}

// ═══════════════════════════════════════════════════════
// COMPOSANT PRODUIT 3D (charge .glb si dispo, sinon box)
// ═══════════════════════════════════════════════════════
function ProductMesh({
  product,
  position,
  rotation,
  selected,
  onPress,
}: {
  product:  Product
  position: [number, number, number]
  rotation: number
  selected: boolean
  onPress:  () => void
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!ref.current) return
    if (selected) {
      ref.current.rotation.y += 0.008
    }
  })

  // Dimensions en mètres depuis la description (ex: "120 × 50 × 45 cm")
  const dims = parseDimensions(product.dimensions)

  return (
    <group
      ref={ref}
      position={position}
      rotation={[0, rotation, 0]}
      onClick={onPress}
    >
      {/* Corps principal */}
      <Box args={[dims.w, dims.h, dims.d]}>
        <meshStandardMaterial
          color={selected ? '#E8C98A' : productColor(product.category)}
          roughness={0.4}
          metalness={product.category === 'lumiere' ? 0.7 : 0.1}
          emissive={selected ? '#C9A96E' : '#000000'}
          emissiveIntensity={selected ? 0.15 : 0}
        />
      </Box>

      {/* LED strip si c'est un meuble TV */}
      {product.category === 'tv' && (
        <Box
          args={[dims.w * 0.95, 0.02, 0.02]}
          position={[0, -dims.h / 2 + 0.01, dims.d / 2 + 0.01]}
        >
          <meshStandardMaterial
            color="#FFD740"
            emissive="#FFD740"
            emissiveIntensity={0.8}
          />
        </Box>
      )}

      {/* Étiquette flottante */}
      {selected && (
        <Text
          position={[0, dims.h / 2 + 0.2, 0]}
          fontSize={0.08}
          color="#E8C98A"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.004}
          outlineColor="#0D0B08"
        >
          {product.name}
        </Text>
      )}

      {/* Ombre au sol */}
      <Plane
        args={[dims.w * 1.2, dims.d * 1.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -dims.h / 2 - 0.001, 0]}
      >
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.18}
        />
      </Plane>
    </group>
  )
}

// ═══════════════════════════════════════════════════════
// SEGMENT DE MESURE AR
// ═══════════════════════════════════════════════════════
function MeasureSegmentMesh({ seg }: { seg: ARSegment }) {
  const mid    = new THREE.Vector3().addVectors(seg.p1, seg.p2).multiplyScalar(0.5)
  const dir    = new THREE.Vector3().subVectors(seg.p2, seg.p1)
  const len    = dir.length()
  const angle  = Math.atan2(dir.x, dir.z)

  const color = seg.type === 'wall' ? '#00E676'
              : seg.type === 'door' ? '#FFD740'
              : '#40C4FF'

  return (
    <group>
      {/* Ligne */}
      <mesh position={[mid.x, mid.y, mid.z]} rotation={[0, angle, 0]}>
        <boxGeometry args={[0.015, 0.015, len]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Points A et B */}
      {[seg.p1, seg.p2].map((pt, i) => (
        <mesh key={i} position={[pt.x, pt.y, pt.z]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}

      {/* Label distance */}
      <Text
        position={[mid.x, mid.y + 0.15, mid.z]}
        fontSize={0.09}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.004}
        outlineColor="#0D0B08"
      >
        {seg.distM.toFixed(2)} m
      </Text>
    </group>
  )
}

// ═══════════════════════════════════════════════════════
// SOL VIRTUEL AR
// ═══════════════════════════════════════════════════════
function ARFloor({ onClick }: { onClick: (pos: THREE.Vector3) => void }) {
  return (
    <Plane
      args={[20, 20]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onClick={e => {
        e.stopPropagation()
        onClick(e.point)
      }}
    >
      <meshBasicMaterial transparent opacity={0} />
    </Plane>
  )
}

// ═══════════════════════════════════════════════════════
// GRILLE DÉMONSTRATION (quand pas de caméra)
// ═══════════════════════════════════════════════════════
function DemoRoom() {
  return (
    <group>
      {/* Sol */}
      <Plane args={[6, 6]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1A1610" roughness={0.9} />
      </Plane>
      {/* Mur fond */}
      <Plane args={[6, 3]} position={[0, 1.5, -3]}>
        <meshStandardMaterial color="#221E18" roughness={0.8} />
      </Plane>
      {/* Mur gauche */}
      <Plane args={[6, 3]} rotation={[0, Math.PI / 2, 0]} position={[-3, 1.5, 0]}>
        <meshStandardMaterial color="#1E1A14" roughness={0.8} />
      </Plane>
      {/* Grille au sol */}
      <gridHelper args={[6, 12, '#3D3528', '#2E2820']} position={[0, 0.001, 0]} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════
// SCÈNE 3D PRINCIPALE
// ═══════════════════════════════════════════════════════
function Scene({
  segments,
  placed,
  selectedId,
  nextPoint,
  onFloorClick,
  onObjectClick,
}: {
  segments:     ARSegment[]
  placed:       PlacedMesh[]
  selectedId:   string | null
  nextPoint:    THREE.Vector3 | null
  onFloorClick: (pos: THREE.Vector3) => void
  onObjectClick:(id: string) => void
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} castShadow />
      <pointLight position={[0, 3, 0]} intensity={0.4} color="#E8C98A" />

      <DemoRoom />
      <ARFloor onClick={onFloorClick} />

      {/* Segments de mesure */}
      {segments.map(seg => (
        <MeasureSegmentMesh key={seg.id} seg={seg} />
      ))}

      {/* Point en cours */}
      {nextPoint && (
        <mesh position={[nextPoint.x, nextPoint.y, nextPoint.z]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#FFD740" />
        </mesh>
      )}

      {/* Objets placés — modèles .glb MURO */}
      {placed.map(pm => (
        <Suspense key={pm.id} fallback={null}>
          <ModelViewer
            product={pm.product}
            position={pm.position}
            rotation={pm.rotation}
            selected={pm.id === selectedId}
            onClick={() => onObjectClick(pm.id)}
          />
        </Suspense>
      ))}
    </>
  )
}

// ═══════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL EXPORT
// ═══════════════════════════════════════════════════════
export default function Simulation3D() {
  const [segments,    setSegments]    = useState<ARSegment[]>([])
  const [placed,      setPlaced]      = useState<PlacedMesh[]>([])
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [measureStep, setMeasureStep] = useState<0 | 1 | 2>(0)
  const [firstPt,     setFirstPt]     = useState<THREE.Vector3 | null>(null)
  const [activeMode,  setActiveMode]  = useState<'view' | 'measure' | 'place'>('view')
  const [measureType, setMeasureType] = useState<'wall' | 'door' | 'window'>('wall')
  const [catFilter,   setCatFilter]   = useState<string>('tv')
  const [showCat,     setShowCat]     = useState(false)
  const [toast,       setToast]       = useState<string | null>(null)
  const [webxrStatus, setWebxrStatus] = useState<'unknown' | 'supported' | 'unsupported'>('unknown')

  const { selectedProduct, setSelectedProduct, addMeasurement, activeRoomId } = useMuroStore()

  // ── Vérifier WebXR ─────────────────────────────────────
  useEffect(() => {
    if (!('xr' in navigator)) { setWebxrStatus('unsupported'); return }
    navigator.xr!.isSessionSupported('immersive-ar')
      .then(ok => setWebxrStatus(ok ? 'supported' : 'unsupported'))
      .catch(()  => setWebxrStatus('unsupported'))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  // ── Tap sur le sol ──────────────────────────────────────
  const handleFloorClick = useCallback((pos: THREE.Vector3) => {
    if (activeMode === 'place' && selectedProduct) {
      const id = Math.random().toString(36).slice(2, 8)
      setPlaced(prev => [...prev, {
        id,
        product:  selectedProduct,
        position: [pos.x, 0, pos.z],
        rotation: 0,
      }])
      showToast(`✅ ${selectedProduct.name} placé`)
      return
    }

    if (activeMode !== 'measure') return

    if (measureStep === 0) {
      setFirstPt(pos.clone())
      setMeasureStep(1)
      showToast('✅ Point A — touchez le Point B')
      return
    }

    if (measureStep === 1 && firstPt) {
      const dist = firstPt.distanceTo(pos)
      const id   = Math.random().toString(36).slice(2, 8)

      setSegments(prev => [...prev, {
        id,
        p1:    firstPt,
        p2:    pos.clone(),
        type:  measureType,
        distM: Math.round(dist * 100) / 100,
      }])

      // Sauvegarder dans le store
      if (activeRoomId) {
        addMeasurement({
          type:   measureType,
          valueM: dist,
          label:  `${measureType} ${segments.length + 1}`,
          roomId: activeRoomId,
        })
      }

      showToast(`📐 ${measureType} : ${dist.toFixed(2)} m`)
      setFirstPt(null)
      setMeasureStep(0)
    }
  }, [activeMode, selectedProduct, measureStep, firstPt, measureType, segments.length, activeRoomId, addMeasurement])

  // ── Object click ───────────────────────────────────────
  const handleObjectClick = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id)
  }, [])

  // ── Lancer WebXR ───────────────────────────────────────
  const launchAR = async () => {
    if (webxrStatus !== 'supported') {
      showToast('⚠️ WebXR non dispo — mode simulation 3D activé')
      return
    }
    try {
      // WebXR natif sans @react-three/xr
      const session = await (navigator as any).xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'light-estimation'],
        domOverlay: { root: document.body },
      })
      session.addEventListener('end', () => showToast('Session AR terminée'))
      showToast('✅ Session AR démarrée')
    } catch (e) {
      showToast('Erreur WebXR — utilisez Chrome Android avec ARCore')
    }
  }

  const filteredProducts = PRODUCTS.filter(p => p.category === catFilter)

  return (
    <div className="relative w-full h-full flex flex-col">

      {/* ── CANVAS THREE.JS ─────────────────────────────── */}
      <div className="flex-1 relative">
        <Canvas
            shadows
            camera={{ position: [0, 2, 4], fov: 60 }}
            gl={{ alpha: true, antialias: true }}
            style={{ background: 'transparent' }}
          >
            <Suspense fallback={null}>
              <Scene
                segments={segments}
                placed={placed}
                selectedId={selectedId}
                nextPoint={firstPt}
                onFloorClick={handleFloorClick}
                onObjectClick={handleObjectClick}
              />
            </Suspense>
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              enabled={activeMode === 'view'}
              maxPolarAngle={Math.PI / 2 - 0.05}
            />
        </Canvas>

        {/* ── AR status chip ──────────────────────────────── */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <div className="ar-chip">
            <div className="ar-live-dot" />
            <span>
              {webxrStatus === 'supported'   ? 'WebXR prêt'   :
               webxrStatus === 'unsupported' ? 'Mode 3D'      : '...'}
            </span>
          </div>
          {segments.length > 0 && (
            <div className="ar-chip">
              📐 {segments.length} mesure{segments.length > 1 ? 's' : ''}
            </div>
          )}
          {placed.length > 0 && (
            <div className="ar-chip">
              🛋️ {placed.length} objet{placed.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* ── Guide contextuel ────────────────────────────── */}
        {(activeMode === 'measure' || activeMode === 'place') && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div
              className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white text-center"
              style={{ background: 'rgba(13,11,8,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(201,169,110,0.25)' }}
            >
              {activeMode === 'place'   ? `Touchez le sol pour placer\n${selectedProduct?.name}` :
               measureStep === 0       ? '① Touchez le Point A sur le sol' :
                                         '② Touchez le Point B'}
            </div>
          </div>
        )}

        {/* ── Toast ───────────────────────────────────────── */}
        {toast && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl text-[12px] font-semibold text-white whitespace-nowrap z-50"
            style={{ background: 'rgba(13,11,8,0.9)', border: '1px solid rgba(201,169,110,0.3)', backdropFilter: 'blur(10px)' }}
          >
            {toast}
          </div>
        )}

        {/* ── Bouton WebXR ────────────────────────────────── */}
        {webxrStatus === 'supported' && (
          <button
            onClick={launchAR}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-[11px] font-bold text-muro-dark"
            style={{ background: 'linear-gradient(135deg,#9A7840,#C9A96E)' }}
          >
            📱 AR réel
          </button>
        )}

        {/* ── Supprimer sélection ──────────────────────────── */}
        {selectedId && (
          <button
            onClick={() => {
              setPlaced(prev => prev.filter(p => p.id !== selectedId))
              setSelectedId(null)
            }}
            className="absolute bottom-20 right-4 w-12 h-12 rounded-full flex items-center justify-center text-lg"
            style={{ background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(8px)' }}
          >
            🗑
          </button>
        )}
      </div>

      {/* ── TOOLBAR MODES ───────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{ background: 'rgba(13,11,8,0.95)', borderTop: '1px solid rgba(201,169,110,0.12)', backdropFilter: 'blur(12px)', paddingBottom: 'max(12px,env(safe-area-inset-bottom))' }}
      >

        {/* Mode tabs */}
        <div className="flex border-b border-muro-border/60 overflow-x-auto scrollbar-hide">
          {([ ['view','👆','Vue'], ['measure','📐','Mesurer'], ['place','🛋️','Placer'] ] as const).map(([m,ic,lb]) => (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-5 py-2.5 text-[10px] font-bold tracking-wide transition-colors"
              style={{
                color:        activeMode === m ? 'var(--gold)' : 'var(--text4)',
                borderBottom: activeMode === m ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              <span className="text-base">{ic}</span>
              {lb.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Mesure — type selector */}
        {activeMode === 'measure' && (
          <div className="flex gap-2 px-3 pt-3 pb-1 overflow-x-auto scrollbar-hide">
            {([ ['wall','🧱','Mur'], ['door','🚪','Porte'], ['window','🪟','Fenêtre'] ] as const).map(([t,ic,lb]) => (
              <button
                key={t}
                onClick={() => setMeasureType(t)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                style={{
                  background:   measureType === t ? 'rgba(201,169,110,0.15)' : 'rgba(46,40,32,0.8)',
                  border:       `1px solid ${measureType === t ? 'rgba(201,169,110,0.4)' : 'rgba(61,53,40,0.8)'}`,
                  color:        measureType === t ? 'var(--gold2)' : 'var(--text3)',
                }}
              >
                {ic} {lb}
              </button>
            ))}
            {measureStep === 1 && (
              <button
                onClick={() => { setFirstPt(null); setMeasureStep(0) }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}
              >
                ✕ Annuler
              </button>
            )}
          </div>
        )}

        {/* Place — catalogue */}
        {activeMode === 'place' && (
          <div className="pt-3 pb-1">
            {/* Cat filter */}
            <div className="flex gap-2 px-3 mb-2 overflow-x-auto scrollbar-hide">
              {(['tv','murs','lumiere','mobilier'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
                  style={{
                    background: catFilter === cat ? 'rgba(201,169,110,0.15)' : 'rgba(46,40,32,0.8)',
                    border:     `1px solid ${catFilter === cat ? 'rgba(201,169,110,0.4)' : 'rgba(61,53,40,0.8)'}`,
                    color:      catFilter === cat ? 'var(--gold2)' : 'var(--text3)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products horizontal scroll */}
            <div className="flex gap-2.5 px-3 overflow-x-auto scrollbar-hide pb-1">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(p)
                    showToast(`Sélectionné : ${p.name} — touchez le sol`)
                  }}
                  className="flex-shrink-0 flex flex-col items-center text-center"
                  style={{ width: 72 }}
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-1 transition-all"
                    style={{
                      background:  selectedProduct?.id === p.id ? 'rgba(201,169,110,0.2)' : 'rgba(30,26,20,0.9)',
                      border:      `1px solid ${selectedProduct?.id === p.id ? 'rgba(201,169,110,0.5)' : 'rgba(61,53,40,0.8)'}`,
                      boxShadow:   selectedProduct?.id === p.id ? '0 0 0 2px rgba(201,169,110,0.3)' : 'none',
                    }}
                  >
                    {p.emoji}
                  </div>
                  <span className="text-[9px] font-semibold text-muro-text3 leading-tight line-clamp-2">
                    {p.name}
                  </span>
                  <span className="text-[9px] font-bold text-muro-gold mt-0.5">
                    {formatPrice(p.priceDA)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions rapides toujours visibles */}
        {activeMode === 'view' && segments.length === 0 && placed.length === 0 && (
          <div className="px-3 pt-3 pb-1 flex gap-2">
            <button
              onClick={() => setActiveMode('measure')}
              className="flex-1 py-3 rounded-xl text-[12px] font-bold"
              style={{ background: 'linear-gradient(135deg,#9A7840,#C9A96E)', color: '#0D0B08' }}
            >
              📐 Commencer la mesure
            </button>
            <button
              onClick={() => setActiveMode('place')}
              className="flex-1 py-3 rounded-xl text-[12px] font-bold btn-ghost"
            >
              🛋️ Placer meuble
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════
function parseDimensions(dim: string): { w: number; h: number; d: number } {
  // "120 × 50 × 45 cm" → { w: 1.20, h: 0.50, d: 0.45 }
  const matches = dim.match(/\d+/g)?.map(Number) ?? [60, 60, 60]
  const [a = 60, b = 60, c = 60] = matches
  return { w: a / 100, h: b / 100, d: c / 100 }
}

function productColor(cat: string): string {
  const map: Record<string, string> = {
    tv:       '#3D3528',
    murs:     '#4A4035',
    lumiere:  '#5C4A1E',
    mobilier: '#3A3025',
    services: '#2A2820',
  }
  return map[cat] ?? '#3D3528'
}
