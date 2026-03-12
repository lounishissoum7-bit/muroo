// Fichier : lib/products.ts
import type { Product } from './store'

// ═══════════════════════════════════════════════════════
// CATALOGUE PRODUITS MURO by L&Y — Oran, Algérie
// Prix en DZD (Dinars Algériens) · 2026
// ═══════════════════════════════════════════════════════
export const PRODUCTS: Product[] = [

  // ── MEUBLES TV ───────────────────────────────────────
  {
    id:          'tv-led-120',
    name:        'Meuble TV LED 120cm',
    nameAr:      'طاولة تلفزيون LED',
    category:    'tv',
    emoji:       '📺',
    priceDA:     45_000,
    priceUnit:   'unité',
    dimensions:  '120 × 50 × 45 cm',
    description: 'Meuble TV moderne avec éclairage LED intégré. Finition laque blanc mat ou chêne naturel. Fabrication locale Oran.',
    model3d:     '/models/tv-stand-120.glb',
    inStock:     true,
  },
  {
    id:          'tv-led-180',
    name:        'Meuble TV LED 180cm',
    nameAr:      'طاولة تلفزيون LED كبيرة',
    category:    'tv',
    emoji:       '🖥️',
    priceDA:     65_000,
    priceUnit:   'unité',
    dimensions:  '180 × 55 × 45 cm',
    description: 'Grand meuble TV avec colonnes latérales et niches de rangement. LED RGB inclus.',
    model3d:     '/models/tv-stand-180.glb',
    inStock:     true,
  },
  {
    id:          'tv-flottant',
    name:        'Meuble TV Flottant',
    nameAr:      'طاولة تلفزيون عائمة',
    category:    'tv',
    emoji:       '🔲',
    priceDA:     38_000,
    priceUnit:   'unité',
    dimensions:  '150 × 30 × 25 cm',
    description: 'Meuble TV suspendu au mur. Minimaliste, économise de la place. MDF hydrofuge.',
    model3d:     '/models/tv-floating.glb',
    inStock:     true,
  },
  {
    id:          'bibliotheque',
    name:        'Bibliothèque Modulable',
    nameAr:      'مكتبة معيارية',
    category:    'tv',
    emoji:       '📚',
    priceDA:     95_000,
    priceUnit:   'unité',
    dimensions:  '200 × 200 × 35 cm',
    description: 'Bibliothèque mur entier avec éclairage LED. Sur mesure disponible.',
    model3d:     '/models/bookcase.glb',
    inStock:     true,
  },

  // ── REVÊTEMENTS MURAUX ───────────────────────────────
  {
    id:          'faux-marbre-blanc',
    name:        'Faux Marbre Blanc Carrare',
    nameAr:      'رخام أبيض اصطناعي',
    category:    'murs',
    emoji:       '🪨',
    priceDA:     3_500,
    priceUnit:   'm²',
    dimensions:  'Panel 60 × 60 cm · ép. 3mm',
    description: 'Revêtement mural effet marbre blanc veinage gris. Résistant humidité. Idéal salle de bain, cuisine, salon.',
    model3d:     '/models/marble-panel.glb',
    inStock:     true,
  },
  {
    id:          'shiplap-chene',
    name:        'Shiplap Chêne Naturel',
    nameAr:      'ألواح خشبية بلوط طبيعي',
    category:    'murs',
    emoji:       '🪵',
    priceDA:     2_800,
    priceUnit:   'm²',
    dimensions:  'Lame 200 × 18 cm · ép. 12mm',
    description: 'Bardage mural horizontal effet bois chêne. Finition naturelle ou teinté. Pose clipsée.',
    model3d:     '/models/shiplap.glb',
    inStock:     true,
  },
  {
    id:          'ba13-placo',
    name:        'Cloison BA13 Placo',
    nameAr:      'جدار جبسي',
    category:    'murs',
    emoji:       '🏗️',
    priceDA:     1_200,
    priceUnit:   'm²',
    dimensions:  'Plaque 250 × 120 cm · ép. 13mm',
    description: 'Cloison sèche BA13 standard. Pose sur ossature métallique. Inclut joint et entoilage.',
    inStock:     true,
  },
  {
    id:          'panneau-3d-mdf',
    name:        'Panneau 3D MDF Géométrique',
    nameAr:      'لوح ثلاثي الأبعاد',
    category:    'murs',
    emoji:       '🎨',
    priceDA:     8_500,
    priceUnit:   'unité',
    dimensions:  '60 × 60 cm · ép. 18mm',
    description: 'Panneau mural 3D en MDF, motifs géométriques. Peindre selon votre couleur.',
    model3d:     '/models/panel-3d.glb',
    inStock:     true,
  },

  // ── ÉCLAIRAGE ────────────────────────────────────────
  {
    id:          'led-rgb-3m',
    name:        'Ruban LED RGB 3m',
    nameAr:      'شريط LED RGB',
    category:    'lumiere',
    emoji:       '💡',
    priceDA:     6_500,
    priceUnit:   'unité',
    dimensions:  '300 × 8 mm',
    description: 'Ruban LED RGB avec télécommande et app WiFi. 16 millions de couleurs. Adhesif double face.',
    inStock:     true,
  },
  {
    id:          'applique-laiton',
    name:        'Applique Murale Laiton',
    nameAr:      'مصباح جداري نحاسي',
    category:    'lumiere',
    emoji:       '🔆',
    priceDA:     18_000,
    priceUnit:   'unité',
    dimensions:  '20 × 35 cm',
    description: 'Applique murale style industriel, finition laiton brossé. Ampoule E27 incluse.',
    inStock:     true,
  },
  {
    id:          'spot-encastre',
    name:        'Spot Encastré LED',
    nameAr:      'مصباح LED مدمج',
    category:    'lumiere',
    emoji:       '🌟',
    priceDA:     4_200,
    priceUnit:   'unité',
    dimensions:  'Ø9 cm',
    description: 'Spot encastré LED 7W. Blanc chaud 3000K. Lot de 6 disponible.',
    inStock:     true,
  },

  // ── MOBILIER ─────────────────────────────────────────
  {
    id:          'table-basse',
    name:        'Table Basse Moderne',
    nameAr:      'طاولة قهوة عصرية',
    category:    'mobilier',
    emoji:       '🪑',
    priceDA:     35_000,
    priceUnit:   'unité',
    dimensions:  '120 × 60 × 45 cm',
    description: 'Table basse plateau verre trempé 10mm sur pieds métal noir mat. Design épuré.',
    model3d:     '/models/coffee-table.glb',
    inStock:     true,
  },
  {
    id:          'canape-3pl',
    name:        'Canapé 3 Places Velours',
    nameAr:      'أريكة 3 أشخاص مخمل',
    category:    'mobilier',
    emoji:       '🛋️',
    priceDA:     120_000,
    priceUnit:   'unité',
    dimensions:  '220 × 90 × 85 cm',
    description: 'Canapé 3 places tissu velours. Coloris beige, gris ou vert sauge. Livraison et montage inclus.',
    model3d:     '/models/sofa.glb',
    inStock:     true,
  },

  // ── SERVICES ─────────────────────────────────────────
  {
    id:          'pose-mur',
    name:        'Pose Revêtement Mural',
    nameAr:      'تركيب تغطية الجدران',
    category:    'services',
    emoji:       '🔧',
    priceDA:     800,
    priceUnit:   'm²',
    dimensions:  'Main d\'œuvre incluse',
    description: 'Pose de tout revêtement mural (marbre, shiplap, BA13, panneau 3D). Déplacement Oran inclus.',
    inStock:     true,
  },
  {
    id:          'pose-meuble',
    name:        'Installation Meuble TV',
    nameAr:      'تركيب طاولة التلفزيون',
    category:    'services',
    emoji:       '🪛',
    priceDA:     5_000,
    priceUnit:   'forfait',
    dimensions:  'Déplacement + montage',
    description: 'Montage et installation complète de votre meuble TV. Câbles dissimulés, fixation murale si besoin.',
    inStock:     true,
  },
]

// ── Utilitaires ───────────────────────────────────────────
export const getProductsByCategory = (cat: string) =>
  PRODUCTS.filter(p => p.category === cat)

export const getProductById = (id: string) =>
  PRODUCTS.find(p => p.id === id) ?? null

export const CATEGORIES = [
  { id: 'tv',       label: 'Meubles TV',  emoji: '📺' },
  { id: 'murs',     label: 'Revêtements', emoji: '🪨' },
  { id: 'lumiere',  label: 'Éclairage',   emoji: '💡' },
  { id: 'mobilier', label: 'Mobilier',    emoji: '🛋️' },
  { id: 'services', label: 'Services',    emoji: '🔧' },
] as const

export const formatPrice = (da: number) =>
  new Intl.NumberFormat('fr-DZ', { style: 'decimal' }).format(da) + ' DA'
