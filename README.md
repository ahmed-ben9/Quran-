# Pages du mode Mushaf de NŪR

Pages du **Mushaf at-Tajwid, riwaya Warsh ʿan Nāfiʿ (ṭarīq al-Azraq)**, Dar al-Maʿrifa (Damas),
mise en page de Médine : 604 pages de 15 lignes. Source du PDF : assabile.com.

- `p/001.webp` … `p/604.webp` : pages (800 × 1225 px), numérotées comme dans le mushaf.
- `layout/001.json` … : lignes de texte et position estimée de chaque mot.
  - `l` : `[ligne, y0, y1, x0, x1]` en pixels de l'image d'origine 1000 × 1531 ;
  - `w` : `[sourate, verset Warsh, index du mot dans le verset, ligne, x gauche, x droite]`.

Construction : débuts de page de la mise en page de Médine (quran-meta, MIT), texte Warsh KFGQPC v10,
lignes et ronds de fin de verset détectés automatiquement sur les scans. Contrôle : le nombre de fins de
verset attendu concorde avec les ronds détectés sur les 604 pages. Les lignes sont mesurées ; la position
des mots dans une ligne est une estimation ancrée sur les ronds de fin de verset.
