// Fichier : lib/store.ts
import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export type MeasureUnit = 'm' | 'cm' | 'mm' | 'ft' | 'in'

export type MeasureType = 'wall' | 'door' | 'window' | 'height'

export interface Measurement {
  id:         string
  type:       MeasureType
  valueM:     number     // toujours stocké en mètres
  label:      string
  roomId:     string
  createdAt:  number
}

export interface Room {
  id:          string
  name:        string
  icon:        string
  ceilingH:    number   // hauteur plafond en mètres
  measurements: Measurement[]
  createdAt:   number
}

export type ProductCategory = 'tv' | 'tv-simple' | 'tv-deco' | 'murs' | 'lumiere' | 'mobilier' | 'services' | 'porte-wpc' | 'faux-shiplap'

export interface Product {
  id:          string
  name:        string
  nameAr:      string
  category:    ProductCategory
  emoji:       string
  priceDA:     number
  priceUnit:   'unité' | 'm²' | 'ml' | 'forfait'
  dimensions:  string
  description: string
  model3d?:    string    // chemin /public/models/xxx.glb
  image?:      string
  inStock:     boolean
}

export interface CartItem {
  product:   Product
  quantity:  number
  surface?:  number    // si vendu au m², surface calculée
  totalDA:   number
}

export interface PlacedObject {
  id:        string
  productId: string
  x:         number    // position relative (0-1)
  y:         number
  scaleX:    number
  scaleY:    number
  rotation:  number
  roomId:    string
}

// ═══════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════
interface MuroStore {
  // ── Mesures ────────────────────────────────────────
  rooms:       Room[]
  activeRoomId: string | null
  unit:        MeasureUnit

  addRoom:       (room: Omit<Room, 'id' | 'createdAt' | 'measurements'>) => void
  removeRoom:    (id: string) => void
  setActiveRoom: (id: string) => void
  addMeasurement:(m: Omit<Measurement, 'id' | 'createdAt'>) => void
  removeMeasurement: (roomId: string, measId: string) => void
  setUnit:       (u: MeasureUnit) => void

  // ── Panier ─────────────────────────────────────────
  cart:        CartItem[]
  addToCart:   (product: Product, qty?: number, surface?: number) => void
  removeFromCart: (productId: string) => void
  updateQty:   (productId: string, qty: number) => void
  clearCart:   () => void

  // ── Simulation AR ──────────────────────────────────
  placedObjects: PlacedObject[]
  placeObject:   (o: Omit<PlacedObject, 'id'>) => void
  removeObject:  (id: string) => void
  clearObjects:  () => void
  selectedProduct: Product | null
  setSelectedProduct: (p: Product | null) => void

  // ── Mesures intelligentes ────────────────────────────
  lastRoom:       { longueur: number; largeur: number; hauteur: number; name: string; icon: string } | null
  setLastRoom:    (r: { longueur: number; largeur: number; hauteur: number; name: string; icon: string }) => void

  // ── Deep-link Boutique → Simulation ────────────────
  pendingProductId: string | null
  setPendingProductId: (id: string | null) => void

  // ── Deep-link Accueil → Boutique (filtre) ────────────
  pendingCategoryFilter: string | null
  setPendingCategoryFilter: (cat: string | null) => void

  // ── Infos client (pour le devis PDF) ──────────────
  clientInfo: { name: string; phone: string; address: string }
  setClientInfo: (info: Partial<{ name: string; phone: string; address: string }>) => void

  // ── UI ─────────────────────────────────────────────
  isARMode:    boolean
  setARMode:   (v: boolean) => void
}

const nanoid = () => Math.random().toString(36).slice(2, 10)

export const useMuroStore = create<MuroStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Mesures ──────────────────────────────────
        rooms:        [],
        activeRoomId: null,
        unit:         'm',

        addRoom: (room) => {
          const newRoom: Room = {
            ...room,
            id:           nanoid(),
            measurements: [],
            createdAt:    Date.now(),
          }
          set(s => ({
            rooms:        [...s.rooms, newRoom],
            activeRoomId: newRoom.id,
          }))
        },

        removeRoom: (id) => set(s => ({
          rooms:        s.rooms.filter(r => r.id !== id),
          activeRoomId: s.activeRoomId === id
            ? (s.rooms.find(r => r.id !== id)?.id ?? null)
            : s.activeRoomId,
        })),

        setActiveRoom: (id) => set({ activeRoomId: id }),

        addMeasurement: (m) => set(s => ({
          rooms: s.rooms.map(r =>
            r.id === m.roomId
              ? {
                  ...r,
                  measurements: [...r.measurements, {
                    ...m,
                    id:        nanoid(),
                    createdAt: Date.now(),
                  }],
                }
              : r
          ),
        })),

        removeMeasurement: (roomId, measId) => set(s => ({
          rooms: s.rooms.map(r =>
            r.id === roomId
              ? { ...r, measurements: r.measurements.filter(m => m.id !== measId) }
              : r
          ),
        })),

        setUnit: (u) => set({ unit: u }),

        // ── Panier ────────────────────────────────────
        cart: [],

        addToCart: (product, qty = 1, surface) => set(s => {
          const existing = s.cart.find(i => i.product.id === product.id)
          const totalDA  = product.priceUnit === 'm²' && surface
            ? product.priceDA * surface * qty
            : product.priceDA * qty

          if (existing) {
            return {
              cart: s.cart.map(i =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + qty, totalDA: i.totalDA + totalDA }
                  : i
              ),
            }
          }
          return {
            cart: [...s.cart, { product, quantity: qty, surface, totalDA }],
          }
        }),

        removeFromCart: (productId) => set(s => ({
          cart: s.cart.filter(i => i.product.id !== productId),
        })),

        updateQty: (productId, qty) => set(s => ({
          cart: s.cart.map(i =>
            i.product.id === productId
              ? { ...i, quantity: qty, totalDA: i.product.priceDA * qty }
              : i
          ).filter(i => i.quantity > 0),
        })),

        clearCart: () => set({ cart: [] }),

        // ── Simulation ────────────────────────────────
        placedObjects:    [],
        selectedProduct:  null,

        placeObject: (o) => set(s => ({
          placedObjects: [...s.placedObjects, { ...o, id: nanoid() }],
        })),

        removeObject: (id) => set(s => ({
          placedObjects: s.placedObjects.filter(o => o.id !== id),
        })),

        clearObjects: () => set({ placedObjects: [] }),

        setSelectedProduct: (p) => set({ selectedProduct: p }),

        // ── Mesures intelligentes ─────────────────────────
        lastRoom: null,
        setLastRoom: (r) => set({ lastRoom: r }),

        // ── Deep-link ─────────────────────────────────
        pendingProductId:    null,
        setPendingProductId: (id) => set({ pendingProductId: id }),

        pendingCategoryFilter: null,
        setPendingCategoryFilter: (cat) => set({ pendingCategoryFilter: cat }),

        // ── Infos client ──────────────────────────────
        clientInfo: { name: '', phone: '', address: 'Oran, Algérie' },
        setClientInfo: (info) => set(s => ({ clientInfo: { ...s.clientInfo, ...info } })),

        // ── UI ────────────────────────────────────────
        isARMode: false,
        setARMode: (v) => set({ isARMode: v }),
      }),
      {
        name:    'muro-lny-store',
        partialize: (state) => ({
          rooms:        state.rooms,
          activeRoomId: state.activeRoomId,
          unit:         state.unit,
          cart:         state.cart,
          clientInfo:   state.clientInfo,
        }),
      }
    )
  )
)

// ── Sélecteurs pratiques ──────────────────────────────────
export const useActiveRoom = () => {
  const { rooms, activeRoomId } = useMuroStore()
  return rooms.find(r => r.id === activeRoomId) ?? null
}

export const useCartTotal = () => {
  const cart = useMuroStore(s => s.cart)
  const subtotal = cart.reduce((sum, i) => sum + i.totalDA, 0)
  const tva      = subtotal * 0.19
  return { subtotal, tva, total: subtotal + tva, count: cart.length }
}

// ── Convertisseur d'unités ─────────────────────────────────
export const convertUnit = (meters: number, unit: MeasureUnit): number => {
  const conv: Record<MeasureUnit, number> = {
    m: 1, cm: 100, mm: 1000, ft: 3.28084, in: 39.3701,
  }
  return meters * conv[unit]
}

export const formatUnit = (meters: number, unit: MeasureUnit): string => {
  const v = convertUnit(meters, unit)
  const precision: Record<MeasureUnit, number> = {
    m: 2, cm: 0, mm: 0, ft: 2, in: 1,
  }
  return `${v.toFixed(precision[unit])} ${unit}`
}
