// Fichier : lib/roomScaler.ts
// Utilitaires de mise à l'échelle — 1 unité Three.js = 1 mètre
export interface RoomDimensions {
  longueur: number   // axe X (m)
  largeur:  number   // axe Z (m)
  hauteur:  number   // axe Y (m)
}

export interface RoomStats {
  surfaceSol:   number   // m²
  surfaceMurs:  number   // m² (4 murs, sans ouvertures)
  perimetre:    number   // m linéaire
  volume:       number   // m³
  surfacePlafond: number // m²
}

export function calcStats(d: RoomDimensions): RoomStats {
  const { longueur: L, largeur: la, hauteur: H } = d
  return {
    surfaceSol:    +(L * la).toFixed(2),
    surfaceMurs:   +(2 * (L + la) * H).toFixed(2),
    perimetre:     +(2 * (L + la)).toFixed(2),
    volume:        +(L * la * H).toFixed(2),
    surfacePlafond: +(L * la).toFixed(2),
  }
}

// Dimensions physiques d'un produit → Three.js units
export function productDims(dimensions: string): { w: number; h: number; d: number } {
  const nums = dimensions.match(/(\d+(?:[.,]\d+)?)/g)?.map(n => parseFloat(n.replace(',', '.'))) ?? [80, 50, 40]
  const [a = 80, b = 50, c = 40] = nums
  // Détection unité : si valeurs > 15 → cm, sinon m
  const factor = (a > 15 || b > 15 || c > 15) ? 0.01 : 1
  return { w: +(a * factor).toFixed(3), h: +(b * factor).toFixed(3), d: +(c * factor).toFixed(3) }
}

// Projeter position normalisée (−1..1) → coordonnée world sur un mur
export function wallPosToWorld(
  norm: { x: number; y: number },
  wall: 'front' | 'back' | 'left' | 'right',
  room: RoomDimensions,
  objW: number,
  objH: number
): [number, number, number] {
  const { longueur: L, largeur: la, hauteur: H } = room
  const halfW = L / 2
  const halfD = la / 2
  const clampX = (v: number, span: number, obj: number) =>
    Math.max(-(span / 2 - obj / 2), Math.min(span / 2 - obj / 2, v * (span / 2 - obj / 2)))
  const clampY = (v: number) =>
    Math.max(objH / 2, Math.min(H - objH / 2, (v + 1) / 2 * H))

  switch (wall) {
    case 'front': return [clampX(norm.x, L, objW), clampY(norm.y), -halfD + 0.03]
    case 'back':  return [clampX(norm.x, L, objW), clampY(norm.y),  halfD - 0.03]
    case 'left':  return [-halfW + 0.03, clampY(norm.y), clampX(norm.x, la, objW)]
    case 'right': return [ halfW - 0.03, clampY(norm.y), clampX(norm.x, la, objW)]
  }
}

export const WALL_ROTATION: Record<string, [number, number, number]> = {
  front: [0, 0, 0],
  back:  [0, Math.PI, 0],
  left:  [0,  Math.PI / 2, 0],
  right: [0, -Math.PI / 2, 0],
}

// Couleurs par catégorie produit
export const CAT_COLOR: Record<string, string> = {
  'tv-simple': '#C9A96E',
  'tv-deco':   '#A78BFA',
  'tv':        '#C9A96E',
  'murs':      '#40C4FF',
  'lumiere':   '#FFD740',
  'mobilier':  '#00E676',
  'services':  '#FF6B6B',
}
