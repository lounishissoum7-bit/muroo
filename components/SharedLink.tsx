'use client'
// Fichier : components/SharedLink.tsx
// Utilitaires de navigation centralisés — utiliser dans toute l'appli

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { useMuroStore } from '@/lib/store'
import type { FilterId } from '@/components/Filters'

/**
 * Hook central pour toutes les navigations inter-pages de MURO.
 * Gère automatiquement le state Zustand + URL params.
 */
export function useMuroNav() {
  const router = useRouter()
  const { setPendingProductId, setPendingCategoryFilter } = useMuroStore(s => ({
    setPendingProductId:      s.setPendingProductId,
    setPendingCategoryFilter: s.setPendingCategoryFilter,
  }))

  /** Aller à la simulation, optionnellement avec un produit pré-sélectionné */
  const goSimulation = useCallback((productId?: string) => {
    if (productId) {
      setPendingProductId(productId)
      router.push(`/simulation?product=${productId}`)
    } else {
      router.push('/simulation')
    }
  }, [router, setPendingProductId])

  /** Aller à la boutique, optionnellement avec un filtre catégorie actif */
  const goBoutique = useCallback((categoryFilter?: FilterId | string, productId?: string) => {
    const params = new URLSearchParams()
    if (categoryFilter && categoryFilter !== 'all') {
      params.set('filtre', categoryFilter)
      setPendingCategoryFilter(categoryFilter)
    }
    if (productId) {
      params.set('product', productId)
    }
    const qs = params.toString()
    router.push(qs ? `/boutique?${qs}` : '/boutique')
  }, [router, setPendingCategoryFilter])

  /** Retour à l'accueil */
  const goHome = useCallback(() => router.push('/'), [router])

  /** Aller au devis */
  const goDevis = useCallback(() => router.push('/devis'), [router])

  return { goSimulation, goBoutique, goHome, goDevis }
}

// ── CONSTANTES de navigation — point unique de vérité ─────────────
export const NAV_ROUTES = {
  home:       '/',
  boutique:   '/boutique',
  simulation: '/simulation',
  devis:      '/devis',
} as const

// ── MAP service → filtre boutique ─────────────────────────────────
export const SERVICE_TO_FILTER: Record<string, FilterId> = {
  'marbre':  'murs',
  'shiplap': 'murs',
  'tv':      'tv-simple',
  'placo':   'tv-deco',
  'lumiere': 'lumiere',
  'mobilier':'mobilier',
} as const
