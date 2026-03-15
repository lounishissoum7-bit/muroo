'use client'
import React from 'react'
// Fichier : components/ServicesGrid.tsx
// 3 services — liens dynamiques vers boutique avec filtre + simulation

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useMuroStore } from '@/lib/store'

// Mapping service → FilterId exact de Filters.tsx
const SERVICES = [
  {
    id:        'marbre',
    icon:      '🪨',
    title:     'Faux Marbre Italien',
    sub:       'Revêtements muraux',
    desc:      'Panneaux marbre Carrare, travertin, emperador. Résistant à l\'humidité, idéal pour salons et salles de bain.',
    img:       '/images/tv/meuble-tv-marbre-bibliotheque.webp',
    price:     'Dès 3 500 DA/m²',
    tags:      ['Salon', 'SDB', 'Cuisine'],
    color:     '#C9A96E',
    productId: 'faux-marbre-blanc',
    filterId:  'murs',          // → /boutique?filtre=murs
    filterLabel: 'Revêtements',
  },
  {
    id:        'shiplap',
    icon:      '🪵',
    title:     'Shiplap & Revêtements',
    sub:       'Bardage bois naturel',
    desc:      'Lames chêne vieilli, pin naturel ou teinté. Effet cabane luxe pour chambre, salon et couloir.',
    img:       '/images/tv/meuble-tv-mural-anthracite-shiplap.jpg',
    price:     'Dès 2 800 DA/m²',
    tags:      ['Chambre', 'Salon', 'Bureau'],
    color:     '#A07850',
    productId: 'shiplap-chene',
    filterId:  'murs',
    filterLabel: 'Revêtements',
  },
  {
    id:        'tv',
    icon:      '📺',
    title:     'Meubles TV + BA13',
    sub:       'Sur mesure, pose incluse',
    desc:      'Composition TV complète : meuble flottant, niches LED, placo déco. Clé en main, fabriqué à Oran.',
    img:       '/images/tv/meuble-tv-moderne-bois-noir.jpg',
    price:     'Dès 45 000 DA',
    tags:      ['Salon', 'Chambre', 'Sur mesure'],
    color:     '#8A9AAE',
    productId: 'tv-simple-bois-noir',
    filterId:  'tv-simple',
    filterLabel: 'Meubles TV',
  },
] as const

function ServiceCard({ s, index }: { s: typeof SERVICES[number]; index: number }) {
  const router = useRouter()
  const { setPendingProductId, setPendingCategoryFilter } = useMuroStore(st => ({
    setPendingProductId:      st.setPendingProductId,
    setPendingCategoryFilter: st.setPendingCategoryFilter,
  }))
  const [hovered, setHovered] = useState(false)
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  // Navigue vers la boutique avec le filtre pré-activé
  const goToBoutique = () => {
    setPendingCategoryFilter(s.filterId)
    router.push(`/boutique?filtre=${s.filterId}`)
  }

  // Navigue vers la simulation avec le produit pré-sélectionné
  const goToSim = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPendingProductId(s.productId)
    router.push(`/simulation?product=${s.productId}`)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.7, ease: [0.34, 1, 0.64, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={goToBoutique}
      style={{
        borderRadius: 22, overflow: 'hidden', cursor: 'pointer',
        background: '#0D0B08',
        border: `1px solid ${hovered ? 'rgba(201,169,110,0.45)' : 'rgba(61,53,40,0.5)'}`,
        boxShadow: hovered
          ? `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px ${s.color}30`
          : '0 4px 24px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        transition: 'all 0.35s cubic-bezier(0.34,1,0.64,1)',
        willChange: 'transform',
      }}>

      {/* Image */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <img src={s.img} alt={s.title} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.6s ease' }}/>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 40%, rgba(13,11,8,0.85) 100%)` }}/>

        {/* Badge prix */}
        <div style={{ position: 'absolute', top: 12, right: 12, padding: '5px 12px', borderRadius: 99,
          background: 'rgba(13,11,8,0.85)', backdropFilter: 'blur(10px)',
          border: `1px solid ${s.color}40`, fontSize: 11, fontWeight: 800, color: s.color,
          fontFamily: 'Raleway,sans-serif' }}>
          {s.price}
        </div>

        {/* Icon */}
        <div style={{ position: 'absolute', bottom: 12, left: 14, fontSize: 28 }}>{s.icon}</div>

        {/* Badge filtre au hover */}
        {hovered && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 20,
              background: `${s.color}18`, border: `1px solid ${s.color}40`,
              fontSize: 9, fontWeight: 800, color: s.color, fontFamily: 'Raleway,sans-serif',
              letterSpacing: '1px', textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>
            Voir {s.filterLabel} →
          </motion.div>
        )}
      </div>

      {/* Contenu */}
      <div style={{ padding: '18px 18px 20px' }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase',
          color: s.color, fontFamily: 'Raleway,sans-serif', marginBottom: 6 }}>{s.sub}</div>
        <h3 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 22, fontWeight: 700,
          color: '#FAF6EE', lineHeight: 1.1, marginBottom: 10 }}>{s.title}</h3>
        <p style={{ fontFamily: 'Raleway,sans-serif', fontSize: 12, color: '#8A7860',
          lineHeight: 1.65, marginBottom: 16 }}>{s.desc}</p>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {s.tags.map((t: string) => (
            <span key={t} style={{ padding: '3px 10px', borderRadius: 99,
              background: `${s.color}12`, border: `1px solid ${s.color}25`,
              fontSize: 10, fontWeight: 700, color: s.color, fontFamily: 'Raleway,sans-serif' }}>{t}</span>
          ))}
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={goToBoutique}
            style={{ flex: 1, height: 44, borderRadius: 12,
              border: `1.5px solid ${s.color}45`, background: `${s.color}10`,
              cursor: 'pointer', color: s.color, fontSize: 12, fontWeight: 800,
              fontFamily: 'Raleway,sans-serif', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
            <span style={{ fontSize: 14 }}>🛍️</span>
            Voir les produits
          </button>
          <button onClick={goToSim}
            style={{ width: 44, height: 44, borderRadius: 12,
              border: '1px solid rgba(61,53,40,0.8)', background: 'rgba(30,26,20,0.9)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0, transition: 'all 0.2s' }}
            title="Essayer en simulation 3D">
            📐
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function ServicesGrid() {
  const ref    = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} style={{ background: '#0D0B08', padding: '72px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '30%', right: -80, width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(201,169,110,0.06) 0%,transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{ padding: '0 22px', maxWidth: 480, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ height: 1, width: 32, background: '#C9A96E' }}/>
            <span style={{ fontFamily: 'Raleway,sans-serif', fontSize: 10, fontWeight: 800,
              letterSpacing: '3px', textTransform: 'uppercase', color: '#9A7840' }}>Nos Métiers</span>
          </div>
          <h2 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 'clamp(30px,7vw,40px)',
            fontWeight: 700, color: '#FAF6EE', lineHeight: 1.1 }}>
            Des services<br/>
            <em style={{ color: '#C9A96E', fontStyle: 'italic' }}>d\'exception</em>
          </h2>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {SERVICES.map((s, i) => (
            <React.Fragment key={s.id}>
              <ServiceCard s={s} index={i} />
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
