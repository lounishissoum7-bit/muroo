#!/bin/bash
# Fichier : scripts/copy-models.sh
# Copie les modèles 3D générés vers public/models/
# Exécuter depuis la racine du projet Next.js

echo "📦 MURO by L&Y — Copie des modèles 3D"
echo "═══════════════════════════════════════"

mkdir -p public/models

MODELS=(
  "tv-stand-120.glb"
  "tv-stand-180.glb"
  "tv-floating.glb"
  "bookcase.glb"
  "marble-panel.glb"
  "sofa.glb"
  "coffee-table.glb"
  "panel-3d.glb"
)

COPIED=0
for model in "${MODELS[@]}"; do
  if [ -f "models/$model" ]; then
    cp "models/$model" "public/models/$model"
    size=$(du -h "public/models/$model" | cut -f1)
    echo "  ✅ $model ($size)"
    ((COPIED++))
  else
    echo "  ⚠️  $model — non trouvé dans models/"
  fi
done

echo ""
echo "  $COPIED/${#MODELS[@]} modèles copiés dans public/models/"
echo ""
echo "📋 Prochaine étape : git add public/models/ && git commit -m 'feat: modèles 3D GLB'"
