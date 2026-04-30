import { useState, useEffect, useCallback } from 'react'
import Reader from './components/Reader.jsx'
import SurahIndex from './components/SurahIndex.jsx'
import Bookmarks from './components/Bookmarks.jsx'
import Welcome from './components/Welcome.jsx'
import Settings from './components/Settings.jsx'
import Notes from './components/Notes.jsx'
import surahs from './data/surahs.json'
import { preloadWarsh, isWarshDownloaded, downloadWarshText } from './quranText.js'
import './styles/app.css'

const TOTAL_PAGES = 532
const STORAGE_KEYS = {
  lastPage: 'quran.lastPage',
  lastSeen: 'quran.lastSeen',
  bookmarks: 'quran.bookmarks',
  notes: 'quran.notes',
  notesV2: 'quran.notesV2',
  notesMigrated: 'quran.notesMigrated',
  firstRun: 'quran.firstRun',
  downloaded: 'quran.downloaded',
  theme: 'quran.theme',
  keepAwake: 'quran.keepAwake',
  zoomed: 'quran.zoomed',
  zoomScale: 'quran.zoomScale',
  autoHide: 'quran.autoHide',
  hapticEnabled: 'quran.hapticEnabled'
}

const storage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key)
      return v === null ? fallback : JSON.parse(v)
    } catch { return fallback }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }
}

const RESUME_THRESHOLD_MS = 30 * 60 * 1000

/**
 * Migrer les anciennes notes (clé = page) vers la nouvelle structure (clé = noteId)
 * Ancien format : notes[pageNum] = { text, updatedAt, surah }
 * Nouveau format : notes[noteId] = { id, page, surah, verse, text, updatedAt }
 *
 * Pour les anciennes notes, on assigne verse=1 par défaut (l'utilisateur pourra rééditer)
 */
function migrateOldNotes() {
  const alreadyMigrated = storage.get(STORAGE_KEYS.notesMigrated, false)
  if (alreadyMigrated) {
    return storage.get(STORAGE_KEYS.notesV2, {})
  }

  const oldNotes = storage.get(STORAGE_KEYS.notes, {})
  const newNotes = {}
  let counter = Date.now()

  for (const [pageStr, oldNote] of Object.entries(oldNotes)) {
    const page = parseInt(pageStr, 10)
    if (isNaN(page) || !oldNote || !oldNote.text) continue
    const noteId = `n${counter++}`
    newNotes[noteId] = {
      id: noteId,
      page,
      surah: oldNote.surah || null,
      verse: 1, // valeur par défaut, à éditer
      text: oldNote.text,
      updatedAt: oldNote.updatedAt || Date.now(),
      legacy: true // marqueur pour indiquer migration
    }
  }

  storage.set(STORAGE_KEYS.notesV2, newNotes)
  storage.set(STORAGE_KEYS.notesMigrated, true)
  return newNotes
}

export default function App() {
  const [view, setView] = useState('reader')
  const [pdfPage, setPdfPage] = useState(() => storage.get(STORAGE_KEYS.lastPage, 4))
  const [bookmarks, setBookmarks] = useState(() => storage.get(STORAGE_KEYS.bookmarks, []))
  const [notes, setNotes] = useState(() => migrateOldNotes())
  const [showWelcome, setShowWelcome] = useState(() => !storage.get(STORAGE_KEYS.firstRun, false))
  const [downloaded, setDownloaded] = useState(() => storage.get(STORAGE_KEYS.downloaded, false))
  const [theme, setTheme] = useState(() => storage.get(STORAGE_KEYS.theme, 'auto'))
  const [keepAwake, setKeepAwake] = useState(() => storage.get(STORAGE_KEYS.keepAwake, true))
  const [zoomed, setZoomed] = useState(() => storage.get(STORAGE_KEYS.zoomed, false))
  const [zoomScale, setZoomScale] = useState(() => storage.get(STORAGE_KEYS.zoomScale, 1.45))
  const [autoHide, setAutoHide] = useState(() => storage.get(STORAGE_KEYS.autoHide, true))
  const [hapticEnabled, setHapticEnabled] = useState(() => storage.get(STORAGE_KEYS.hapticEnabled, true))
  const [showSettings, setShowSettings] = useState(false)
  const [showNotesList, setShowNotesList] = useState(false)
  const [resumePrompt, setResumePrompt] = useState(null)
  const [warshReady, setWarshReady] = useState(() => isWarshDownloaded())

  useEffect(() => { storage.set(STORAGE_KEYS.lastPage, pdfPage) }, [pdfPage])
  useEffect(() => { storage.set(STORAGE_KEYS.bookmarks, bookmarks) }, [bookmarks])
  useEffect(() => { storage.set(STORAGE_KEYS.notesV2, notes) }, [notes])
  useEffect(() => { storage.set(STORAGE_KEYS.theme, theme) }, [theme])
  useEffect(() => { storage.set(STORAGE_KEYS.keepAwake, keepAwake) }, [keepAwake])
  useEffect(() => { storage.set(STORAGE_KEYS.zoomed, zoomed) }, [zoomed])
  useEffect(() => { storage.set(STORAGE_KEYS.zoomScale, zoomScale) }, [zoomScale])
  useEffect(() => { storage.set(STORAGE_KEYS.autoHide, autoHide) }, [autoHide])
  useEffect(() => { storage.set(STORAGE_KEYS.hapticEnabled, hapticEnabled) }, [hapticEnabled])

  // Précharger Warsh en mémoire au démarrage si déjà téléchargé
  useEffect(() => {
    if (warshReady) preloadWarsh()
  }, [warshReady])

  // Si pas téléchargé et online, télécharger en arrière-plan
  useEffect(() => {
    if (warshReady) return
    if (!navigator.onLine) return
    let cancelled = false
    downloadWarshText().then(success => {
      if (success && !cancelled) setWarshReady(true)
    })
    return () => { cancelled = true }
  }, [warshReady])

  // Exposer zoomScale en CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--zoom-scale', zoomScale)
  }, [zoomScale])

  useEffect(() => {
    const updateLastSeen = () => storage.set(STORAGE_KEYS.lastSeen, {
      page: pdfPage,
      ts: Date.now()
    })
    updateLastSeen()
    const interval = setInterval(updateLastSeen, 30000)
    return () => clearInterval(interval)
  }, [pdfPage])

  useEffect(() => {
    if (showWelcome) return
    const lastSeen = storage.get(STORAGE_KEYS.lastSeen, null)
    if (!lastSeen) return
    const elapsed = Date.now() - lastSeen.ts
    if (elapsed >= RESUME_THRESHOLD_MS && lastSeen.page && lastSeen.page !== pdfPage) {
      setResumePrompt({ page: lastSeen.page, elapsed })
    } else if (elapsed >= RESUME_THRESHOLD_MS && lastSeen.page) {
      setResumePrompt({ page: lastSeen.page, elapsed, sameAsCurrent: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWelcome])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  useEffect(() => {
    if (!keepAwake) return
    let wakeLock = null
    let cancelled = false

    const requestLock = async () => {
      if (!('wakeLock' in navigator)) return
      try { wakeLock = await navigator.wakeLock.request('screen') } catch {}
    }

    const onVisibility = () => {
      if (!cancelled && document.visibilityState === 'visible') {
        requestLock()
      }
    }

    requestLock()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (wakeLock) wakeLock.release().catch(() => {})
    }
  }, [keepAwake])

  const currentSurah = findSurahForPage(pdfPage)

  const goToPage = useCallback((p) => {
    const clamped = Math.max(1, Math.min(TOTAL_PAGES, p))
    setPdfPage(clamped)
    setView('reader')
  }, [])

  // ===== BOOKMARKS avec TOGGLE =====
  const toggleBookmark = useCallback((label) => {
    setBookmarks(prev => {
      const existing = prev.find(b => b.page === pdfPage)
      if (existing) {
        // Retirer le bookmark de cette page
        return prev.filter(b => b.page !== pdfPage)
      } else {
        // Ajouter
        const bm = {
          id: Date.now(),
          page: pdfPage,
          label: label || (currentSurah ? `${currentSurah.name_tr}` : `Page ${pdfPage}`),
          surah: currentSurah?.num ?? null,
          createdAt: Date.now()
        }
        return [bm, ...prev]
      }
    })
  }, [pdfPage, currentSurah])

  const removeBookmark = useCallback((id) => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }, [])

  // ===== NOTES par sourate+verset =====
  /**
   * saveNote: { surah, verse, text, page, existingId? }
   * - Si existingId fourni → met à jour cette note
   * - Sinon, si une note existe déjà pour (surah, verse) → la remplace
   * - Sinon → crée une nouvelle note
   */
  const saveNote = useCallback((noteData) => {
    const { surah, verse, text, page, existingId } = noteData
    setNotes(prev => {
      const next = { ...prev }

      if (existingId) {
        // Mise à jour d'une note existante
        if (next[existingId]) {
          if (!text || !text.trim()) {
            delete next[existingId]
          } else {
            next[existingId] = {
              ...next[existingId],
              surah,
              verse,
              text: text.trim(),
              page: page || next[existingId].page,
              updatedAt: Date.now(),
              legacy: false
            }
          }
        }
      } else {
        // Vérifier si une note existe déjà pour ce couple sourate+verset
        const existing = Object.values(next).find(n => n.surah === surah && n.verse === verse)
        if (existing) {
          if (!text || !text.trim()) {
            delete next[existing.id]
          } else {
            next[existing.id] = {
              ...existing,
              text: text.trim(),
              page: page || existing.page,
              updatedAt: Date.now(),
              legacy: false
            }
          }
        } else if (text && text.trim()) {
          // Nouvelle note
          const id = `n${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
          next[id] = {
            id,
            page: page || pdfPage,
            surah,
            verse,
            text: text.trim(),
            updatedAt: Date.now()
          }
        }
      }
      return next
    })
  }, [pdfPage])

  const deleteNote = useCallback((noteId) => {
    setNotes(prev => {
      const next = { ...prev }
      delete next[noteId]
      return next
    })
  }, [])

  const dismissWelcome = useCallback(() => {
    storage.set(STORAGE_KEYS.firstRun, true)
    setShowWelcome(false)
  }, [])

  const markDownloaded = useCallback(() => {
    storage.set(STORAGE_KEYS.downloaded, true)
    setDownloaded(true)
  }, [])

  const acceptResume = () => {
    if (resumePrompt) goToPage(resumePrompt.page)
    setResumePrompt(null)
  }
  const dismissResume = () => setResumePrompt(null)

  if (showWelcome) {
    return (
      <Welcome
        onContinue={dismissWelcome}
        onDownloadComplete={markDownloaded}
        alreadyDownloaded={downloaded}
      />
    )
  }

  // Notes pour la page courante (peut être plusieurs)
  const notesForCurrentPage = Object.values(notes).filter(n => n.page === pdfPage)

  return (
    <div className="app">
      {view === 'reader' && (
        <Reader
          pdfPage={pdfPage}
          totalPages={TOTAL_PAGES}
          surah={currentSurah}
          onPageChange={setPdfPage}
          onOpenIndex={() => setView('index')}
          onOpenBookmarks={() => setView('bookmarks')}
          onOpenSettings={() => setShowSettings(true)}
          onToggleBookmark={toggleBookmark}
          bookmarks={bookmarks}
          notesForPage={notesForCurrentPage}
          allNotes={notes}
          onSaveNote={saveNote}
          onDeleteNote={deleteNote}
          surahs={surahs}
          warshReady={warshReady}
          zoomed={zoomed}
          onToggleZoom={() => setZoomed(z => !z)}
          autoHide={autoHide}
          hapticEnabled={hapticEnabled}
        />
      )}
      {view === 'index' && (
        <SurahIndex
          surahs={surahs}
          currentPage={pdfPage}
          onSelect={goToPage}
          onClose={() => setView('reader')}
          totalPages={TOTAL_PAGES}
        />
      )}
      {view === 'bookmarks' && (
        <Bookmarks
          bookmarks={bookmarks}
          onSelect={goToPage}
          onRemove={removeBookmark}
          onClose={() => setView('reader')}
        />
      )}
      {showSettings && (
        <Settings
          theme={theme}
          onThemeChange={setTheme}
          keepAwake={keepAwake}
          onKeepAwakeChange={setKeepAwake}
          zoomed={zoomed}
          onZoomedChange={setZoomed}
          zoomScale={zoomScale}
          onZoomScaleChange={setZoomScale}
          autoHide={autoHide}
          onAutoHideChange={setAutoHide}
          hapticEnabled={hapticEnabled}
          onHapticEnabledChange={setHapticEnabled}
          notesCount={Object.keys(notes).length}
          warshReady={warshReady}
          onRedownloadWarsh={async () => {
            const ok = await downloadWarshText()
            if (ok) setWarshReady(true)
            return ok
          }}
          onOpenNotes={() => { setShowSettings(false); setShowNotesList(true) }}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showNotesList && (
        <Notes
          notes={notes}
          surahs={surahs}
          warshReady={warshReady}
          onSelect={goToPage}
          onDelete={deleteNote}
          onSaveNote={saveNote}
          onClose={() => setShowNotesList(false)}
        />
      )}
      {resumePrompt && !showSettings && !showNotesList && view === 'reader' && (
        <ResumeBanner
          page={resumePrompt.page}
          elapsed={resumePrompt.elapsed}
          sameAsCurrent={resumePrompt.sameAsCurrent}
          surah={findSurahForPage(resumePrompt.page)}
          onAccept={acceptResume}
          onDismiss={dismissResume}
        />
      )}
    </div>
  )
}

function findSurahForPage(pdfPage) {
  let current = null
  for (const s of surahs) {
    if (s.page_pdf <= pdfPage) current = s
    else break
  }
  return current
}

function ResumeBanner({ page, elapsed, sameAsCurrent, surah, onAccept, onDismiss }) {
  const humanTime = formatElapsed(elapsed)
  return (
    <div className="resume-banner">
      <div className="resume-banner-content">
        <div className="resume-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </div>
        <div className="resume-text">
          <div className="resume-title">
            {sameAsCurrent ? 'Bon retour' : 'Reprendre la lecture'}
          </div>
          <div className="resume-details">
            {surah && <span className="arabic resume-ar">{surah.name_ar}</span>}
            <span>page {page} · il y a {humanTime}</span>
          </div>
        </div>
        {!sameAsCurrent && (
          <button className="resume-btn" onClick={onAccept}>Y aller</button>
        )}
        <button className="resume-close" onClick={onDismiss} aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function formatElapsed(ms) {
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} j`
  const weeks = Math.floor(days / 7)
  return `${weeks} sem.`
}
