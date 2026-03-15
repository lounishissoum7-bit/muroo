// Fichier : components/ModelViewer.tsx
'use client'

/**
 * ModelViewer — charge un fichier .glb Three.js
 * Fallback automatique vers une boîte colorée si le modèle n'est pas dispo
 * Utilisé par Simulation3D pour le placement AR des produits MURO
 */

import { Suspense, useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Box, Text, Center, Bounds } from '@react-three/drei'
import * as THREE from 'three'
import type { Product } from '@/lib/store'

// ─────────────────────────────────────────────────────────────────
// FALLBACK — boîte colorée quand le .glb n'est pas encore là
// ─────────────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  tv:       '#3D3528',
  murs:     '#4A4035',
  lumiere:  '#5C4A1E',
  mobilier: '#3A3025',
  services: '#2A2820',
}

function FallbackBox({ product, selected }: { product: Product; selected: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const dims = parseDimsCm(product.dimensions)

  useFrame(() => {
    if (!ref.current) return
    if (selected) ref.current.rotation.y += 0.006
  })

  return (
    <group>
      <Box ref={ref} args={[dims.w, dims.h, dims.d]}>
        <meshStandardMaterial
          color={CAT_COLORS[product.category] ?? '#3D3528'}
          roughness={0.6}
          metalness={0.1}
          emissive={selected ? '#C9A96E' : '#000'}
          emissiveIntensity={selected ? 0.12 : 0}
        />
      </Box>
      {/* LED strip décoratif */}
      {product.category === 'tv' && (
        <Box args={[dims.w * 0.9, 0.012, 0.012]}
          position={[0, -dims.h / 2 + 0.01, dims.d / 2 + 0.008]}>
          <meshStandardMaterial
            color="#FFD740" emissive="#FFD740" emissiveIntensity={0.9}
          />
        </Box>
      )}
      {selected && (
        <Text
          position={[0, dims.h / 2 + 0.18, 0]}
          fontSize={0.075}
          color="#E8C98A"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.004}
          outlineColor="#0D0B08"
        >
          {product.name}
        </Text>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// GLB LOADER — charge le vrai modèle
// ─────────────────────────────────────────────────────────────────
function GLBModel({
  url,
  product,
  selected,
  autoScale,
}: {
  url:        string
  product:    Product
  selected:   boolean
  autoScale?: boolean
}) {
  const { scene } = useGLTF(url)
  const ref        = useRef<THREE.Group>(null)
  const dims       = parseDimsCm(product.dimensions)

  // Cloner la scène pour éviter le partage entre instances
  const cloned = scene.clone(true)

  // Auto-scale pour que le modèle rentre dans les dimensions du produit
  useEffect(() => {
    if (!ref.current || !autoScale) return
    const box = new THREE.Box3().setFromObject(ref.current)
    const size = new THREE.Vector3()
    box.getSize(size)
    if (size.x > 0 && size.y > 0 && size.z > 0) {
      const scaleX = dims.w / size.x
      const scaleY = dims.h / size.y
      const scaleZ = dims.d / size.z
      const s = Math.min(scaleX, scaleY, scaleZ)
      ref.current.scale.set(s, s, s)

      // Re-centrer
      const newBox = new THREE.Box3().setFromObject(ref.current)
      const center = new THREE.Vector3()
      newBox.getCenter(center)
      ref.current.position.sub(center)
      ref.current.position.y += dims.h / 2
    }
  }, [dims, autoScale])

  // Rotation douce si sélectionné
  useFrame(() => {
    if (!ref.current || !selected) return
    ref.current.rotation.y += 0.006
  })

  // Appliquer matériaux améliorés (ombres + MURO palette)
  useEffect(() => {
    if (!ref.current) return
    ref.current.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow    = true
        mesh.receiveShadow = true
        // Booster le roughness pour un look plus luxe
        if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).roughness !== undefined) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          if (mat.roughness < 0.15) mat.roughness = 0.15  // éviter trop miroir
        }
      }
    })
  }, [])

  return (
    <group>
      <primitive ref={ref} object={cloned} />
      {selected && (
        <Text
          position={[0, dims.h + 0.22, 0]}
          fontSize={0.08}
          color="#E8C98A"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#0D0B08"
        >
          {product.name}
        </Text>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL EXPORT
// ─────────────────────────────────────────────────────────────────
interface ModelViewerProps {
  product:   Product
  position:  [number, number, number]
  rotation?: number
  selected?: boolean
  onClick?:  () => void
}

export default function ModelViewer({
  product,
  position,
  rotation = 0,
  selected = false,
  onClick,
}: ModelViewerProps) {
  const [glbFailed, setGlbFailed] = useState(false)
  const hasModel = !!product.model3d && !glbFailed

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      onClick={e => { e.stopPropagation(); onClick?.() }}
    >
      {/* Anneau de sélection au sol */}
      {selected && (
        <SelectionRing radius={Math.max(
          parseDimsCm(product.dimensions).w,
          parseDimsCm(product.dimensions).d
        ) * 0.65} />
      )}

      {/* Modèle 3D ou fallback */}
      {hasModel ? (
        <Suspense fallback={<FallbackBox product={product} selected={selected} />}>
          <GLBErrorBoundary onError={() => setGlbFailed(true)}>
            <GLBModel
              url={product.model3d!}
              product={product}
              selected={selected}
              autoScale
            />
          </GLBErrorBoundary>
        </Suspense>
      ) : (
        <FallbackBox product={product} selected={selected} />
      )}

      {/* Shadow blob */}
      <ShadowBlob dims={parseDimsCm(product.dimensions)} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// SOUS-COMPOSANTS
// ─────────────────────────────────────────────────────────────────

function SelectionRing({ radius }: { radius: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.05
    ref.current.scale.set(s, 1, s)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
      <ringGeometry args={[radius * 0.9, radius * 1.05, 32]} />
      <meshBasicMaterial color="#C9A96E" transparent opacity={0.35} />
    </mesh>
  )
}

function ShadowBlob({ dims }: { dims: { w: number; h: number; d: number } }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
      <planeGeometry args={[dims.w * 1.1, dims.d * 1.1]} />
      <meshBasicMaterial color="#000" transparent opacity={0.15} />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────
// ERROR BOUNDARY pour GLB
// ─────────────────────────────────────────────────────────────────
import React from 'react'

class GLBErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch() { this.props.onError() }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

// ─────────────────────────────────────────────────────────────────
// UTILITAIRE — parser dimensions "120 × 50 × 45 cm"
// ─────────────────────────────────────────────────────────────────
export function parseDimsCm(dim: string): { w: number; h: number; d: number } {
  const nums = dim.match(/[\d.]+/g)?.map(Number) ?? [60, 60, 60]
  const [a = 60, b = 60, c = 60] = nums
  // Si valeurs > 10 → en cm → diviser par 100
  const scale = Math.max(a, b, c) > 10 ? 100 : 1
  return { w: a / scale, h: b / scale, d: c / scale }
}

// ─────────────────────────────────────────────────────────────────
// PRÉCHARGEMENT (appelable depuis _app ou layout)
// ─────────────────────────────────────────────────────────────────
export function preloadModels(models: string[]) {
  models.forEach(url => {
    try { useGLTF.preload(url) } catch {}
  })
}
