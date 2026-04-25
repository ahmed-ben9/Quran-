// Utilitaires divers

/**
 * Haptique : tente plusieurs méthodes pour déclencher une vibration tactile.
 * - navigator.vibrate() : Android
 * - AudioContext trick : iOS Safari (hack connu)
 * - Haptic API : futures versions d'iOS
 *
 * Sur iOS Safari actuel, l'haptique n'est pas officiellement supportée.
 * On fait de notre mieux mais ça peut ne rien faire sur iPhone.
 *
 * Types : 'light' (tap léger), 'medium' (défaut), 'heavy' (action forte)
 */
export function haptic(type = 'light') {
  try {
    // 1. Standard Web Vibration API (Android, Chrome mobile)
    if ('vibrate' in navigator) {
      const ms = type === 'heavy' ? 15 : type === 'medium' ? 8 : 4
      navigator.vibrate(ms)
      return
    }
  } catch {}

  // 2. iOS fallback via AudioContext (hack silencieux)
  // Certains iPhones déclenchent un haptic très léger via un son court
  // Cette méthode est inconstante mais parfois fonctionne en PWA installée
  // On ne le fait pas par défaut car ça peut générer un son audible.
}

/**
 * Normalise une chaîne pour recherche tolérante :
 * - minuscules
 * - suppression des accents/diacritiques (é → e, ô → o, etc.)
 * - suppression des apostrophes, tirets, espaces
 * - suppression des préfixes communs (al-, an-, ad-, etc.)
 */
export function normalizeForSearch(str) {
  if (!str) return ''
  let s = str.toLowerCase()
  // Retire diacritiques (NFD decomposition + suppression des combining marks)
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  // Retire ponctuation usuelle
  s = s.replace(/['`’\-\s_.,;:!?]/g, '')
  // Retire les préfixes arabes de translittération
  s = s.replace(/^(al|an|ad|ar|as|at|az|ash|adh|ath)/, '')
  return s
}

/**
 * Distance de Levenshtein : nombre de modifications min pour passer d'une chaîne à l'autre.
 * On limite à une taille raisonnable pour la perf.
 */
export function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = new Array(b.length + 1)
  const curr = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      )
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }
  return prev[b.length]
}

/**
 * Recherche tolérante : retourne true si query "ressemble" à target.
 * Tolère les fautes de frappe et les caractères manquants.
 */
export function fuzzyMatch(query, target) {
  const q = normalizeForSearch(query)
  const t = normalizeForSearch(target)
  if (!q) return true
  if (!t) return false

  // Match direct (substring)
  if (t.includes(q)) return true

  // Match tolérant : distance de Levenshtein
  // Seuil adaptatif : tolère 1 faute pour 4 caractères
  const threshold = Math.max(1, Math.floor(q.length / 4))

  // Sliding window pour matcher un morceau de target
  if (q.length <= t.length) {
    for (let i = 0; i <= t.length - q.length; i++) {
      const sub = t.substring(i, i + q.length + threshold)
      if (levenshtein(q, sub.substring(0, q.length)) <= threshold) return true
    }
  }

  // Distance globale
  return levenshtein(q, t) <= threshold
}
