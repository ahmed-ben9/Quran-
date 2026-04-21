# Coran Warsh — Application de lecture

Application web progressive (PWA) pour lire le **Coran en lecture Warsh `an Nāfi`** (calligraphie maghrébine tunisienne, édition Dar Al-Mushaf Beyrouth) sur téléphone, hors-ligne, avec sommaire et marque-pages.

## Fonctionnalités

- **Lecture hors-ligne complète** après un premier téléchargement (~40 Mo pour les 532 pages)
- **Sommaire des 114 sourates** avec recherche par nom (arabe, français ou numéro) et filtre par rub`
- **Saut direct** à n'importe quelle page par son numéro
- **Marque-pages multiples** avec date de création
- **Reprise automatique** à la dernière page lue
- **Navigation tactile** : swipe gauche/droite, tap pour masquer les barres, pinch-to-zoom
- **PWA installable** sur iPhone (Safari → Partager → Sur l'écran d'accueil)
- **Mode sombre** automatique selon les préférences système

## Démarrage local

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:5173`.

## Build de production

```bash
npm run build
npm run preview
```

Le dossier `dist/` contient le build à déployer.

## Déploiement Vercel

1. Créer un repo GitHub (ex. `quran-warsh-reader`) et pousser le projet
2. Sur [vercel.com](https://vercel.com), importer le repo
3. Framework preset : **Vite** (détecté automatiquement)
4. Build command : `npm run build`
5. Output directory : `dist`
6. Déployer

Une fois déployé, ouvrir l'URL sur l'iPhone dans Safari, puis :
**Partager → Sur l'écran d'accueil** → L'application s'installe comme une app native.

## Structure du projet

```
quran-app/
├── public/
│   ├── pages/              # 532 pages WebP (001.webp à 532.webp)
│   ├── icon-*.png          # Icônes PWA
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Reader.jsx      # Lecteur principal (swipe, nav, bookmark)
│   │   ├── SurahIndex.jsx  # Sommaire des 114 sourates
│   │   ├── Bookmarks.jsx   # Gestion des marque-pages
│   │   └── Welcome.jsx     # Écran d'accueil + téléchargement
│   ├── data/
│   │   └── surahs.json     # Table des 114 sourates → pages PDF
│   ├── styles/
│   │   ├── global.css      # Variables CSS, reset
│   │   └── app.css         # Composants
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js          # Configuration PWA (workbox)
└── package.json
```

## Données persistantes (localStorage)

| Clé | Description |
|-----|-------------|
| `quran.lastPage` | Dernière page lue (pour reprise auto) |
| `quran.bookmarks` | Marque-pages (JSON) |
| `quran.firstRun` | Flag pour ne pas remontrer l'écran d'accueil |
| `quran.downloaded` | Flag indiquant que toutes les pages ont été téléchargées |

## Table des correspondances

Le Mushaf est divisé en **4 rub`** (quarts), chacun avec sa propre numérotation. L'offset page imprimée → page PDF :

| Rub` | Sourates | Offset (pdf = imprimée + offset) |
|------|----------|----------------------------------|
| 1 | 1–6 (Al-Fatiha → Al-An`am) | +2 |
| 2 | 7–18 (Al-A`raf → Al-Kahf) | +114 |
| 3 | 19–35 (Maryam → Fatir) | +242 |
| 4 | 36–114 (Ya-Sin → An-Nas) | +362 |

## Licence

Usage personnel. Les textes coraniques scannés restent la propriété de leur éditeur d'origine (Dar Al-Mushaf Beyrouth).
