// Fichier : components/ModelShowcase.tsx
'use client'

/**
 * ModelShowcase — carrousel interactif 3D pour la boutique
 * Tourne automatiquement, zoom au tap, fond transparent
 */

import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import ModelViewer, { parseDimsCm } from './ModelViewer'
import type { Product } from '@/lib/store'

// ─────────────────────────────────────────────────────────────────
// AUTO-ROTATE SCENE
// ─────────────────────────────────────────────────────────────────
function AutoRotate({ children, paused }: { children: React.ReactNode; paused: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (!groupRef.current || paused) return
    groupRef.current.rotation.y += delta * 0.35
  })
  return <group ref={groupRef}>{children}</group>
}

// ─────────────────────────────────────────────────────────────────
// MINI PREVIEW pour la card produit (pas de rotation)
// ─────────────────────────────────────────────────────────────────
export function ProductPreview3D({ product }: { product: Product }) {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])
  if (!ready || !product.model3d) return (
    <div className="w-full h-full flex items-center justify-center text-5xl">
      {product.emoji}
    </div>
  )
  const dims = parseDimsCm(product.dimensions)
  const camZ = Math.max(dims.w, dims.h, dims.d) * 2.5

  return (
    <Canvas
      camera={{ position: [0, dims.h * 0.8, camZ], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 4, 2]} intensity={1.0} />
      <pointLight position={[0, 2, 0]} intensity={0.3} color="#E8C98A" />

      <Suspense fallback={null}>
        <AutoRotate paused={false}>
          <ModelViewer
            product={product}
            position={[0, 0, 0]}
            selected={false}
          />
        </AutoRotate>
        <ContactShadows
          position={[0, -dims.h / 2 - 0.01, 0]}
          opacity={0.3}
          scale={dims.w * 2}
          blur={2}
          far={1}
          color="#000"
        />
      </Suspense>
    </Canvas>
  )
}

// ─────────────────────────────────────────────────────────────────
// FULL SHOWCASE — vue interactive grand format
// ─────────────────────────────────────────────────────────────────
export default function ModelShowcase({ product }: { product: Product }) {
  const [isDragging, setIsDragging] = useState(false)
  const dims   = parseDimsCm(product.dimensions)
  const camDist = Math.max(dims.w, dims.h, dims.d) * 2.8

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ height: 260, background: 'rgba(26,22,16,0.95)' }}
    >
      {/* Info dimensions */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <div
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
          style={{ background: 'rgba(201,169,110,0.12)', color: 'var(--gold3)', border: '1px solid rgba(201,169,110,0.2)' }}
        >
          {product.dimensions}
        </div>
        {product.model3d && (
          <div
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
            style={{ background: 'rgba(139,92,246,0.10)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            🧊 Modèle 3D
          </div>
        )}
      </div>

      {/* Hint rotation */}
      <div className="absolute bottom-3 right-3 z-10 text-muro-text4 text-[10px] flex items-center gap-1">
        <span>↻</span> Glissez pour tourner
      </div>

      <Canvas
        camera={{ position: [camDist * 0.6, dims.h, camDist], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        shadows
        style={{ background: 'transparent' }}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[3, 5, 3]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-2, 3, -2]} intensity={0.4} color="#C9A96E" />

        <Suspense fallback={null}>
          <AutoRotate paused={isDragging}>
            <ModelViewer
              product={product}
              position={[0, 0, 0]}
              selected={false}
            />
          </AutoRotate>

          {/* Sol réfléchissant */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -dims.h / 2 - 0.01, 0]}
            receiveShadow
          >
            <planeGeometry args={[dims.w * 4, dims.d * 4]} />
            <meshStandardMaterial
              color="#1A1610"
              roughness={0.9}
              metalness={0.05}
            />
          </mesh>

          <ContactShadows
            position={[0, -dims.h / 2 - 0.005, 0]}
            opacity={0.45}
            scale={dims.w * 3}
            blur={2.5}
            far={0.5}
            color="#000"
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={camDist * 0.5}
          maxDistance={camDist * 2}
          maxPolarAngle={Math.PI / 2 - 0.05}
          autoRotate={!isDragging}
          autoRotateSpeed={1.5}
        />
      </Canvas>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// COMPARAISON AVANT/APRÈS — slider 3D
// ─────────────────────────────────────────────────────────────────
export function BeforeAfter3D({
  products,
  roomWidth = 4,
}: {
  products: Product[]
  roomWidth?: number
}) {
  const [sliderX, setSliderX] = useState(50)  // 0-100

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 220 }}>
      {/* Labels */}
      <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-lg text-[10px] font-bold bg-red-900/70 text-red-300">
        AVANT
      </div>
      <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-lg text-[10px] font-bold bg-green-900/70 text-green-300">
        APRÈS
      </div>

      <Canvas
        camera={{ position: [0, 1.8, roomWidth * 0.7], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'linear-gradient(180deg,#1A1610,#0D0B08)' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 2]} intensity={1.0} />

        {/* Sol */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[roomWidth, roomWidth]} />
          <meshStandardMaterial color="#221E18" roughness={0.9} />
        </mesh>
        <gridHelper args={[roomWidth, 8, '#3D3528', '#2E2820']} position={[0, 0.001, 0]} />

        {/* Produits côté "après" */}
        <Suspense fallback={null}>
          {products.slice(0, 3).map((p, i) => (
            <ModelViewer
              key={p.id}
              product={p}
              position={[(i - 1) * 1.2, 0, 0]}
              selected={false}
            />
          ))}
        </Suspense>

        <OrbitControls
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>

      {/* Slider */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-3/4">
        <input
          type="range"
          min={0} max={100}
          value={sliderX}
          onChange={e => setSliderX(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: 'var(--gold)' }}
        />
      </div>
    </div>
  )
}
