import React from 'react'
// Fichier : components/PhotoOverlay.tsx
// Upload photo + superposition 3D (mode "Photo Overlay")
'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onPhotoReady: (dataUrl: string) => void
  onClose:      () => void
  isOpen:       boolean
}

export default function PhotoOverlay({ onPhotoReady, onClose, isOpen }: Props) {
  const fileRef      = useRef<HTMLInputElement>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [dragging,   setDragging]   = useState(false)

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      const url = e.target?.result as string
      setPreview(url)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleConfirm = () => {
    if (preview) { onPhotoReady(preview); onClose() }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(13,11,8,.92)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <motion.div
            initial={{ scale: .9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: .9, y: 20 }}
            style={{ width: '100%', maxWidth: 400, background: 'rgba(26,22,14,.98)', borderRadius: 24, border: '1px solid rgba(201,169,110,.25)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(61,53,40,.8)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🖼️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FAF6EE', fontFamily: 'Raleway,sans-serif' }}>Photo Overlay</div>
                <div style={{ fontSize: 10, color: '#7A6E60', marginTop: 2 }}>Superposez vos meubles 3D sur une vraie photo de votre pièce</div>
              </div>
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(61,53,40,.8)', background: 'rgba(46,40,32,.9)', color: '#B8A898', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Drop zone */}
            <div style={{ padding: 20 }}>
              {!preview ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? '#C9A96E' : 'rgba(61,53,40,.9)'}`,
                    borderRadius: 16, padding: '40px 20px', textAlign: 'center',
                    cursor: 'pointer', transition: 'all .2s',
                    background: dragging ? 'rgba(201,169,110,.05)' : 'transparent',
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#E8DFD0', fontFamily: 'Raleway,sans-serif', marginBottom: 6 }}>
                    Glissez une photo ici
                  </div>
                  <div style={{ fontSize: 11, color: '#7A6E60', marginBottom: 16 }}>
                    ou cliquez pour sélectionner (JPG, PNG, WEBP)
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'rgba(201,169,110,.12)', border: '1px solid rgba(201,169,110,.3)', fontSize: 12, fontWeight: 700, color: '#C9A96E', fontFamily: 'Raleway,sans-serif' }}>
                    📁 Choisir une photo
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
                </div>
              ) : (
                <div>
                  <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                    <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                    <button onClick={() => setPreview(null)}
                      style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.7)', color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(0,230,118,.06)', border: '1px solid rgba(0,230,118,.2)', fontSize: 11, color: '#00E676', fontWeight: 600, marginBottom: 14, fontFamily: 'Raleway,sans-serif' }}>
                    ✅ Photo chargée — Les produits 3D seront superposés sur cette image
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setPreview(null)}
                      style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(61,53,40,.8)', background: 'rgba(30,26,20,.9)', color: '#B8A898', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Raleway,sans-serif' }}>
                      Changer
                    </button>
                    <button onClick={handleConfirm}
                      style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#9A7840,#C9A96E)', color: '#0D0B08', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Raleway,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🚀</span> Appliquer la photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
