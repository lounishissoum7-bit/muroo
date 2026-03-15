// Fichier : lib/calculateDevis.ts
// TOUS les imports EN HAUT — règle TypeScript stricte
import type { Product } from './store'
import { useMuroStore, useCartTotal } from './store'
import { calcStats, type RoomDimensions } from './roomScaler'

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════
export const TVA_RATE = 0.19

// ═══════════════════════════════════════════════════════════════════
// TYPES — Devis PDF (buildDevis)
// ═══════════════════════════════════════════════════════════════════
export interface DevisLine {
  product:   Product
  qty:       number
  unitPrice: number
  totalHT:   number
}

export interface Devis {
  lines:       DevisLine[]
  subtotalHT:  number
  tva:         number
  totalTTC:    number
  room:        RoomDimensions
  roomName:    string
  roomIcon:    string
  generatedAt: string
}

// ═══════════════════════════════════════════════════════════════════
// TYPES — DevisUI (useDevis hook — pour DevisPDF.tsx et devis/page.tsx)
// ═══════════════════════════════════════════════════════════════════
export interface DevisUI {
  lines: Array<{
    label:     string
    qty:       string
    unitPrice: string
    total:     string
    emoji:     string
  }>
  roomName:   string
  surfaceM2:  number
  perimeterM: number
  wallAreaM2: number
  subtotalDA: number
  tvaDA:      number
  totalDA:    number
  date:       string
  summary:    string
}

// ═══════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════
export const fmtDA = (n: number): string =>
  new Intl.NumberFormat('fr-DZ').format(n) + ' DA'

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('fr-DZ', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

// ═══════════════════════════════════════════════════════════════════
// buildDevis — construit un Devis depuis des produits placés
// ═══════════════════════════════════════════════════════════════════
export function buildDevis(
  placed:   Array<{ product: Product; qty: number; surface?: number }>,
  room:     RoomDimensions,
  roomName: string,
  roomIcon: string,
): Devis {
  const lines: DevisLine[] = placed.map(({ product, qty, surface }) => {
    const effectiveQty = product.priceUnit === 'm²' && surface ? surface : qty
    return {
      product,
      qty:       +effectiveQty.toFixed(2),
      unitPrice: product.priceDA,
      totalHT:   +(product.priceDA * effectiveQty).toFixed(0),
    }
  })
  const subtotalHT = lines.reduce((s, l) => s + l.totalHT, 0)
  const tva        = +(subtotalHT * TVA_RATE).toFixed(0)
  return {
    lines, subtotalHT, tva,
    totalTTC:    subtotalHT + tva,
    room, roomName, roomIcon,
    generatedAt: new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════════
// useDevis — hook React (lit Zustand cart + lastRoom)
// Utilisé par : components/DevisPDF.tsx  +  app/devis/page.tsx
// ═══════════════════════════════════════════════════════════════════
export function useDevis(): DevisUI {
  const cart         = useMuroStore(s => s.cart)
  const rooms        = useMuroStore(s => s.rooms)
  const activeRoomId = useMuroStore(s => s.activeRoomId)
  const lastRoom     = useMuroStore(s => s.lastRoom)
  const { subtotal, tva, total } = useCartTotal()

  const activeRoom = rooms.find(r => r.id === activeRoomId) ?? null
  const roomName   = activeRoom?.name ?? lastRoom?.name ?? 'Salon'

  const longueur = lastRoom?.longueur ?? activeRoom?.ceilingH ?? 4
  const largeur  = lastRoom?.largeur  ?? 3.5
  const hauteur  = lastRoom?.hauteur  ?? activeRoom?.ceilingH ?? 2.6

  const surfaceM2  = +(longueur * largeur).toFixed(2)
  const perimeterM = +(2 * (longueur + largeur)).toFixed(2)
  const wallAreaM2 = +(2 * (longueur + largeur) * hauteur).toFixed(2)

  const lines = cart.map(item => ({
    label:     item.product.name,
    emoji:     item.product.emoji,
    qty:       `${item.quantity} ${item.product.priceUnit}`,
    unitPrice: fmtDA(item.product.priceDA),
    total:     fmtDA(item.totalDA),
  }))

  const date      = new Date().toLocaleDateString('fr-DZ', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const linesText = lines
    .map(l => `• ${l.emoji} ${l.label} × ${l.qty} → ${l.total}`)
    .join('\n')
  const summary   = [
    'Bonjour MURO by L&Y 👋',
    '',
    `Devis du ${date}`,
    `Pièce : ${roomName} (${longueur}×${largeur}×${hauteur}m)`,
    '',
    linesText,
    '',
    `Sous-total HT : ${fmtDA(subtotal)}`,
    `TVA 19% : ${fmtDA(tva)}`,
    `TOTAL TTC : ${fmtDA(total)}`,
    '',
    'Merci de confirmer disponibilité et délais — Oran.',
  ].join('\n')

  return {
    lines, roomName,
    surfaceM2, perimeterM, wallAreaM2,
    subtotalDA: subtotal,
    tvaDA:      tva,
    totalDA:    total,
    date, summary,
  }
}

// ═══════════════════════════════════════════════════════════════════
// sendDevisWhatsApp — ouvre WhatsApp avec le message complet
// Utilisé par : components/DevisPDF.tsx
// ═══════════════════════════════════════════════════════════════════
export function sendDevisWhatsApp(message: string, phone: string): void {
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
}

// ═══════════════════════════════════════════════════════════════════
// buildWhatsAppMessage — pour l'ancien flux (LiveCameraSimulation)
// ═══════════════════════════════════════════════════════════════════
export function buildWhatsAppMessage(devis: Devis): string {
  const stats = calcStats(devis.room)
  const lines = devis.lines
    .map(l => `- ${l.product.emoji} ${l.product.name} x${l.qty} = ${fmtDA(l.totalHT)}`)
    .join('\n')
  return encodeURIComponent(
    `Devis MURO by L&Y\n` +
    `Piece: ${devis.roomIcon} ${devis.roomName} | ` +
    `${devis.room.longueur}x${devis.room.largeur}x${devis.room.hauteur}m | ` +
    `Sol: ${stats.surfaceSol}m2\n\n${lines}\n\n` +
    `HT: ${fmtDA(devis.subtotalHT)} | TVA 19%: ${fmtDA(devis.tva)} | TTC: ${fmtDA(devis.totalTTC)}\n` +
    `Date: ${fmtDate(devis.generatedAt)} | muro-lny.vercel.app`
  )
}

export function openWhatsApp(devis: Devis, phone = '213xxxxxxxxx'): void {
  window.open(`https://wa.me/${phone}?text=${buildWhatsAppMessage(devis)}`, '_blank')
}

// ═══════════════════════════════════════════════════════════════════
// exportPDF — génère et télécharge le PDF pro (jsPDF)
// ═══════════════════════════════════════════════════════════════════
export async function exportPDF(devis: Devis): Promise<void> {
  const { jsPDF }  = await import('jspdf')
  const autoTable  = (await import('jspdf-autotable')).default
  const stats      = calcStats(devis.room)
  const doc        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W          = doc.internal.pageSize.getWidth()
  const PH         = doc.internal.pageSize.getHeight()
  const gold  = [201, 169, 110] as [number, number, number]
  const dark  = [13,  11,   8]  as [number, number, number]
  const dark2 = [26,  22,  16]  as [number, number, number]

  // Header
  doc.setFillColor(...dark);  doc.rect(0, 0, W, 38, 'F')
  doc.setFillColor(...gold);  doc.rect(0, 36, W, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28); doc.setTextColor(...gold)
  doc.text('MURO', 14, 24)
  doc.setFontSize(9);  doc.setTextColor(180, 168, 152)
  doc.text('by L & Y  |  Oran, Algerie', 14, 32)
  doc.text(
    `Devis ${Date.now().toString(36).toUpperCase()}  |  ${fmtDate(devis.generatedAt)}`,
    W - 14, 24, { align: 'right' }
  )

  // Pièce
  doc.setFillColor(...dark2); doc.roundedRect(14, 44, W - 28, 30, 3, 3, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...gold)
  doc.text(`${devis.roomIcon} ${devis.roomName}`, 20, 55)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(184, 168, 152)
  doc.text(
    `${devis.room.longueur}m x ${devis.room.largeur}m x ${devis.room.hauteur}m  |  ` +
    `Sol: ${stats.surfaceSol}m2  |  Murs: ${stats.surfaceMurs}m2  |  Vol: ${stats.volume}m3`,
    20, 63
  )

  // Tableau produits
  const rows = devis.lines.map(l => [
    `${l.product.emoji} ${l.product.name}`,
    l.product.priceUnit,
    l.qty.toString(),
    fmtDA(l.unitPrice),
    fmtDA(l.totalHT),
  ])
  autoTable(doc, {
    startY: 82,
    head:   [['Produit', 'Unité', 'Qté', 'Prix Unit. HT', 'Total HT']],
    body:   rows,
    theme:  'grid',
    headStyles:         { fillColor: dark,      textColor: gold, fontStyle: 'bold', fontSize: 9 },
    bodyStyles:         { fillColor: [20,17,11], textColor: [232,223,208], fontSize: 9 },
    alternateRowStyles: { fillColor: dark2 },
    columnStyles: {
      0: { cellWidth: 72 }, 1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 36, halign: 'right' }, 4: { cellWidth: 36, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    styles: { lineColor: [46, 40, 32], lineWidth: 0.3 },
  })

  // Totaux
  const fy = (doc as any).lastAutoTable.finalY + 8
  const tr = (lbl: string, val: string, y: number, hi = false) => {
    if (hi) {
      doc.setFillColor(...gold)
      doc.roundedRect(W - 88, y - 5, 74, 10, 2, 2, 'F')
      doc.setTextColor(...dark)
    } else {
      doc.setTextColor(184, 168, 152)
    }
    doc.setFont('helvetica', hi ? 'bold' : 'normal')
    doc.setFontSize(hi ? 11 : 9)
    doc.text(lbl, W - 90, y, { align: 'right' })
    doc.text(val, W - 14,  y, { align: 'right' })
  }
  tr('Sous-total HT', fmtDA(devis.subtotalHT), fy)
  tr('TVA (19%)',     fmtDA(devis.tva),         fy + 8)
  doc.setFillColor(46, 40, 32); doc.rect(14, fy + 11, W - 28, 0.3, 'F')
  tr('TOTAL TTC',    fmtDA(devis.totalTTC),    fy + 22, true)

  // Footer
  doc.setFillColor(...dark2); doc.rect(0, PH - 20, W, 20, 'F')
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(122, 110, 96)
  doc.text('Devis valable 30 jours | Pose et livraison disponibles sur Oran', W / 2, PH - 12, { align: 'center' })
  doc.setTextColor(...gold)
  doc.text('MURO by L&Y  |  muro-lny.vercel.app', W / 2, PH - 6, { align: 'center' })

  doc.save(`Devis-MURO-${devis.roomName.replace(/\s/g, '-')}-${Date.now()}.pdf`)
}

// ═══════════════════════════════════════════════════════════════════
// exportCanvasAsImage — télécharge le canvas 3D en PNG HD
// ═══════════════════════════════════════════════════════════════════
export async function exportCanvasAsImage(canvasEl: HTMLCanvasElement | null): Promise<void> {
  if (!canvasEl) return
  const a    = document.createElement('a')
  a.download = `MURO-Sim-${Date.now()}.png`
  a.href     = canvasEl.toDataURL('image/png', 1.0)
  a.click()
}
