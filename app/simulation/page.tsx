// app/simulation/page.tsx — PHASE 1: Mesure | PHASE 2: Simulation 3D
'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import MesurePhase from '@/components/MesurePhase'

const Sim3D = dynamic(() => import('@/components/Sim3D'), {
  ssr: false,
  loading: () => (
    <div style={{ position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#0D0B08',flexDirection:'column',gap:16 }}>
      <div style={{ width:56,height:56,borderRadius:16,background:'linear-gradient(145deg,#9A7840,#C9A96E)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28 }}>📐</div>
      <div style={{ color:'#C9A96E',fontSize:13,fontWeight:700,fontFamily:'Raleway,sans-serif' }}>Chargement 3D…</div>
      <div style={{ display:'flex',gap:6 }}>
        {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:'50%',background:'#C9A96E',animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
      </div>
    </div>
  ),
})

export interface RoomData {
  name: string
  icon: string
  longueur: number   // metres
  largeur:  number
  hauteur:  number
}

export default function SimulationPage() {
  const [phase, setPhase] = useState<'mesure' | 'sim3d'>('mesure')
  const [room,  setRoom]  = useState<RoomData | null>(null)

  const handleMesureDone = (data: RoomData) => {
    setRoom(data)
    setPhase('sim3d')
  }

  if (phase === 'mesure') {
    return <MesurePhase onDone={handleMesureDone} />
  }
  return <Sim3D room={room!} onBack={() => setPhase('mesure')} />
}
