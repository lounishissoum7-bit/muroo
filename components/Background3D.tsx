'use client'
// Fichier : components/Background3D.tsx
// Fond 3D léger — panneaux flottants parallax, ZERO impact perf

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Panneau flottant animé
function FloatingPanel({
  pos, rot, scale, color, speed, phase,
}: {
  pos: [number,number,number]; rot: [number,number,number]
  scale: [number,number,number]; color: string; speed: number; phase: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state, delta) => {
    if (Math.round(state.clock.elapsedTime * 30) % 1 !== 0) return // throttle 30fps
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.position.y = pos[1] + Math.sin(t * speed + phase) * 0.08
    ref.current.rotation.z = rot[2] + Math.sin(t * speed * 0.7 + phase) * 0.012
    ref.current.rotation.x = rot[0] + Math.cos(t * speed * 0.5 + phase) * 0.008
  })
  return (
    <mesh ref={ref} position={pos} rotation={rot} scale={scale}>
      <boxGeometry args={[1, 1, 0.025]} />
      <meshStandardMaterial
        color={color}
        roughness={0.55}
        metalness={0.18}
        transparent
        opacity={0.18}
      />
    </mesh>
  )
}

// Lame shiplap horizontale
function ShiplapStrip({ y, x, opacity }: { y: number; x: number; opacity: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(state => {
    if (!ref.current) return
    ref.current.position.x = x + Math.sin(state.clock.elapsedTime * 0.2 + y) * 0.04
  })
  return (
    <mesh ref={ref} position={[x, y, -0.5]}>
      <boxGeometry args={[4.2, 0.09, 0.015]} />
      <meshStandardMaterial color="#C9A96E" roughness={0.7} metalness={0.05} transparent opacity={opacity} />
    </mesh>
  )
}

// Particule dorée
function GoldDot({ pos, speed }: { pos: [number,number,number]; speed: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(state => {
    if (!ref.current) return
    ref.current.position.y = pos[1] + Math.sin(state.clock.elapsedTime * speed + pos[0]) * 0.25
    ref.current.position.x = pos[0] + Math.cos(state.clock.elapsedTime * speed * 0.6 + pos[2]) * 0.12
  })
  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[0.018, 8, 8]} />
      <meshStandardMaterial color="#D4AF77" emissive="#C9A96E" emissiveIntensity={0.6} transparent opacity={0.55} />
    </mesh>
  )
}

function Scene() {
  const panels = useMemo(() => [
    { pos:[-3.2, 0.3,-2.5] as [number,number,number], rot:[0.1,-0.3,0.05] as [number,number,number], scale:[2.2,1.4,1] as [number,number,number], color:'#D4AF77', speed:0.18, phase:0 },
    { pos:[ 3.5,-0.4,-3.0] as [number,number,number], rot:[-0.08,0.25,0.03] as [number,number,number], scale:[1.8,2.6,1] as [number,number,number], color:'#C8BFB0', speed:0.14, phase:1.2 },
    { pos:[ 0.2, 1.1,-3.8] as [number,number,number], rot:[0.05,-0.1,0.12] as [number,number,number], scale:[3.0,0.9,1] as [number,number,number], color:'#B8A898', speed:0.11, phase:2.4 },
    { pos:[-2.0,-1.2,-2.0] as [number,number,number], rot:[0.12,0.18,-0.06] as [number,number,number], scale:[1.2,1.2,1] as [number,number,number], color:'#C9A96E', speed:0.22, phase:0.8 },
    { pos:[ 2.8, 1.5,-4.5] as [number,number,number], rot:[-0.1,-0.2,0.08] as [number,number,number], scale:[1.5,3.5,1] as [number,number,number], color:'#D4C8A8', speed:0.09, phase:3.1 },
  ], [])

  const ships = useMemo(() => Array.from({length: 8}, (_,i) => ({
    y: -1.6 + i * 0.52, x: 0.1 * (i % 3 - 1), opacity: 0.05 + (i % 3) * 0.03
  })), [])

  const dots = useMemo(() => [
    {pos:[-1.5, 0.8,-1.2] as [number,number,number], speed:0.4},
    {pos:[ 2.0,-0.5,-1.5] as [number,number,number], speed:0.3},
    {pos:[-0.5, 1.5,-2.0] as [number,number,number], speed:0.5},
    {pos:[ 1.2, 0.2,-1.8] as [number,number,number], speed:0.35},
    {pos:[-2.2,-0.8,-2.2] as [number,number,number], speed:0.28},
    {pos:[ 0.8, 1.8,-1.0] as [number,number,number], speed:0.45},
  ], [])

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 8, 3]} intensity={0.5} color="#F5F0E8" />
      <pointLight position={[0, 2, 1]} intensity={0.3} color="#D4AF77" />

      {panels.map((p,i) => <FloatingPanel key={i} {...p} />)}
      {ships.map((s,i)  => <ShiplapStrip key={i} {...s} />)}
      {dots.map((d,i)   => <GoldDot key={i} {...d} />)}
    </>
  )
}

export default function Background3D() {
  return (
    <Canvas
      camera={{ position:[0,0,2.5], fov:55 }}
      gl={{ antialias:false, alpha:true, powerPreference:'low-power' }}
      dpr={[1, typeof window !== 'undefined' && window.devicePixelRatio > 2 ? 1.5 : 1]}
      frameloop="demand"
      performance={{ min: 0.5, max: 1 }}
      style={{ position:'absolute', inset:0, pointerEvents:'none' }}
    >
      <Scene />
    </Canvas>
  )
}
