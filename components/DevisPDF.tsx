// Fichier : components/DevisPDF.tsx
'use client'

import { useCallback } from 'react'
import { useDevis, sendDevisWhatsApp } from '@/lib/calculateDevis'
import { useMuroStore } from '@/lib/store'
import { formatPrice, PRODUCTS } from '@/lib/products'

// MURO WhatsApp business number (Oran) — à remplacer
const MURO_WHATSAPP = '213xxxxxxxxx'

// ═══════════════════════════════════════════════════════
// GÉNÉRATEUR PDF avec jsPDF
// ═══════════════════════════════════════════════════════
export function useDevisPDF() {
  const devis = useDevis()

  const generatePDF = useCallback(async () => {
    // Import dynamique (client-only, évite SSR crash)
    const { jsPDF } = await import('jspdf')
    const autoTable  = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const W   = doc.internal.pageSize.getWidth()

    // ── En-tête MURO ──────────────────────────────────
    // Fond or en-tête
    doc.setFillColor(201, 169, 110)
    doc.rect(0, 0, W, 40, 'F')

    // Titre
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(13, 11, 8)
    doc.text('MURO', 14, 22)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('by L&Y · Décoration Intérieure · Oran, Algérie', 14, 30)

    doc.setFontSize(10)
    doc.setTextColor(50, 40, 30)
    doc.text('DEVIS ESTIMATIF', W - 14, 20, { align: 'right' })
    doc.setFontSize(9)
    doc.text(devis.date, W - 14, 27, { align: 'right' })

    // ── Infos pièce ────────────────────────────────────
    doc.setTextColor(13, 11, 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Informations de la pièce', 14, 54)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 90, 80)

    const infoLines = [
      ['Pièce',           devis.roomName],
      ['Surface sol',     `${devis.surfaceM2.toFixed(2)} m²`],
      ['Périmètre',       `${devis.perimeterM.toFixed(2)} m`],
      ['Surface murs',    `${devis.wallAreaM2.toFixed(2)} m²`],
    ]

    infoLines.forEach(([k, v], i) => {
      doc.setTextColor(120, 110, 96)
      doc.text(k, 14, 63 + i * 7)
      doc.setTextColor(13, 11, 8)
      doc.setFont('helvetica', 'bold')
      doc.text(v, 70, 63 + i * 7)
      doc.setFont('helvetica', 'normal')
    })

    // ── Tableau produits ───────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(13, 11, 8)
    doc.text('Produits et services', 14, 100)

    if (devis.lines.length > 0) {
      autoTable(doc, {
        startY: 105,
        head: [['Désignation', 'Qté', 'Unité', 'Prix unitaire', 'Total']],
        body: devis.lines.map(l => [
          l.label,
          l.quantity.toString(),
          l.unit,
          formatPrice(l.unitPrice),
          formatPrice(l.total),
        ]),
        headStyles: {
          fillColor:  [154, 120, 64],
          textColor:  [13, 11, 8],
          fontStyle:  'bold',
          fontSize:   9,
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 40, 30],
        },
        alternateRowStyles: {
          fillColor: [245, 237, 216],
        },
        styles: {
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 70 },
          4: { halign: 'right', fontStyle: 'bold' },
        },
      })
    } else {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10)
      doc.setTextColor(120, 110, 96)
      doc.text('Aucun produit sélectionné', 14, 115)
    }

    // ── Totaux ─────────────────────────────────────────
    const finalY = (doc as any).lastAutoTable?.finalY ?? 130
    const totY   = finalY + 10

    // Fond totaux
    doc.setFillColor(245, 237, 216)
    doc.roundedRect(14, totY, W - 28, 32, 3, 3, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120, 110, 96)
    doc.text('Sous-total HT', 20, totY + 9)
    doc.text('TVA 19%',        20, totY + 17)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(13, 11, 8)
    doc.text(formatPrice(devis.subtotalDA), W - 20, totY + 9,  { align: 'right' })
    doc.text(formatPrice(devis.tvaDA),      W - 20, totY + 17, { align: 'right' })

    // Ligne totale
    doc.setDrawColor(201, 169, 110)
    doc.setLineWidth(0.5)
    doc.line(20, totY + 21, W - 20, totY + 21)

    doc.setFontSize(13)
    doc.setTextColor(154, 120, 64)
    doc.text('TOTAL TTC',              20,     totY + 28)
    doc.text(formatPrice(devis.totalDA), W - 20, totY + 28, { align: 'right' })

    // ── Pied de page ───────────────────────────────────
    const pageH = doc.internal.pageSize.getHeight()
    doc.setFillColor(30, 26, 20)
    doc.rect(0, pageH - 25, W, 25, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(184, 168, 152)
    doc.text('MURO by L&Y · Oran, Algérie · muro-lny.vercel.app', W / 2, pageH - 14, { align: 'center' })
    doc.text('Ce devis est estimatif. Valable 30 jours. Contactez-nous pour finaliser.', W / 2, pageH - 8, { align: 'center' })

    // ── Télécharger ────────────────────────────────────
    doc.save(`MURO-Devis-${devis.roomName}-${Date.now()}.pdf`)
  }, [devis])

  return { generatePDF, devis }
}

// ═══════════════════════════════════════════════════════
// COMPOSANT DEVIS CARD (affiché dans /devis)
// ═══════════════════════════════════════════════════════
export default function DevisCard() {
  const devis          = useDevis()
  const { generatePDF } = useDevisPDF()
  const clearCart      = useMuroStore(s => s.clearCart)
  const removeFromCart = useMuroStore(s => s.removeFromCart)

  const handleWhatsApp = () => {
    sendDevisWhatsApp(devis.summary, MURO_WHATSAPP)
  }

  if (devis.lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <span className="text-6xl">🛒</span>
        <p className="text-muro-text3 text-sm font-semibold">Panier vide</p>
        <p className="text-muro-text4 text-xs text-center max-w-[200px]">
          Ajoutez des produits depuis la boutique ou simulez en AR
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">

      {/* ── Résumé pièce ─────────────────────────────────── */}
      {devis.surfaceM2 > 0 && (
        <div
          className="p-4 rounded-2xl"
          style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.15)' }}
        >
          <div className="section-title mb-3">📐 Mesures de la pièce</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Surface sol',  `${devis.surfaceM2.toFixed(2)} m²`],
              ['Périmètre',    `${devis.perimeterM.toFixed(2)} m`],
              ['Surface murs', `${devis.wallAreaM2.toFixed(2)} m²`],
              ['Pièce',        devis.roomName],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-muro-text4 text-[10px] mb-0.5">{k}</div>
                <div className="text-muro-text text-[13px] font-bold">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Lignes produits ──────────────────────────────── */}
      <div>
        <div className="section-title mb-3">🛒 Produits sélectionnés</div>
        <div className="flex flex-col gap-2">
          {devis.lines.map((line, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(30,26,20,0.9)', border: '1px solid rgba(46,40,32,0.8)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-muro-text text-[12px] font-bold truncate">{line.label}</div>
                <div className="text-muro-text4 text-[10px] mt-0.5">
                  {line.quantity} {line.unit} × {formatPrice(line.unitPrice)}
                  {line.note && ` · ${line.note}`}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[13px] font-black" style={{ color: 'var(--gold)' }}>
                  {formatPrice(line.total)}
                </span>
                <button
                  onClick={() => {
                    // Find product id by label
                    const prod = PRODUCTS.find((p: { name: string }) => p.name === line.label)
                    if (prod) removeFromCart(prod.id)
                  }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Totaux ───────────────────────────────────────── */}
      <div
        className="p-4 rounded-2xl"
        style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.2)' }}
      >
        <div className="space-y-2">
          {[
            ['Sous-total HT', formatPrice(devis.subtotalDA), false],
            ['TVA 19% (Algérie)', formatPrice(devis.tvaDA), false],
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between items-center">
              <span className="text-muro-text3 text-[12px]">{k}</span>
              <span className="text-muro-text text-[12px] font-semibold">{v}</span>
            </div>
          ))}
          <div
            className="flex justify-between items-center pt-2 mt-2"
            style={{ borderTop: '1px solid rgba(201,169,110,0.2)' }}
          >
            <span className="text-muro-text font-bold text-[14px]">TOTAL TTC</span>
            <span className="font-black text-[18px]" style={{ color: 'var(--gold)' }}>
              {formatPrice(devis.totalDA)}
            </span>
          </div>
        </div>
      </div>

      {/* ── CTA WhatsApp ─────────────────────────────────── */}
      <button
        onClick={handleWhatsApp}
        className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-white text-[14px]"
        style={{ background: 'linear-gradient(135deg,#128C7E,#25D366)', boxShadow: '0 8px 24px rgba(37,211,102,0.25)' }}
      >
        <span className="text-xl">💬</span>
        Envoyer sur WhatsApp
      </button>

      {/* ── Export PDF ───────────────────────────────────── */}
      <button
        onClick={generatePDF}
        className="btn-gold w-full h-13 text-[13px]"
      >
        <span className="text-lg">📄</span>
        Télécharger le PDF
      </button>

      {/* ── Vider le panier ──────────────────────────────── */}
      <button
        onClick={() => {
          if (confirm('Vider le panier ?')) clearCart()
        }}
        className="btn-ghost w-full py-3 text-[12px]"
      >
        🗑 Vider le panier
      </button>

      {/* Date */}
      <p className="text-center text-muro-text4 text-[10px]">
        Devis généré le {devis.date} · MURO by L&amp;Y · Oran
      </p>
    </div>
  )
}
