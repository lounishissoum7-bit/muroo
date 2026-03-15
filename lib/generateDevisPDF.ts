// Fichier : lib/generateDevisPDF.ts
// Générateur PDF luxe — jsPDF vectoriel pur, aucune dépendance image externe
// Style : beige/or, typographie pro, plan 2D vectoriel, tableau produits premium

import type { CartItem, Product } from './store'

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════
export interface RoomInfo {
  name:     string
  icon:     string
  longueur: number   // m
  largeur:  number   // m
  hauteur:  number   // m
}

export interface ClientInfo {
  name:    string
  phone:   string
  address: string
}

export interface DevisPDFInput {
  cart:       CartItem[]
  room:       RoomInfo | null
  client:     ClientInfo
  devisNum:   string        // ex: "DEV-2026-0042"
  dateStr:    string        // ex: "15 mars 2026"
  whatsapp:   string        // numéro sans +
  screenshotDataUrl?: string  // base64 capture simulation (optionnel)
}

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════
const TVA = 0.19

function fmtDA(n: number): string {
  return new Intl.NumberFormat('fr-DZ').format(Math.round(n)) + ' DA'
}

function genDevisNum(): string {
  const d = new Date()
  const rnd = Math.floor(Math.random() * 900) + 100
  return `DEV-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${rnd}`
}

function today(): string {
  return new Date().toLocaleDateString('fr-DZ', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

// Catégorie → label français
const CAT_LABEL: Record<string, string> = {
  'tv-simple': 'Meubles TV',
  'tv-deco':   'TV + Placo Déco',
  'tv':        'Meubles TV',
  'murs':      'Revêtements Muraux',
  'lumiere':   'Éclairage',
  'mobilier':  'Mobilier',
  'services':  'Services & Pose',
}

// ══════════════════════════════════════════════════════════════════
// DESSIN PLAN 2D VECTORIEL
// ══════════════════════════════════════════════════════════════════
function drawRoomPlan(
  doc:  InstanceType<typeof import('jspdf').jsPDF>,
  room: RoomInfo,
  x0:  number, y0: number,       // coin haut-gauche de la zone
  maxW: number, maxH: number     // dimensions max disponibles
) {
  const { longueur: L, largeur: la, hauteur: H } = room

  // Échelle pour tenir dans la boîte
  const scale = Math.min(maxW / L, maxH / la, 18) // max 18 mm/m
  const rW = L  * scale
  const rH = la * scale

  // Centrer
  const ox = x0 + (maxW - rW) / 2
  const oy = y0 + (maxH - rH) / 2

  // Sol — hachures
  for (let i = 0; i * 3 < rW; i++) {
    doc.setDrawColor(220, 210, 195)
    doc.setLineWidth(0.15)
    doc.line(ox + i * 3, oy, ox + i * 3, oy + rH)
  }

  // Murs (rectangle épais)
  doc.setFillColor(245, 240, 232)
  doc.setDrawColor(154, 120, 64)
  doc.setLineWidth(1.2)
  doc.rect(ox, oy, rW, rH, 'FD')

  // Coins (carrés de 2×2)
  ;[[ox,oy],[ox+rW,oy],[ox+rW,oy+rH],[ox,oy+rH]].forEach(([cx,cy]) => {
    doc.setFillColor(154, 120, 64)
    doc.rect(cx-1.2, cy-1.2, 2.4, 2.4, 'F')
  })

  // Icône pièce au centre (texte)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(154, 120, 64)
  doc.text(room.icon, ox + rW/2, oy + rH/2 + 2, { align: 'center' })

  // Nom de la pièce
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(28, 22, 16)
  doc.text(room.name, ox + rW/2, oy + rH/2 + 7, { align: 'center' })

  const R = 4 // décalage cotes

  // ── Cote longueur (bas) ──
  const cyBot = oy + rH + R + 3
  doc.setDrawColor(154, 120, 64)
  doc.setLineWidth(0.4)
  doc.line(ox,      cyBot, ox + rW, cyBot)                  // ligne
  doc.line(ox,      cyBot-1.5, ox,      cyBot+1.5)          // extrémité gauche
  doc.line(ox+rW,   cyBot-1.5, ox+rW,   cyBot+1.5)          // extrémité droite
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(154, 120, 64)
  doc.text(`${L.toFixed(2)} m`, ox + rW/2, cyBot + 4, { align: 'center' })

  // ── Cote largeur (droite) ──
  const cxR = ox + rW + R + 2
  doc.setDrawColor(64, 196, 255)
  doc.line(cxR, oy,      cxR, oy + rH)
  doc.line(cxR-1.5, oy,      cxR+1.5, oy)
  doc.line(cxR-1.5, oy+rH,   cxR+1.5, oy+rH)
  doc.setTextColor(30, 100, 160)
  doc.save()
  doc.translate(cxR + 5, oy + rH/2)
  doc.rotate(-90)
  doc.text(`${la.toFixed(2)} m`, 0, 0, { align: 'center' })
  doc.restore()

  // ── Badge hauteur (en haut à gauche) ──
  doc.setFillColor(13, 11, 8)
  doc.roundedRect(ox, oy - 10, 26, 8, 2, 2, 'F')
  doc.setFontSize(6.5)
  doc.setTextColor(0, 230, 118)
  doc.text(`H: ${H.toFixed(2)} m`, ox + 13, oy - 4.5, { align: 'center' })

  return { ox, oy, rW, rH }
}

// ══════════════════════════════════════════════════════════════════
// GÉNÉRATEUR PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export async function generateDevisPDF(input: DevisPDFInput): Promise<void> {
  const { jsPDF }  = await import('jspdf')
  const autoTable  = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const W  = 210   // mm A4
  const PH = 297

  // ── Palette ──
  const DARK   = [13, 11, 8]    as [number,number,number]
  const DARK2  = [26, 22, 16]   as [number,number,number]
  const DARK3  = [38, 32, 22]   as [number,number,number]
  const GOLD   = [201, 169, 110] as [number,number,number]
  const GOLD2  = [154, 120, 64]  as [number,number,number]
  const CREAM  = [245, 240, 232] as [number,number,number]
  const CREAM2 = [232, 223, 208] as [number,number,number]
  const TEXT   = [28, 22, 16]    as [number,number,number]
  const TEXT3  = [90, 78, 66]    as [number,number,number]
  const GREEN  = [0, 180, 90]    as [number,number,number]

  let Y = 0  // curseur vertical courant

  // ══════════════════════════════════════════════════════════════
  // ── BLOC 1 : EN-TÊTE ─────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  // Fond header dark
  doc.setFillColor(...DARK)
  doc.rect(0, 0, W, 52, 'F')

  // Filet or bas du header
  doc.setFillColor(...GOLD)
  doc.rect(0, 50, W, 2, 'F')

  // Décoration diagonale subtile
  doc.setFillColor(26, 22, 16)
  doc.triangle(W*0.55, 0, W, 0, W, 52, 'F')

  // ── Logo M (SVG-like paths) ──
  const lx = 14, ly = 10
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1.8)
  // Lettre M
  doc.line(lx,    ly+22, lx,    ly)       // montant gauche
  doc.line(lx,    ly,    lx+6,  ly+12)    // diag 1
  doc.line(lx+6,  ly+12, lx+12, ly)       // diag 2
  doc.line(lx+12, ly,    lx+12, ly+22)    // montant droit
  // Lignes décoratives
  doc.setDrawColor(201, 169, 110)
  doc.setLineWidth(0.8)
  doc.line(lx+17, ly+6,  lx+26, ly+6)
  doc.setLineWidth(0.5)
  doc.line(lx+17, ly+11, lx+26, ly+11)
  doc.line(lx+17, ly+16, lx+26, ly+16)
  // Point doré
  doc.setFillColor(...GOLD)
  doc.circle(lx+21.5, ly+3, 1.6, 'F')

  // Titre MURO
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...GOLD)
  doc.text('MURO', 46, 26)

  // Sous-titre
  doc.setFontSize(8.5)
  doc.setTextColor(180, 168, 152)
  doc.text('by L & Y  ·  Décoration Intérieure  ·  Oran, Algérie', 46, 34)

  // Label "DEVIS"
  doc.setFillColor(...GOLD2)
  doc.roundedRect(W-52, 14, 38, 14, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...DARK)
  doc.text('DEVIS', W-33, 23, { align: 'center' })

  // Numéro + date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(180, 168, 152)
  doc.text(input.devisNum, W-14, 34, { align: 'right' })
  doc.text(input.dateStr,  W-14, 39, { align: 'right' })

  Y = 58

  // ══════════════════════════════════════════════════════════════
  // ── BLOC 2 : INFOS CLIENT + PIÈCE (côte à côte) ─────────────
  // ══════════════════════════════════════════════════════════════

  const colW = (W - 28 - 6) / 2    // 2 colonnes avec gap 6
  const col1x = 14, col2x = 14 + colW + 6

  // ── Colonne gauche : Client ──
  doc.setFillColor(...DARK2)
  doc.roundedRect(col1x, Y, colW, 32, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...GOLD)
  doc.text('CLIENT', col1x + 5, Y + 7)
  doc.setLineWidth(0.3)
  doc.setDrawColor(...GOLD2)
  doc.line(col1x + 5, Y + 9, col1x + colW - 5, Y + 9)

  const clientLines = [
    ['👤 Nom',      input.client.name    || 'Non renseigné'],
    ['📱 Tél.',     input.client.phone   || 'Non renseigné'],
    ['📍 Adresse',  input.client.address || 'Oran, Algérie'],
  ]
  clientLines.forEach(([label, val], i) => {
    const cy = Y + 16 + i * 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(130, 118, 104)
    doc.text(label, col1x + 5, cy)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...CREAM2)
    doc.text(String(val), col1x + 22, cy)
  })

  // ── Colonne droite : Pièce ──
  if (input.room) {
    const r = input.room
    const stats = {
      sol:   (r.longueur * r.largeur).toFixed(2),
      murs:  (2 * (r.longueur + r.largeur) * r.hauteur).toFixed(2),
      vol:   (r.longueur * r.largeur * r.hauteur).toFixed(2),
    }

    doc.setFillColor(...DARK2)
    doc.roundedRect(col2x, Y, colW, 32, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GOLD)
    doc.text(`PIÈCE  ${r.icon}  ${r.name.toUpperCase()}`, col2x + 5, Y + 7)
    doc.setLineWidth(0.3)
    doc.line(col2x + 5, Y + 9, col2x + colW - 5, Y + 9)

    const pieceLines: [string, string, string][] = [
      ['↔ Longueur', `${r.longueur.toFixed(2)} m`,  '#C9A96E'],
      ['↕ Largeur',  `${r.largeur.toFixed(2)} m`,   '#40C4FF'],
      ['⤢ Hauteur',  `${r.hauteur.toFixed(2)} m`,   '#00E676'],
      ['⬛ Surface sol',  `${stats.sol} m²`,         '#E8C98A'],
    ]
    pieceLines.forEach(([label, val, color], i) => {
      const cy = Y + 16 + i * 4.2
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(130, 118, 104)
      doc.text(label, col2x + 5, cy)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      // Parse hex to RGB
      const hex = color.replace('#','')
      const rr = parseInt(hex.slice(0,2),16)
      const gg = parseInt(hex.slice(2,4),16)
      const bb = parseInt(hex.slice(4,6),16)
      doc.setTextColor(rr, gg, bb)
      doc.text(val, col2x + colW - 5, cy, { align: 'right' })
    })
  }

  Y += 38

  // ══════════════════════════════════════════════════════════════
  // ── BLOC 3 : PLAN 2D ─────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  if (input.room) {
    // Zone plan
    doc.setFillColor(...DARK2)
    doc.roundedRect(14, Y, W-28, 56, 3, 3, 'F')

    // Label section
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GOLD)
    doc.text('PLAN 2D — DIMENSIONS', 20, Y + 7)
    doc.setLineWidth(0.3)
    doc.setDrawColor(...GOLD2)
    doc.line(20, Y + 9, W - 20, Y + 9)

    // Dessin plan centré dans la zone
    drawRoomPlan(doc, input.room, 20, Y + 12, W - 40, 38)

    // Stats droite
    const r = input.room
    const statsBlock = [
      { label: 'Surface sol',   val: `${(r.longueur*r.largeur).toFixed(2)} m²`,          color: GOLD   },
      { label: 'Surface murs',  val: `${(2*(r.longueur+r.largeur)*r.hauteur).toFixed(2)} m²`, color: [64,196,255] as [number,number,number] },
      { label: 'Périmètre',     val: `${(2*(r.longueur+r.largeur)).toFixed(2)} m`,        color: CREAM2 },
      { label: 'Volume',        val: `${(r.longueur*r.largeur*r.hauteur).toFixed(2)} m³`, color: [255,215,64] as [number,number,number] },
    ]
    statsBlock.forEach((s, i) => {
      const sy = Y + 16 + i * 10
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(100, 90, 78)
      doc.text(s.label, W - 14, sy, { align: 'right' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...s.color)
      doc.text(s.val, W - 14, sy + 4.5, { align: 'right' })
    })

    Y += 62
  }

  // ══════════════════════════════════════════════════════════════
  // ── BLOC 4 : TABLEAU PRODUITS ────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  // Grouper par catégorie
  const byCat: Record<string, CartItem[]> = {}
  input.cart.forEach(item => {
    const cat = item.product.category
    if (!byCat[cat]) byCat[cat] = []
    byCat[cat].push(item)
  })

  // Section title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...GOLD)
  doc.text('DÉTAIL DES PRODUITS', 14, Y + 6)
  doc.setLineWidth(0.3)
  doc.setDrawColor(...GOLD2)
  doc.line(14, Y + 8, W - 14, Y + 8)
  Y += 12

  const allRows: string[][] = []
  const sectionRows: { start: number; cat: string }[] = []

  Object.entries(byCat).forEach(([cat, items]) => {
    sectionRows.push({ start: allRows.length, cat: CAT_LABEL[cat] ?? cat })
    items.forEach(item => {
      const unit    = item.product.priceUnit
      const qty     = item.quantity
      const surface = item.surface ?? 0
      const qtyStr  = unit === 'm²' && surface > 0 ? `${surface.toFixed(1)} m²` : `${qty} ${unit}`
      allRows.push([
        `${item.product.emoji}  ${item.product.name}`,
        qtyStr,
        fmtDA(item.product.priceDA),
        fmtDA(item.totalDA),
      ])
    })
  })

  autoTable(doc, {
    startY: Y,
    head: [['Produit / Prestation', 'Qté / Surface', 'Prix Unit. HT', 'Total HT']],
    body: allRows,
    theme: 'grid',
    headStyles: {
      fillColor:  DARK,
      textColor:  GOLD,
      fontStyle:  'bold',
      fontSize:   8,
      cellPadding: 3,
    },
    bodyStyles: {
      fillColor:  DARK2,
      textColor:  CREAM2,
      fontSize:   8,
      cellPadding: 2.8,
    },
    alternateRowStyles: { fillColor: DARK3 },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 38, halign: 'right' },
      3: { cellWidth: 38, halign: 'right', fontStyle: 'bold', textColor: GOLD },
    },
    margin: { left: 14, right: 14 },
    styles: { lineColor: DARK3, lineWidth: 0.3 },
    // Highlight catégories
    didParseCell(data) {
      if (data.section === 'body') {
        const isSection = sectionRows.find(s => s.start === data.row.index)
        if (isSection) {
          data.cell.styles.fillColor = [46, 38, 26]
          data.cell.styles.textColor = GOLD2
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  const tableEndY: number = (doc as any).lastAutoTable.finalY + 6

  // ══════════════════════════════════════════════════════════════
  // ── BLOC 5 : TOTAUX ──────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  const subtotal = input.cart.reduce((s, i) => s + i.totalDA, 0)
  const tva      = subtotal * TVA
  const total    = subtotal + tva

  let totY = tableEndY

  // Vérifier si on dépasse la page
  if (totY > PH - 70) {
    doc.addPage()
    totY = 20
  }

  // Bloc totaux
  const totX = W - 14 - 80
  doc.setFillColor(...DARK2)
  doc.roundedRect(totX, totY, 80, 42, 3, 3, 'F')

  const totLines: [string, string, boolean][] = [
    ['Sous-total HT',    fmtDA(subtotal), false],
    [`TVA ${TVA*100}%`,  fmtDA(tva),      false],
  ]
  totLines.forEach(([label, val], i) => {
    const ly2 = totY + 8 + i * 9
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(140, 128, 110)
    doc.text(label, totX + 6, ly2)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...CREAM2)
    doc.text(val, totX + 74, ly2, { align: 'right' })
  })

  // Ligne séparatrice
  doc.setDrawColor(...DARK3)
  doc.setLineWidth(0.4)
  doc.line(totX + 6, totY + 27, totX + 74, totY + 27)

  // Total TTC — gros + doré
  doc.setFillColor(...GOLD)
  doc.roundedRect(totX, totY + 30, 80, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text('TOTAL TTC', totX + 6, totY + 38)
  doc.setFontSize(13)
  doc.text(fmtDA(total), totX + 74, totY + 38, { align: 'right' })

  // Note TVA
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(90, 80, 65)
  doc.text('* TVA 19% Algérie incluse · Devis valable 30 jours', 14, totY + 40)

  totY += 50

  // ══════════════════════════════════════════════════════════════
  // ── BLOC 6 : CAPTURE SIMULATION (si fournie) ─────────────────
  // ══════════════════════════════════════════════════════════════

  if (input.screenshotDataUrl && totY < PH - 60) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GOLD)
    doc.text('APERÇU SIMULATION 3D', 14, totY + 6)
    doc.setLineWidth(0.3)
    doc.line(14, totY + 8, W - 14, totY + 8)

    try {
      const imgW  = W - 28
      const imgH  = (imgW * 9) / 16  // ratio 16:9
      doc.addImage(input.screenshotDataUrl, 'PNG', 14, totY + 10, imgW, imgH)
      doc.setDrawColor(...GOLD2)
      doc.setLineWidth(0.5)
      doc.roundedRect(14, totY + 10, imgW, imgH, 2, 2)
      totY += imgH + 18
    } catch {
      // ignore si l'image est invalide
    }
  }

  // ══════════════════════════════════════════════════════════════
  // ── BLOC 7 : SECTION GARANTIES ───────────────────────────────
  // ══════════════════════════════════════════════════════════════

  const guardsY = Math.min(totY, PH - 55)

  const guards = [
    { icon: '✓', text: '5 ans de garantie sur tous nos meubles' },
    { icon: '✓', text: 'Pose et livraison sur Oran et toute la wilaya' },
    { icon: '✓', text: 'Fabrication 100% locale sur mesure' },
    { icon: '✓', text: 'Devis gratuit et sans engagement' },
  ]

  if (guardsY < PH - 50) {
    doc.setFillColor(26, 22, 16)
    doc.roundedRect(14, guardsY, W-28, 26, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GOLD)
    doc.text('NOS ENGAGEMENTS', 20, guardsY + 7)

    guards.forEach((g, i) => {
      const gx = 20 + Math.floor(i / 2) * ((W-28) / 2)
      const gy = guardsY + 14 + (i % 2) * 7
      doc.setFillColor(0, 180, 90)
      doc.circle(gx, gy - 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...CREAM2)
      doc.text(g.text, gx + 4, gy)
    })
  }

  // ══════════════════════════════════════════════════════════════
  // ── BLOC 8 : PIED DE PAGE ────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  const footY = PH - 18
  doc.setFillColor(...DARK)
  doc.rect(0, footY - 4, W, 22, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, footY - 4, W, 0.8, 'F')

  // Colonne gauche : brand
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GOLD)
  doc.text('MURO by L&Y', 14, footY + 3)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 110, 96)
  doc.text('Deux frères oranais passionnés de décoration', 14, footY + 9)

  // Colonne droite : contact
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...GOLD)
  doc.text(`WhatsApp : +${input.whatsapp}`, W/2, footY + 3, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(100, 90, 78)
  doc.text('Oran, Algérie  ·  muro-lny.vercel.app', W/2, footY + 9, { align: 'center' })

  // Numéro de page
  doc.setFontSize(6.5)
  doc.setTextColor(80, 70, 58)
  doc.text(`Page 1/1  ·  ${input.devisNum}`, W - 14, footY + 6, { align: 'right' })

  // ══════════════════════════════════════════════════════════════
  // ── SAUVEGARDE ────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  const clientSlug = (input.client.name || 'Client')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')

  const dateSlug = new Date().toISOString().slice(0,10)
  const filename = `Devis_MURO_by_LY_${dateSlug}_${clientSlug}.pdf`

  doc.save(filename)
}

// ── Utilitaires exportés ──────────────────────────────────────────
export { genDevisNum, today }
