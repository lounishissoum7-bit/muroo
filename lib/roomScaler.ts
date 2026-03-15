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

// ═══════════════════════════════════════════════════════════════════
// GÉOMÉTRIE INTELLIGENTE — Snap parallèles, correction angles
// ═══════════════════════════════════════════════════════════════════

export interface Vec2 { x: number; y: number }
export interface Corner { id: number; x: number; y: number; raw?: Vec2 }

/** Angle entre deux vecteurs en degrés (0–360) */
export function angleBetween(a: Vec2, b: Vec2): number {
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)
}

/** Force un angle au multiple de 90° le plus proche */
export function snapTo90(angleDeg: number): number {
  return Math.round(angleDeg / 90) * 90
}

/** Correction intelligente d'un coin pour forcer tous les angles à 90°
 *  Algorithme : on fixe les 2 premiers coins (côté longueur),
 *  puis on calcule les 2 suivants par rotation à 90° exacte.
 */
export function enforceRightAngles(corners: Corner[]): {
  corners: Corner[]
  longueur: number
  largeur:  number
  corrected: boolean
  angleCorrectionDeg: number
} {
  if (corners.length < 2) {
    return { corners, longueur: 0, largeur: 0, corrected: false, angleCorrectionDeg: 0 }
  }

  const [c0, c1] = corners

  // Vecteur du mur principal (C0 → C1)
  const dx = c1.x - c0.x
  const dy = c1.y - c0.y
  const longueur = Math.sqrt(dx * dx + dy * dy)

  // Angle brut du mur principal
  const rawAngle = Math.atan2(dy, dx)

  // Snap : force l'angle au multiple de 45° le plus proche pour avoir des murs propres
  // (mais on prioritise 0°, 90°, 180°, 270° pour les rectangles)
  const snapAngleDeg = snapTo90(rawAngle * 180 / Math.PI)
  const snapAngleRad = snapAngleDeg * Math.PI / 180
  const correctionDeg = Math.abs(rawAngle * 180 / Math.PI - snapAngleDeg)

  // Longueur réelle entre C0 et C1
  // Largeur par défaut = longueur × ratio standard chambre (√2/2 ≈ 0.7)
  let largeur = corners.length >= 3
    ? (() => {
        // Calculer la distance projetée perpendiculaire
        const c2 = corners[2]
        const perpX = -(Math.sin(snapAngleRad))
        const perpY = Math.cos(snapAngleRad)
        const v2x = c2.x - c0.x
        const v2y = c2.y - c0.y
        return Math.abs(v2x * perpX + v2y * perpY)
      })()
    : longueur * 0.7   // défaut ratio 4:3

  if (largeur < 0.5) largeur = longueur * 0.65

  // Reconstruction des 4 coins parfaitement rectangulaires
  const cosA = Math.cos(snapAngleRad)
  const sinA = Math.sin(snapAngleRad)
  const perpCosA = -sinA  // perpendiculaire = rotation +90°
  const perpSinA =  cosA

  const snapped: Corner[] = [
    { id: 0, x: c0.x,                                   y: c0.y },
    { id: 1, x: c0.x + longueur * cosA,                 y: c0.y + longueur * sinA },
    { id: 2, x: c0.x + longueur * cosA + largeur * perpCosA, y: c0.y + longueur * sinA + largeur * perpSinA },
    { id: 3, x: c0.x + largeur * perpCosA,              y: c0.y + largeur * perpSinA },
  ]

  return {
    corners:            snapped,
    longueur:           +longueur.toFixed(3),
    largeur:            +largeur.toFixed(3),
    corrected:          correctionDeg > 1.5,
    angleCorrectionDeg: +correctionDeg.toFixed(1),
  }
}

/** Estime la hauteur depuis l'inclinaison du téléphone (beta gyroscope)
 *  beta ≈ 0° = téléphone à plat | beta ≈ 90° = téléphone vertical
 *  Hypothèse : on vise le bas du mur (beta faible) → haut (beta élevé)
 *  Retourne une hauteur estimée en mètres.
 */
export function estimateHeightFromTilt(
  betaLow: number,   // angle téléphone quand on vise le bas (degrés)
  betaHigh: number,  // angle quand on vise le haut
  distanceM: number  // distance estimée au mur (m) — défaut 2m
): number {
  const dBeta = Math.abs(betaHigh - betaLow) * Math.PI / 180
  const h = distanceM * Math.tan(dBeta)
  // Clamp : une pièce algérienne fait 2.4–3.5m de haut
  return Math.max(2.2, Math.min(3.8, +h.toFixed(2)))
}

/** Convertit des pixels écran → mètres réels via un ratio de référence.
 *  ratio : nb de pixels pour 1 mètre (calibré depuis la diagonale écran + distance caméra)
 */
export function pxToMeters(px: number, pxPerMeter: number): number {
  return +(px / pxPerMeter).toFixed(3)
}

/** Formate une mesure en m avec affichage cm si < 1m */
export function formatMeasure(meters: number): string {
  if (meters < 1) return `${Math.round(meters * 100)} cm`
  return `${meters.toFixed(2)} m`
}

// Alias for backward compatibility
export type RoomData = RoomDimensions
