'use client'
// Fichier : components/HomeFooter.tsx
// Footer professionnel — coordonnées + WhatsApp + liens rapides

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

const LINKS = [
  { label: 'Accueil',       href: '/' },
  { label: 'Boutique',      href: '/boutique' },
  { label: 'Simulation 3D', href: '/simulation' },
  { label: 'Mon Devis',     href: '/devis' },
]

export default function HomeFooter() {
  const router = useRouter()

  return (
    <footer style={{ background: '#0D0B08', borderTop: '1px solid rgba(201,169,110,0.15)', padding: '48px 0', paddingBottom: 'max(48px,env(safe-area-inset-bottom,0px))' }}>
      <div style={{ padding: '0 22px', maxWidth: 480, margin: '0 auto' }}>

        {/* Logo + slogan */}
        <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid rgba(61,53,40,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(145deg,#9A7840,#C9A96E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 54 54" fill="none" width="28" height="28">
                <path d="M8 42L8 14L18 30L27 14L27 42" stroke="#0D0B08" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="34" y1="20" x2="48" y2="20" stroke="rgba(13,11,8,0.5)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="34" y1="27" x2="48" y2="27" stroke="rgba(13,11,8,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="34" y1="34" x2="48" y2="34" stroke="rgba(13,11,8,0.5)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 22, fontWeight: 700, color: '#C9A96E', lineHeight: 1 }}>MURO</div>
              <div style={{ fontFamily: 'Raleway,sans-serif', fontSize: 9, fontWeight: 700, color: '#7A6E60', letterSpacing: '3px', textTransform: 'uppercase' }}>by L & Y · Oran</div>
            </div>
          </div>
          <p style={{ fontFamily: 'Raleway,sans-serif', fontSize: 12, color: '#5A4E42', lineHeight: 1.65 }}>
            Décoration intérieure sur mesure à Oran. Faux marbre, shiplap, meubles TV, placo déco. Simulation 3D gratuite.
          </p>
        </div>

        {/* Coordonnées + WhatsApp */}
        <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid rgba(61,53,40,0.5)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#9A7840', fontFamily: 'Raleway,sans-serif', marginBottom: 14 }}>Contact</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <span style={{ fontFamily: 'Raleway,sans-serif', fontSize: 12, color: '#8A7860' }}>Oran, Algérie · Livraison dans toute la wilaya</span>
            </div>
            <a href="https://wa.me/213xxxxxxxxx" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '12px 16px', borderRadius: 14, background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div>
                <div style={{ fontFamily: 'Raleway,sans-serif', fontSize: 12, fontWeight: 800, color: '#25D366' }}>Nous contacter sur WhatsApp</div>
                <div style={{ fontFamily: 'Raleway,sans-serif', fontSize: 10, color: '#5A7050' }}>Réponse en moins de 2 heures</div>
              </div>
            </a>
            <a href="https://instagram.com/muro.lny" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '12px 16px', borderRadius: 14, background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.15)' }}>
              <span style={{ fontSize: 20 }}>📸</span>
              <div>
                <div style={{ fontFamily: 'Raleway,sans-serif', fontSize: 12, fontWeight: 800, color: '#C9A96E' }}>@muro.lny</div>
                <div style={{ fontFamily: 'Raleway,sans-serif', fontSize: 10, color: '#7A6E60' }}>Instagram · Nos réalisations</div>
              </div>
            </a>
          </div>
        </div>

        {/* Liens rapides */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#9A7840', fontFamily: 'Raleway,sans-serif', marginBottom: 12 }}>Navigation</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {LINKS.map(l => (
              <button key={l.href} onClick={() => router.push(l.href)}
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(61,53,40,0.6)', background: 'rgba(26,22,14,0.8)', cursor: 'pointer', color: '#8A7860', fontSize: 12, fontWeight: 600, fontFamily: 'Raleway,sans-serif', textAlign: 'left', transition: 'all 0.15s' }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div style={{ textAlign: 'center', paddingTop: 20, borderTop: '1px solid rgba(61,53,40,0.4)' }}>
          <div style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 14, color: '#5A4E42', marginBottom: 4 }}>
            MURO <em style={{ color: '#C9A96E' }}>by L&Y</em>
          </div>
          <div style={{ fontFamily: 'Raleway,sans-serif', fontSize: 10, color: '#3A3028', letterSpacing: '1.5px' }}>
            © 2026 · ORAN · ALGÉRIE · TOUS DROITS RÉSERVÉS
          </div>
        </div>
      </div>
    </footer>
  )
}
