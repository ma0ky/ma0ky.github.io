#!/usr/bin/env python3
"""
Vérifie le site avant publication. À lancer depuis la racine du projet :

    python scripts/valider.py

Contrôle :
  - data/projets.json est un JSON valide (virgule oubliée, guillemet manquant...) ;
  - chaque projet a un slug propre, un titre et un résumé FR/EN ;
  - les images et PDF cités existent et ont un chemin autorisé ;
  - il ne reste pas de placeholders dans les pages (« [À remplacer] », example.com...).

Code de sortie : 0 = rien de bloquant, 1 = erreur à corriger.
Python 3 uniquement, aucune dépendance.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAFE_ASSET = re.compile(r'^(images|files)/[A-Za-z0-9_\-/.]+$')
SAFE_SLUG = re.compile(r'^[a-z0-9-]+$')
DATE = re.compile(r'^\d{4}-\d{2}(-\d{2})?$')
PLACEHOLDERS = ['(à remplacer', '(replace me', '[à remplacer', '[a remplacer', '[replace', 'example.com', 'votre-pseudo', 'votre-profil', '[période', '[period', "[nom de l", '[school name', '[entreprise', '[company']

errors, warnings = [], []


def check_asset(label, path):
    if path is None:
        return
    if not isinstance(path, str) or not SAFE_ASSET.match(path) or '..' in path:
        errors.append(f'{label} : chemin non autorisé « {path} » (attendu : images/... ou files/..., lettres, chiffres, - _ . seulement)')
    elif not (ROOT / path).is_file():
        errors.append(f'{label} : fichier introuvable « {path} »')


def check_bilingual(label, value, required=True):
    if not isinstance(value, dict):
        if required:
            errors.append(f'{label} : doit contenir "fr" et "en"')
        return
    for lang in ('fr', 'en'):
        if required and not str(value.get(lang, '')).strip():
            warnings.append(f'{label} : texte "{lang}" vide')
    text = json.dumps(value, ensure_ascii=False).lower()
    if any(p in text for p in PLACEHOLDERS):
        warnings.append(f'{label} : placeholder encore présent')


# 1. JSON valide ?
data_file = ROOT / 'data' / 'projets.json'
try:
    data = json.loads(data_file.read_text(encoding='utf-8'))
except FileNotFoundError:
    sys.exit('data/projets.json introuvable. Lance le script depuis la racine du projet.')
except json.JSONDecodeError as e:
    sys.exit(f'JSON invalide dans data/projets.json, ligne {e.lineno}, colonne {e.colno} : {e.msg}\n'
             'Causes fréquentes : virgule oubliée entre deux éléments, virgule en trop avant } ou ], guillemet manquant.')

projects = data.get('projects')
if not isinstance(projects, list):
    sys.exit('data/projets.json doit contenir une liste "projects".')

# 2. Contrôle de chaque projet
seen = set()
for i, p in enumerate(projects, 1):
    slug = p.get('slug', '')
    name = f'Projet {i} ({slug or "sans slug"})'
    if not SAFE_SLUG.match(slug):
        errors.append(f'{name} : slug invalide (minuscules, chiffres et tirets uniquement)')
    if slug in seen:
        errors.append(f'{name} : slug en double')
    seen.add(slug)
    if not DATE.match(str(p.get('date', ''))):
        errors.append(f'{name} : date invalide (format 2026-09 ou 2026-09-15)')
    check_bilingual(f'{name} › title', p.get('title'))
    check_bilingual(f'{name} › summary', p.get('summary'))
    for key in ('context', 'approach', 'issues'):
        check_bilingual(f'{name} › {key}', p.get(key), required=False)
    if not isinstance(p.get('stack', []), list):
        errors.append(f'{name} : "stack" doit être une liste')
    check_asset(f'{name} › cover', p.get('cover'))
    check_asset(f'{name} › report', p.get('report'))
    for j, g in enumerate(p.get('gallery', []), 1):
        check_asset(f'{name} › gallery {j}', g.get('image'))
        if not str((g.get('alt') or {}).get('fr', '')).strip():
            warnings.append(f'{name} › gallery {j} : texte alternatif (accessibilité) manquant')

# 3. Placeholders dans les pages
for page in ('index.html', 'en/index.html'):
    text = (ROOT / page).read_text(encoding='utf-8')
    # On ignore les blocs commentés (CV pas encore ajouté).
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S).lower()
    found = sorted({p for p in PLACEHOLDERS if p in text})
    if found:
        warnings.append(f'{page} : placeholders à remplacer → {", ".join(found)}')

# Rapport
print(f'{len(projects)} projet(s) analysé(s).')
for w in warnings:
    print('  ⚠ ', w)
for e in errors:
    print('  ✗ ', e)
if errors:
    print(f'\n{len(errors)} erreur(s) à corriger avant de publier.')
    sys.exit(1)
print('\nAucune erreur bloquante.' + (f' {len(warnings)} avertissement(s) à relire.' if warnings else ' Tout est propre.'))
