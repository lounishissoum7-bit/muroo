// Fichier : lib/calculateDevis.ts
'use client'
import { useMemo } from 'react'
import { useMuroStore, useActiveRoom, useCartTotal } from './store'
import type { CartItem } from './store'

// ═══════════════════════════════════════════════════════
// TYPES DEVIS
// ═══════════════════════════════════════════════════════
export interface DevisLine {
  label:     string
  quantity:  number
  unit:      string
  unitPrice: number
  total:     number
  note?:     string
}

export interface DevisResult {
  lines:       DevisLine[]
  subtotalDA:  number
  tvaDA:       number   // TVA 19% Algérie
  totalDA:     number
  summary:     string   // Texte WhatsApp formaté
  roomName:    string
  surfaceM2:   number
  perimeterM:  number
  wallAreaM2:  number
  date:        string
}

// ═══════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════
export function useDevis(): DevisResult {
  const room    = useActiveRoom()
  const cart    = useMuroStore(s => s.cart)
  const totals  = useCartTotal()

  return useMemo(() => {
    // ── Calcul surfaces depuis les mesures ──────────────
    const walls   = room?.measurements.filter(m => m.type === 'wall')   ?? []
    const doors   = room?.measurements.filter(m => m.type === 'door')   ?? []
    const windows = room?.measurements.filter(m => m.type === 'window') ?? []
    const heights = room?.measurements.filter(m => m.type === 'height') ?? []

    const ceilingH   = room?.ceilingH ?? 2.5
    const perimeterM = walls.reduce((s, w) => s + w.valueM, 0)
    const sorted     = [...walls].sort((a, b) => b.valueM - a.valueM)
    const L          = sorted[0]?.valueM ?? 0
    const D          = sorted[Math.floor(sorted.length / 2)]?.valueM ?? L
    const surfaceM2  = L * D

    let wallAreaM2   = perimeterM * ceilingH
    doors.forEach(d   => { wallAreaM2 -= d.valueM * Math.min(ceilingH, 2.1) })
    windows.forEach(w => { wallAreaM2 -= w.valueM * 1.2 })
    wallAreaM2 = Math.max(0, wallAreaM2)

    // ── Lignes du devis depuis le panier ────────────────
    const lines: DevisLine[] = cart.map(item => {
      const q     = item.quantity
      const surf  = item.surface ?? 1
      const price = item.product.priceDA
      const unit  = item.product.priceUnit

      let qty    = q
      let total  = price * q

      if (unit === 'm²' && surf > 0) {
        qty   = surf * q
        total = price * qty
      }

      return {
        label:     item.product.name,
        quantity:  Math.round(qty * 100) / 100,
        unit:      unit === 'm²' ? 'm²' : unit === 'ml' ? 'ml' : 'unité',
        unitPrice: price,
        total,
        note: unit === 'm²' ? `${surf.toFixed(1)} m² × ${q} unité(s)` : undefined,
      }
    })

    const subtotalDA = lines.reduce((s, l) => s + l.total, 0)
    const tvaDA      = subtotalDA * 0.19
    const totalDA    = subtotalDA + tvaDA

    // ── Message WhatsApp formaté ─────────────────────────
    const date = new Date().toLocaleDateString('fr-DZ', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    const summary = buildWhatsAppMessage({
      roomName:   room?.name ?? 'Pièce',
      date,
      surfaceM2,
      perimeterM,
      wallAreaM2,
      ceilingH,
      lines,
      subtotalDA,
      tvaDA,
      totalDA,
    })

    return {
      lines,
      subtotalDA,
      tvaDA,
      totalDA,
      summary,
      roomName:   room?.name ?? '—',
      surfaceM2,
      perimeterM,
      wallAreaM2,
      date,
    }
  }, [room, cart, totals])
}

// ═══════════════════════════════════════════════════════
// CALCUL MATÉRIAUX AUTOMATIQUE (depuis mesures)
// ═══════════════════════════════════════════════════════
export function useMaterialsEstimate() {
  const room = useActiveRoom()

  return useMemo(() => {
    if (!room) return null

    const walls   = room.measurements.filter(m => m.type === 'wall')
    const doors   = room.measurements.filter(m => m.type === 'door')
    const windows = room.measurements.filter(m => m.type === 'window')
    const H       = room.ceilingH

    const sorted   = [...walls].sort((a, b) => b.valueM - a.valueM)
    const L        = sorted[0]?.valueM ?? 0
    const D        = sorted[Math.floor(sorted.length / 2)]?.valueM ?? L
    const perim    = walls.reduce((s, w) => s + w.valueM, 0)
    const floor    = L * D

    let wallArea   = perim * H
    doors.forEach(d   => { wallArea -= d.valueM * 2.1 })
    windows.forEach(w => { wallArea -= w.valueM * 1.2 })
    wallArea = Math.max(0, wallArea)

    return {
      perimeterM:    Math.round(perim * 100) / 100,
      floorM2:       Math.round(floor * 100) / 100,
      wallM2:        Math.round(wallArea * 100) / 100,
      ceilingM2:     Math.round(floor * 100) / 100,
      volumeM3:      Math.round(floor * H * 100) / 100,
      // Quantités commandables (+10% chutes)
      carrelageM2:   Math.ceil(floor * 1.10),
      peintureL:     Math.ceil((wallArea + floor) * 0.35),
      enduitKg:      Math.ceil(wallArea * 1.8),
      plinthesMl:    Math.ceil(perim * 1.05),
      faïenceM2:     Math.ceil(wallArea * 0.3 * 1.10),
    }
  }, [room])
}

// ═══════════════════════════════════════════════════════
// GÉNÉRATEUR MESSAGE WHATSAPP
// ═══════════════════════════════════════════════════════
interface WhatsAppParams {
  roomName:   string
  date:       string
  surfaceM2:  number
  perimeterM: number
  wallAreaM2: number
  ceilingH:   number
  lines:      DevisLine[]
  subtotalDA: number
  tvaDA:      number
  totalDA:    number
}

function buildWhatsAppMessage(p: WhatsAppParams): string {
  const fmt = (n: number) => new Intl.NumberFormat('fr-DZ').format(Math.round(n))

  const itemsText = p.lines.map(l =>
    `• ${l.label} (${l.quantity} ${l.unit}) → ${fmt(l.total)} DA`
  ).join('\n')

  return `🏠 *DEVIS MURO by L&Y*
━━━━━━━━━━━━━━━━━━━━
📍 Pièce : ${p.roomName}
📅 Date  : ${p.date}

📐 *Mesures*
• Surface sol   : ${p.surfaceM2.toFixed(2)} m²
• Périmètre     : ${p.perimeterM.toFixed(2)} m
• Surface murs  : ${p.wallAreaM2.toFixed(2)} m²
• Hauteur plafond: ${p.ceilingH.toFixed(2)} m

🛒 *Produits sélectionnés*
${itemsText || '(aucun produit sélectionné)'}

━━━━━━━━━━━━━━━━━━━━
💰 Sous-total : ${fmt(p.subtotalDA)} DA
📋 TVA 19%    : ${fmt(p.tvaDA)} DA
✅ *TOTAL TTC  : ${fmt(p.totalDA)} DA*

📱 Application MURO by L&Y
🌐 muro-lny.vercel.app
📍 Oran, Algérie

_Pour confirmer ou modifier ce devis, répondez à ce message._`
}

// ── Ouvrir WhatsApp avec le message ──────────────────────
export const sendDevisWhatsApp = (message: string, phone?: string) => {
  const encoded = encodeURIComponent(message)
  const url     = phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`
  window.open(url, '_blank')
}
