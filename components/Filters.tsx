// Fichier : components/Filters.tsx
'use client'

import { motion } from 'framer-motion'

export const FILTER_DEFS = [
  { id: 'all',       label: 'Tout',        emoji: '✨', count: null },
  { id: 'tv-simple', label: 'Meubles TV',  emoji: '📺', count: null },
  { id: 'tv-deco',   label: 'TV + Placo',  emoji: '🏛️', count: null },
  { id: 'murs',      label: 'Revêtements', emoji: '🪨', count: null },
  { id: 'lumiere',   label: 'Éclairage',   emoji: '💡', count: null },
  { id: 'mobilier',  label: 'Mobilier',    emoji: '🛋️', count: null },
  { id: 'services',  label: 'Services',    emoji: '🔧', count: null },
] as const

export type FilterId = typeof FILTER_DEFS[number]['id']

export const PRICE_RANGES = [
  { id: 'all',  label: 'Tous les prix' },
  { id: '0-10', label: '< 10 000 DA'   },
  { id: '10-50',label: '10k – 50k DA'  },
  { id: '50-100',label:'50k – 100k DA' },
  { id: '100+', label: '> 100 000 DA'  },
] as const
export type PriceRangeId = typeof PRICE_RANGES[number]['id']

interface Props {
  active:       FilterId
  priceRange:   PriceRangeId
  search:       string
  counts:       Record<string, number>
  onFilter:     (f: FilterId) => void
  onPrice:      (p: PriceRangeId) => void
  onSearch:     (q: string) => void
  totalVisible: number
}

export default function Filters({ active, priceRange, search, counts, onFilter, onPrice, onSearch, totalVisible }: Props) {
  return (
    <div style={{ background: '#FDFAF5', borderBottom: '1px solid rgba(154,120,64,0.12)', position: 'sticky', top: 0, zIndex: 80 }}>

      {/* Barre de recherche */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none', opacity: 0.45 }}>🔍</span>
          <input
            type="search" value={search} onChange={e => onSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            style={{
              width: '100%', height: 42, borderRadius: 12, border: '1px solid rgba(154,120,64,0.25)',
              background: 'rgba(255,255,255,0.85)', paddingLeft: 40, paddingRight: 14,
              fontSize: 13, fontFamily: 'Raleway,sans-serif', fontWeight: 500,
              color: '#1C1610', outline: 'none',
              boxShadow: '0 2px 12px rgba(154,120,64,0.08)',
            }}
          />
          {search && (
            <button onClick={() => onSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(154,120,64,0.15)', cursor: 'pointer', fontSize: 11, color: '#9A7840' }}>✕</button>
          )}
        </div>
      </div>

      {/* Filtres catégorie — scroll horizontal */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTER_DEFS.map(f => {
          const n = f.id === 'all' ? totalVisible : (counts[f.id] ?? 0)
          const isActive = active === f.id
          return (
            <motion.button key={f.id} whileTap={{ scale: 0.93 }} onClick={() => onFilter(f.id)}
              style={{
                flexShrink: 0, height: 36, padding: '0 14px', borderRadius: 99, cursor: 'pointer',
                border: `1.5px solid ${isActive ? 'rgba(154,120,64,0.6)' : 'rgba(154,120,64,0.18)'}`,
                background: isActive ? 'linear-gradient(135deg,rgba(154,120,64,0.14),rgba(212,175,119,0.1))' : 'rgba(255,255,255,0.7)',
                color: isActive ? '#6B5030' : '#8A7A68',
                fontSize: 11, fontWeight: 800, fontFamily: 'Raleway,sans-serif',
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all .18s',
                boxShadow: isActive ? '0 2px 12px rgba(154,120,64,0.18)' : 'none',
              }}>
              <span style={{ fontSize: 14 }}>{f.emoji}</span>
              {f.label}
              {f.id !== 'all' && n > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99,
                  background: isActive ? 'rgba(154,120,64,0.25)' : 'rgba(154,120,64,0.1)',
                  color: '#9A7840',
                }}>{n}</span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Filtre prix */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {PRICE_RANGES.map(p => (
          <button key={p.id} onClick={() => onPrice(p.id)}
            style={{
              flexShrink: 0, height: 28, padding: '0 11px', borderRadius: 99, cursor: 'pointer',
              border: `1px solid ${priceRange === p.id ? 'rgba(154,120,64,0.5)' : 'rgba(154,120,64,0.15)'}`,
              background: priceRange === p.id ? 'rgba(212,175,119,0.18)' : 'transparent',
              color: priceRange === p.id ? '#6B5030' : '#9A8A78',
              fontSize: 10, fontWeight: 700, fontFamily: 'Raleway,sans-serif',
              transition: 'all .15s',
            }}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
