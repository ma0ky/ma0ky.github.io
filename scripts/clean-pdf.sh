#!/usr/bin/env bash
# Nettoie un PDF avant publication : supprime les métadonnées et signale les secrets probables.
# Usage : ./scripts/clean-pdf.sh _a-nettoyer/brut.pdf files/reports/propre.pdf
# Prérequis : exiftool et qpdf (poppler-utils pour la détection de secrets, optionnel).
set -euo pipefail

[ $# -eq 2 ] || { echo "Usage : $0 entree.pdf sortie.pdf"; exit 1; }
in="$1"; out="$2"
for bin in exiftool qpdf; do
  command -v "$bin" >/dev/null || { echo "Il manque : $bin"; exit 1; }
done

tmp="$(mktemp --suffix=.pdf)"; trap 'rm -f "$tmp"' EXIT
cp "$in" "$tmp"
exiftool -all= -overwrite_original "$tmp" >/dev/null
# La réécriture par qpdf est indispensable : exiftool seul laisse les anciennes métadonnées récupérables.
qpdf --linearize --object-streams=generate "$tmp" "$out"
echo "Métadonnées supprimées -> $out"

if command -v pdftotext >/dev/null; then
  hits="$(pdftotext "$out" - | grep -n -i -E 'password|mot de passe|mdp|pwd|passwd|secret|token|192\.168\.|(^|[^0-9])10\.[0-9]+\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[01])\.' || true)"
  if [ -n "$hits" ]; then
    echo
    echo "ATTENTION : lignes à vérifier avant de publier (détection grossière, pas une garantie) :"
    echo "$hits"
    exit 2
  fi
fi
echo "Aucun motif suspect détecté. Relis quand même le PDF en entier, y compris les captures d'écran."
