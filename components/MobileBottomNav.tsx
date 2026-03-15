'use client'
// Fichier : components/MobileBottomNav.tsx
// Bottom navigation native-feel — 4 onglets luxe dorés

import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartTotal } from '@/lib/store'

const TABS = [
  { id: 'home',       href: '/',            icon: HomeIcon,  label: 'Accueil'    },
  { id: 'boutique',   href: '/boutique',    icon: ShopIcon,  label: 'Boutique'   },
  { id: 'simulation', href: '/simulation',  icon: SimIcon,   label: 'Simuler'    },
  { id: 'devis',      href: '/devis',       icon: DevisIcon, label: 'Devis'      },
] as const

// ── Icônes SVG ────────────────────────────────────────────────────
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5V21H15V15H9V21H3V9.5Z"
        fill={active ? '#C9A96E' : 'none'}
        stroke={active ? '#C9A96E' : '#7A6E60'}
        strokeWidth={active ? 0 : 1.8}
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ShopIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z"
        fill={active ? 'rgba(201,169,110,0.18)' : 'none'}
        stroke={active ? '#C9A96E' : '#7A6E60'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 6H21" stroke={active ? '#C9A96E' : '#7A6E60'} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M16 10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10"
        stroke={active ? '#C9A96E' : '#7A6E60'} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function SimIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {/* Caméra */}
      <rect x="2" y="7" width="20" height="14" rx="3"
        fill={active ? 'rgba(201,169,110,0.18)' : 'none'}
        stroke={active ? '#C9A96E' : '#7A6E60'} strokeWidth="1.8"/>
      <circle cx="12" cy="14" r="3.5"
        fill={active ? '#C9A96E' : 'none'}
        stroke={active ? '#C9A96E' : '#7A6E60'} strokeWidth="1.8"/>
      <path d="M8 7V5C8 4.4 8.4 4 9 4H15C15.6 4 16 4.4 16 5V7"
        stroke={active ? '#C9A96E' : '#7A6E60'} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function DevisIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
        fill={active ? 'rgba(201,169,110,0.18)' : 'none'}
        stroke={active ? '#C9A96E' : '#7A6E60'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2V8H20" stroke={active ? '#C9A96E' : '#7A6E60'} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="13" x2="16" y2="13" stroke={active ? '#C9A96E' : '#7A6E60'} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="17" x2="13" y2="17" stroke={active ? '#C9A96E' : '#7A6E60'} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function MobileBottomNav() {
  const router   = useRouter()
  const pathname = usePathname()
  const { count }= useCartTotal()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="bottom-nav">
      <div style={{
        display: 'flex', alignItems: 'center', height: 'var(--nav-h)',
        padding: '0 4px',
      }}>
        {TABS.map(tab => {
          const active = isActive(tab.href)
          const Icon   = tab.icon
          const isSim  = tab.id === 'simulation'
          const isCart = tab.id === 'devis'

          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3,
                minHeight: 'var(--touch)',
                border: 'none', background: 'transparent',
                cursor: 'pointer', position: 'relative',
                padding: '6px 4px',
                WebkitTapHighlightColor: 'transparent',
                transition: 'opacity 0.15s',
              }}
            >
              {/* Indicateur actif — pill dorée derrière l'icône */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                    style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -58%)',
                      width: 42, height: 42,
                      borderRadius: 14,
                      background: 'rgba(201,169,110,0.14)',
                      border: '1px solid rgba(201,169,110,0.2)',
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Bouton central simulation — surélevé */}
              {isSim ? (
                <div style={{
                  width: 46, height: 46, borderRadius: 16,
                  background: active
                    ? 'linear-gradient(135deg,#9A7840,#C9A96E)'
                    : 'rgba(26,22,14,0.95)',
                  border: `1.5px solid ${active ? '#C9A96E' : 'rgba(61,53,40,0.8)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? '0 4px 16px rgba(201,169,110,0.35)' : '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.25s',
                  marginTop: -6,
                  position: 'relative', zIndex: 1,
                }}>
                  <Icon active={active} />
                </div>
              ) : (
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <Icon active={active} />
                  {/* Badge panier */}
                  {isCart && count > 0 && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{
                        position: 'absolute', top: -5, right: -7,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#C9A96E', border: '1.5px solid #0D0B08',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, color: '#0D0B08',
                        fontFamily: 'Raleway,sans-serif',
                      }}>
                      {count > 9 ? '9+' : count}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Label */}
              <span style={{
                fontSize: 9, fontWeight: active ? 800 : 600,
                color: active ? '#C9A96E' : '#5A4E42',
                fontFamily: 'Raleway,sans-serif',
                letterSpacing: '0.3px',
                lineHeight: 1,
                transition: 'color 0.2s',
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
