import { useState, useEffect, useCallback } from 'react'
import Reader from './components/Reader.jsx'
import SurahIndex from './components/SurahIndex.jsx'
import Bookmarks from './components/Bookmarks.jsx'
import Welcome from './components/Welcome.jsx'
import Settings from './components/Settings.jsx'
import surahs from './data/surahs.json'
import './styles/app.css'

const TOTAL_PAGES = 532
const STORAGE_KEYS = {
  lastPage: 'quran.lastPage',
  bookmarks: 'quran.bookmarks',
  firstRun: 'quran.firstRun',
  downloaded: 'quran.downloaded',
  immersive: 'quran.immersive',
  theme: 'quran.theme',
  keepAwake: 'quran.keepAwake'
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

export default function App() {
  const [view, setView] = useState('reader')
  const [pdfPage, setPdfPage] = useState(() => storage.get(STORAGE_KEYS.lastPage, 4))
  const [bookmarks, setBookmarks] = useState(() => storage.get(STORAGE_KEYS.bookmarks, []))
  const [showWelcome, setShowWelcome] = useState(() => !storage.get(STORAGE_KEYS.firstRun, false))
  const [downloaded, setDownloaded] = useState(() => storage.get(STORAGE_KEYS.downloaded, false))
  const [immersive, setImmersive] = useState(() => storage.get(STORAGE_KEYS.immersive, false))
  const [theme, setTheme] = useState(() => storage.get(STORAGE_KEYS.theme, 'auto'))
  const [keepAwake, setKeepAwake] = useState(() => storage.get(STORAGE_KEYS.keepAwake, true))
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => { storage.set(STORAGE_KEYS.lastPage, pdfPage) }, [pdfPage])
  useEffect(() => { storage.set(STORAGE_KEYS.bookmarks, bookmarks) }, [bookmarks])
  useEffect(() => { storage.set(STORAGE_KEYS.immersive, immersive) }, [immersive])
  useEffect(() => { storage.set(STORAGE_KEYS.theme, theme) }, [theme])
  useEffect(() => { storage.set(STORAGE_KEYS.keepAwake, keepAwake) }, [keepAwake])

  // Thème manuel via data-theme sur <html>
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  // Wake Lock — empêcher l'écran de s'éteindre
  useEffect(() => {
    if (!keepAwake) return
    let wakeLock = null
    let cancelled = false

    const requestLock = async () => {
      if (!('wakeLock' in navigator)) return
      try {
        wakeLock = await navigator.wakeLock.request('screen')
      } catch {}
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
      if (wakeLock) {
        wakeLock.release().catch(() => {})
      }
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

  const dismissWelcome = useCallback(() => {
    storage.set(STORAGE_KEYS.firstRun, true)
    setShowWelcome(false)
  }, [])

  const markDownloaded = useCallback(() => {
    storage.set(STORAGE_KEYS.downloaded, true)
    setDownloaded(true)
  }, [])

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
    <div className={`app ${immersive ? 'immersive' : ''}`}>
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
          immersive={immersive}
          onToggleImmersive={() => setImmersive(i => !i)}
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
          onClose={() => setShowSettings(false)}
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
