import { useState, useEffect, useCallback } from 'react'
import Reader from './components/Reader.jsx'
import SurahIndex from './components/SurahIndex.jsx'
import Bookmarks from './components/Bookmarks.jsx'
import Welcome from './components/Welcome.jsx'
import Settings from './components/Settings.jsx'
import Notes from './components/Notes.jsx'
import surahs from './data/surahs.json'
import './styles/app.css'

const TOTAL_PAGES = 532
const STORAGE_KEYS = {
  lastPage: 'quran.lastPage',
  lastSeen: 'quran.lastSeen',
  bookmarks: 'quran.bookmarks',
  notes: 'quran.notes',
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

export default function App() {
  const [view, setView] = useState('reader')
  const [pdfPage, setPdfPage] = useState(() => storage.get(STORAGE_KEYS.lastPage, 4))
  const [bookmarks, setBookmarks] = useState(() => storage.get(STORAGE_KEYS.bookmarks, []))
  const [notes, setNotes] = useState(() => storage.get(STORAGE_KEYS.notes, {}))
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

  useEffect(() => { storage.set(STORAGE_KEYS.lastPage, pdfPage) }, [pdfPage])
  useEffect(() => { storage.set(STORAGE_KEYS.bookmarks, bookmarks) }, [bookmarks])
  useEffect(() => { storage.set(STORAGE_KEYS.notes, notes) }, [notes])
  useEffect(() => { storage.set(STORAGE_KEYS.theme, theme) }, [theme])
  useEffect(() => { storage.set(STORAGE_KEYS.keepAwake, keepAwake) }, [keepAwake])
  useEffect(() => { storage.set(STORAGE_KEYS.zoomed, zoomed) }, [zoomed])
  useEffect(() => { storage.set(STORAGE_KEYS.zoomScale, zoomScale) }, [zoomScale])
  useEffect(() => { storage.set(STORAGE_KEYS.autoHide, autoHide) }, [autoHide])
  useEffect(() => { storage.set(STORAGE_KEYS.hapticEnabled, hapticEnabled) }, [hapticEnabled])

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

  const addBookmark = useCallback((label) => {
    const bm = {
      id: Date.now(),
      page: pdfPage,
      label: label || (currentSurah ? `${currentSurah.name_tr}` : `Page ${pdfPage}`),
      surah: currentSurah?.num ?? null,
      createdAt: Date.now()
    }
    setBookmarks(prev => [bm, ...prev])
  }, [pdfPage, currentSurah])

  const removeBookmark = useCallback((id) => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }, [])

  const saveNote = useCallback((page, text) => {
    setNotes(prev => {
      const next = { ...prev }
      if (!text || !text.trim()) {
        delete next[page]
      } else {
        next[page] = {
          text: text.trim(),
          updatedAt: Date.now(),
          surah: findSurahForPage(page)?.num ?? null
        }
      }
      return next
    })
  }, [])

  const deleteNote = useCallback((page) => {
    setNotes(prev => {
      const next = { ...prev }
      delete next[page]
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
          onAddBookmark={addBookmark}
          bookmarks={bookmarks}
          notes={notes}
          onSaveNote={saveNote}
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
          onOpenNotes={() => { setShowSettings(false); setShowNotesList(true) }}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showNotesList && (
        <Notes
          notes={notes}
          surahs={surahs}
          onSelect={goToPage}
          onDelete={deleteNote}
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
