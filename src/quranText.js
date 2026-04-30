// Module de gestion du texte coranique Warsh
// - Télécharge le JSON complet depuis jsdelivr CDN au premier accès
// - Stocke dans localStorage pour offline
// - Fournit getVerse(surah, verse) -> texte ou null

const STORAGE_KEY = 'quran.warsh.text'
const META_KEY = 'quran.warsh.meta'
const CDN_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranwarsh.min.json'

let cachedIndex = null // Map { "1:1" -> "بِسْمِ..." }

/**
 * Construit un index Map à partir du JSON
 */
function buildIndex(quranArray) {
  const idx = new Map()
  for (const v of quranArray) {
    idx.set(`${v.chapter}:${v.verse}`, v.text)
  }
  return idx
}

/**
 * Charge l'index depuis localStorage si disponible
 */
function loadFromStorage() {
  if (cachedIndex) return cachedIndex
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.quran)) return null
    cachedIndex = buildIndex(data.quran)
    return cachedIndex
  } catch {
    return null
  }
}

/**
 * Vérifie si le texte est déjà téléchargé
 */
export function isWarshDownloaded() {
  try {
    const meta = localStorage.getItem(META_KEY)
    if (!meta) return false
    const m = JSON.parse(meta)
    return !!m.downloadedAt
  } catch {
    return false
  }
}

/**
 * Télécharge le texte complet depuis le CDN.
 * Retourne true si succès, false si échec (offline par exemple).
 * Callback onProgress(percent) optionnel.
 */
export async function downloadWarshText(onProgress) {
  try {
    if (onProgress) onProgress(5)

    const response = await fetch(CDN_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    if (onProgress) onProgress(40)

    const data = await response.json()
    if (!data || !Array.isArray(data.quran) || data.quran.length < 6000) {
      throw new Error('Données invalides')
    }

    if (onProgress) onProgress(80)

    // Stocker en localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      localStorage.setItem(META_KEY, JSON.stringify({
        downloadedAt: Date.now(),
        verses: data.quran.length
      }))
    } catch (e) {
      // localStorage peut être plein → on fonctionne en mémoire seulement
      console.warn('localStorage plein, fonctionnement en mémoire')
    }

    cachedIndex = buildIndex(data.quran)

    if (onProgress) onProgress(100)
    return true
  } catch (e) {
    console.error('Erreur téléchargement Warsh:', e)
    return false
  }
}

/**
 * Récupère le texte d'un verset.
 * Retourne null si non disponible.
 */
export function getVerse(surah, verse) {
  if (!cachedIndex) {
    cachedIndex = loadFromStorage()
  }
  if (!cachedIndex) return null
  return cachedIndex.get(`${surah}:${verse}`) || null
}

/**
 * Vérifie si un texte est en mémoire / dispo (sans rien charger)
 */
export function isWarshAvailable() {
  if (cachedIndex) return true
  return loadFromStorage() !== null
}

/**
 * Précharger en mémoire (appel idempotent)
 */
export function preloadWarsh() {
  if (cachedIndex) return true
  return loadFromStorage() !== null
}

/**
 * Retourne le nombre approximatif de versets par sourate.
 * On utilise le mapping d'ayat depuis surahs.json côté UI.
 */
