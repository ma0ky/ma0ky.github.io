# Portfolio — HTML, CSS et JavaScript purs

Site statique bilingue (FR/EN), thème anthracite et or. **Aucun framework, aucun outil de build, aucune dépendance** : ce que tu vois dans le dossier est exactement ce qui est publié.

## 1. Structure

```
index.html            Accueil en français
en/index.html         Accueil en anglais
projet.html           Page d'un projet (FR)  → projet.html?p=mon-slug
en/project.html       Page d'un projet (EN)
404.html              Page « introuvable »

css/style.css         Toute la mise en forme
js/main.js            Tout le JavaScript (lit data/projets.json, anime la page)
data/projets.json     LA liste de tes projets (le seul fichier à éditer pour en ajouter)

images/projects/      Images de couverture et captures
files/reports/        Rapports PDF (nettoyés !)
files/                CV (cv-fr.pdf, cv-en.pdf)
fonts/                Polices auto-hébergées
```

Les textes fixes (accueil, à propos, parcours, compétences, contact) sont écrits **directement dans le HTML**. Seuls les projets viennent du JSON, parce que c'est ce qui change souvent.

## 2. Voir le site en local

Il faut un petit serveur, car `main.js` charge `data/projets.json` avec `fetch`, ce que le navigateur interdit quand tu ouvres le fichier par double-clic (`file://`).

```bash
python -m http.server 8000      # puis http://localhost:8000
```

(`python3` sous Linux/macOS. Arrêt avec `Ctrl+C`.) Recharge la page après chaque modification.

## 3. Ajouter un projet

1. Mets les fichiers au bon endroit, avec des **noms simples** (lettres sans accent, chiffres, `-` et `_`) :
   - image de couverture → `images/projects/mon-projet-cover.jpg`
   - captures → `images/projects/mon-projet-1.png`
   - rapport nettoyé → `files/reports/mon-projet.pdf` (voir §5)
2. Ouvre `data/projets.json` et ajoute un bloc **dans la liste `projects`** (copie l'exemple existant) :

```json
{
  "slug": "mon-projet",
  "date": "2026-10",
  "featured": false,
  "title":   { "fr": "Titre du projet", "en": "Project title" },
  "summary": { "fr": "Deux phrases.", "en": "Two sentences." },
  "context":  { "fr": "Pourquoi, quel objectif.", "en": "Why, what goal." },
  "approach": { "fr": "Tes choix et pourquoi.", "en": "Your choices and why." },
  "issues":   { "fr": "Erreur : ...\nCause : ...\nSolution : ...", "en": "Error: ...\nCause: ...\nFix: ..." },
  "stack": ["Active Directory", "pfSense"],
  "cover": "images/projects/mon-projet-cover.jpg",
  "gallery": [
    { "image": "images/projects/mon-projet-1.png",
      "alt": { "fr": "Schéma de l'architecture", "en": "Architecture diagram" } }
  ],
  "report": "files/reports/mon-projet.pdf"
}
```

3. Vérifie sur `http://localhost:8000`, puis `git add -A`, `git status` (relis ce qui part), `git commit`, `git push`.

**Règles du JSON** (le piège classique) : pas de virgule après le dernier élément d'une liste ou d'un bloc, guillemets doubles uniquement, pas de commentaires, retour à la ligne dans un texte = `\n`.

Détails :
- `slug` : minuscules, chiffres et tirets. C'est l'adresse de la page (`projet.html?p=mon-projet`). Ne le change plus une fois publié.
- `featured: true` : le projet s'affiche en grand sur l'accueil avec sa couverture. Garde 2 ou 3 projets phares, les autres sont listés en lignes.
- `cover`, `gallery`, `report` peuvent valoir `null` / `[]` s'il n'y en a pas.
- `date` : `2026-10` suffit.

## 4. Modifier les textes fixes

Ouvre `index.html` (FR) **et** `en/index.html` (EN) dans VS Code et remplace tout ce qui est entre `[crochets]`, l'email, les liens GitHub/LinkedIn, ainsi que les parcours et compétences (garde seulement ce que tu peux défendre en entretien).

Une limite du HTML pur à connaître : l'en-tête et le pied de page sont **recopiés dans les 4 pages** (`index.html`, `en/index.html`, `projet.html`, `en/project.html`). Si tu changes la navigation, change-la partout. C'est le prix de zéro outil.

**CV** : dépose 4 fichiers dans `files/` : `cv-stage-fr.pdf`, `cv-alternance-fr.pdf`, `cv-stage-en.pdf`, `cv-alternance-en.pdf`. Les boutons (accueil) et les liens (contact) sont déjà en place dans `index.html` et `en/index.html`.

Couleurs et typographies : variables en haut de `css/style.css`.

## 5. Nettoyer un rapport avant de l'uploader

Un rapport de lab contient souvent des mots de passe en clair, des IP internes, des noms d'hôtes et des métadonnées (auteur, chemins). Ne le mets **jamais** dans le repo tel quel : l'historique Git est public et permanent.

Travaille le brouillon dans `_a-nettoyer/` (dossier ignoré par git, voir `.gitignore`). Si tu trouves un secret, corrige le **document source** et réexporte. Avant l'export, retire les métadonnées (Word : Fichier → Informations → Inspecter le document). Ne « masque » pas un mot de passe avec un rectangle noir : le texte reste dessous. Relis le PDF en entier, **captures d'écran comprises**.

Compresse aussi les images avant upload (idéalement < 300 Ko).

## 6. Déployer sur GitHub Pages

1. Crée un repo **public** sur GitHub (ex. `<ton-pseudo>.github.io` pour avoir le site à la racine du domaine).
2. Dans le dossier du projet :
   ```bash
   git init -b main
   git add -A
   git status        # relis la liste : pas de _a-nettoyer, pas de PDF brut
   git commit -m "Initial commit"
   git remote add origin https://github.com/<ton-pseudo>/<repo>.git
   git push -u origin main
   ```
3. Repo → **Settings → Pages** → *Source* : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
4. Après 1 à 2 minutes, le site est en ligne. Coche **Enforce HTTPS**.

Tous les chemins du site sont relatifs, donc il fonctionne aussi dans un repo au nom quelconque (`https://pseudo.github.io/portfolio/`). Seule exception : `404.html` utilise des chemins absolus (`/css/...`) et n'est correct que pour un site à la racine du domaine. Le fichier `.nojekyll` désactive le traitement Jekyll de GitHub : ne le supprime pas.

## 7. Sécurité

**En place**
- Aucune dépendance, aucun `npm`, aucun serveur : rien à mettre à jour, quasi aucune surface d'attaque côté code.
- Aucune ressource externe (polices, scripts, CDN) : la CSP en `<meta>` n'autorise que le site lui-même (`script-src 'self'`, `default-src 'none'`…).
- Aucun cookie, traceur ni formulaire.
- Le contenu du JSON n'est **jamais** injecté comme du HTML : `main.js` utilise `textContent`. Un titre contenant `<script>` s'affiche comme du texte. Les chemins d'images/PDF sont filtrés (`images/…` ou `files/…` uniquement, pas de `..`, pas d'URL externe, pas de `javascript:`).

**Limites à connaître (et à pouvoir expliquer en entretien)**
- GitHub Pages **ne permet pas de définir des headers HTTP**. La CSP en `<meta>` ne supporte pas `frame-ancestors` : le site peut être affiché dans une iframe (clickjacking). Pas non plus de HSTS ni de `X-Frame-Options` personnalisés. Pour de vrais headers, il faut un hébergeur qui accepte un fichier `_headers` (Cloudflare Pages, Netlify).
- Repo public = **historique public pour toujours**. Supprimer un fichier ne l'efface pas de l'historique. Ne commit jamais un secret ou un rapport non nettoyé.
- Active le **2FA** sur GitHub et protège la branche `main` (Settings → Branches / Rules).
- Les projets sont affichés par JavaScript : sans JS, la liste est vide (un message le dit). C'est le compromis pour ajouter un projet sans toucher au HTML. Les moteurs de recherche voient donc moins bien les projets.

## 8. À faire / à tester

- Remplacer tout le contenu d'exemple (texte entre `[crochets]`, `example.com`).
- Tester un vrai rapport PDF sur ton navigateur **et sur mobile** : le lecteur intégré dépend du navigateur (sur iPhone il n'affiche souvent que la première page), d'où le bouton « Télécharger » toujours présent.
- Tester le site en ligne dans les deux langues, avec le switch FR/EN sur une page projet.
