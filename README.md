# 🏠 MURO by L&Y — Décoration Intérieure AR

> **Next.js 15 · Three.js · WebXR · PWA · Vercel**  
> La meilleure app de décoration intérieure en Algérie · Oran

---

## 🚀 Déploiement en 5 minutes (GitHub + Vercel)

### Étape 1 — Créer le repo GitHub

1. Allez sur [github.com](https://github.com) → **New repository**
2. Nom : `muro-app` · Visibility : **Public**
3. ✅ Add README · Cliquez **Create repository**

### Étape 2 — Uploader les fichiers

**Option A — GitHub Desktop (recommandé) :**
1. Téléchargez [GitHub Desktop](https://desktop.github.com)
2. Clone votre repo → copiez tous les fichiers MURO dedans
3. Commit → Push

**Option B — Via l'interface web GitHub :**
1. Dans votre repo → **Add file** → **Upload files**
2. Glissez-déposez le dossier entier
3. **Commit changes**

> ⚠️ **Important** : le fichier principal doit être à la racine, pas dans un sous-dossier !

### Étape 3 — Connecter Vercel

1. Allez sur [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. **Add New Project** → sélectionnez `muro-app`
3. Framework preset : **Next.js** (détecté automatiquement)
4. Cliquez **Deploy** → attendez ~60 secondes

### Étape 4 — Votre URL HTTPS est prête !

```
https://muro-app-votrepseudo.vercel.app
```

✅ HTTPS automatique = WebXR + caméra AR activés  
✅ Déploiement automatique à chaque push GitHub  
✅ PWA installable sur l'écran d'accueil Android

---

## 📱 Installer comme app native (PWA)

1. Ouvrez l'URL sur Chrome Android
2. Menu ⋮ → **Ajouter à l'écran d'accueil**
3. Nommez : **MURO by L&Y**
4. L'app apparaît sur votre écran comme une vraie app !

---

## 🏗️ Structure du projet

```
muro-app/
├── app/
│   ├── layout.tsx          # Layout global + PWA metadata
│   ├── page.tsx            # Home — Splash MURO branding
│   ├── globals.css         # Thème luxe or/beige
│   ├── simulation/
│   │   └── page.tsx        # ① Simulation AR — caméra + mesure + placement
│   ├── boutique/
│   │   └── page.tsx        # ② Catalogue produits avec filtres
│   └── devis/
│       └── page.tsx        # ③ Devis live + WhatsApp + PDF
├── components/
│   ├── Simulation3D.tsx    # Three.js + WebXR + produits 3D
│   ├── ProductCard.tsx     # Card produit avec modal détail
│   └── DevisPDF.tsx        # Générateur PDF jsPDF + WhatsApp
├── lib/
│   ├── store.ts            # Zustand — mesures, panier, AR state
│   ├── products.ts         # Catalogue JSON — 15 produits MURO
│   └── calculateDevis.ts   # Hook calcul devis live + TVA 19%
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service Worker offline
│   └── models/             # Fichiers .glb Three.js
├── next.config.ts          # WebXR headers + .glb support
├── tailwind.config.ts      # Thème MURO or/beige/luxe
└── tsconfig.json
```

---

## 🛠️ Développement local

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev
# → http://localhost:3000

# Build production
npm run build
npm start
```

> **Note** : La caméra AR nécessite HTTPS. En local, utilisez `localhost` (Chrome accepte la caméra sur localhost).

---

## 📦 Stack technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 15.2 | App Router + RSC |
| React | 19 | UI |
| Three.js | 0.171 | Rendu 3D |
| @react-three/fiber | 8.17 | React + Three.js |
| @react-three/drei | 9.118 | Helpers 3D |
| @react-three/xr | 6.6 | WebXR AR |
| Zustand | 5 | State global |
| Framer Motion | 12 | Animations |
| jsPDF | 2.5 | Export PDF |
| Tailwind CSS | 3.4 | Styling |

---

## 🌍 Marché cible

**Oran, Algérie → Expansion nationale**

- Zone P1 : Haï Es-Sabah, Bir El Djir
- Zone P2 : USTO, Akid Lotfi  
- Zone Premium : El Kerma, Belgaïd

**Paiements** : COD · CIB · Edahabia · BaridiMob

---

## 📞 Contact MURO by L&Y

WhatsApp : +213 X XX XX XX XX  
Email : contact@muro-lny.dz  
Instagram : @muro.oran

---

*Fait avec ❤️ à Oran · Déployé sur Vercel · Propulsé par Next.js 15*
