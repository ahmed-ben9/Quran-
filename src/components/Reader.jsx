import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import surahs from '../data/surahs.json'
import { haptic } from '../utils.js'
import NoteEditor from './NoteEditor.jsx'

const pageUrl = (n) => `/pages/${String(n).padStart(3, '0')}.webp`

export default function Reader({
  pdfPage, totalPages, surah,
  onPageChange, onOpenIndex, onOpenBookmarks, onOpenSettings,
  onToggleBookmark, bookmarks,
  notesForPage, allNotes, onSaveNote, onDeleteNote, warshReady,
  zoomed, onToggleZoom, autoHide, hapticEnabled
}) {
  const [showControls, setShowControls] = useState(true)
  const [jumpInput, setJumpInput] = useState('')
  const [showJump, setShowJump] = useState(false)
  const [toast, setToast] = useState(null)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [editingNote, setEditingNote] = useState(null) // null = nouvelle note, ou {note}
  const [scrubbing, setScrubbing] = useState(null)
  const [swipingInZoom, setSwipingInZoom] = useState(false)
  const pageStageRef = useRef(null)
  const indicatorRef = useRef(null)
  const touchStart = useRef(null)
  const lastTapRef = useRef(0)
  const autoHideTimer = useRef(null)
  const toastTimer = useRef(null)
  const scrubLongPressTimer = useRef(null)
  const scrubLastHapticPage = useRef(null)

  const buzz = useCallback((type = 'light') => {
    if (hapticEnabled) haptic(type)
  }, [hapticEnabled])

  // Préchargement
  useEffect(() => {
    const preload = (n) => {
      if (n < 1 || n > totalPages) return
      const img = new Image()
      img.src = pageUrl(n)
    }
    preload(pdfPage + 1)
    preload(pdfPage - 1)
    preload(pdfPage + 2)
  }, [pdfPage, totalPages])

  // Calcul de la progression dans la sourate courante
  const surahProgress = useMemo(() => {
    if (!surah) return null
    const idx = surahs.findIndex(s => s.num === surah.num)
    const nextSurah = surahs[idx + 1]
    const surahStart = surah.page_pdf
    const surahEnd = nextSurah ? nextSurah.page_pdf - 1 : totalPages
    const pagesInSurah = surahEnd - surahStart + 1
    const currentPosInSurah = pdfPage - surahStart + 1
    const percent = (currentPosInSurah / pagesInSurah) * 100
    return {
      current: currentPosInSurah,
      total: pagesInSurah,
      percent: Math.max(0, Math.min(100, percent))
    }
  }, [surah, pdfPage, totalPages])

  // Masquage auto
  const scheduleAutoHide = useCallback(() => {
    if (autoHideTimer.current) clearTimeout(autoHideTimer.current)
    if (!autoHide) return
    autoHideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [autoHide])

  useEffect(() => {
    if (showControls) scheduleAutoHide()
    return () => {
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current)
    }
  }, [showControls, scheduleAutoHide])

  useEffect(() => { setShowControls(true) }, [pdfPage])

  const goPrev = useCallback(() => {
    if (pdfPage > 1) {
      onPageChange(pdfPage - 1)
      buzz('light')
    }
  }, [pdfPage, onPageChange, buzz])

  const goNext = useCallback(() => {
    if (pdfPage < totalPages) {
      onPageChange(pdfPage + 1)
      buzz('light')
    }
  }, [pdfPage, totalPages, onPageChange, buzz])

  // Touch handlers
  const onTouchStart = (e) => {
    if (e.touches.length > 1) { touchStart.current = null; return }
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() }
  }

  const onTouchMove = (e) => {
    if (!touchStart.current) return
    if (!zoomed) return
    const t = e.touches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    // Si mouvement horizontal significatif en zoom → masquer barres
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      if (!swipingInZoom) {
        setSwipingInZoom(true)
        setShowControls(false)
      }
    }
  }

  const onTouchEnd = (e) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    const dt = Date.now() - touchStart.current.time
    touchStart.current = null
    setSwipingInZoom(false)

    // Swipe horizontal (sens arabe : droite = suivant)
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
      if (dx > 0) goNext()
      else goPrev()
      return
    }

    // Tap simple ou double
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 300) {
      const now = Date.now()
      const timeSinceLastTap = now - lastTapRef.current

      if (timeSinceLastTap < 350) {
        lastTapRef.current = 0
        onToggleZoom()
        buzz('medium')
        showToast(zoomed ? 'Zoom désactivé' : 'Zoom activé')
        setShowControls(true)
      } else {
        lastTapRef.current = now
        setTimeout(() => {
          if (lastTapRef.current === now) {
            setShowControls(s => !s)
            lastTapRef.current = 0
          }
        }, 350)
      }
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') {
        setShowJump(false)
        setShowNoteEditor(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  const handleJump = (e) => {
    e.preventDefault()
    const n = parseInt(jumpInput, 10)
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onPageChange(n)
      setJumpInput('')
      setShowJump(false)
      buzz('medium')
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1500)
  }

  const isBookmarked = bookmarks.some(b => b.page === pdfPage)
  const hasNote = notesForPage && notesForPage.length > 0

  const doToggleBookmark = () => {
    onToggleBookmark()
    buzz('medium')
    showToast(isBookmarked ? 'Marque-page retiré' : 'Marque-page ajouté')
  }

  // ===== Note editor =====
  const openNewNote = () => {
    setEditingNote(null)
    setShowNoteEditor(true)
    buzz('light')
  }

  const openExistingNote = (note) => {
    setEditingNote(note)
    setShowNoteEditor(true)
    buzz('light')
  }

  const handleSaveNote = (noteData) => {
    onSaveNote({
      ...noteData,
      page: pdfPage,
      existingId: editingNote?.id
    })
    setShowNoteEditor(false)
    buzz('medium')
    showToast(noteData.text?.trim() ? 'Note enregistrée' : 'Note supprimée')
  }

  const handleDeleteNote = (noteId) => {
    onDeleteNote(noteId)
    setShowNoteEditor(false)
    buzz('medium')
    showToast('Note supprimée')
  }

  // ===== SCRUB PREVIEW =====
  const scrubFromX = useRef({ startX: 0, startPage: pdfPage, width: 0 })

  const handleIndicatorPointerDown = (e) => {
    const startX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0
    scrubFromX.current = {
      startX,
      startPage: pdfPage,
      width: window.innerWidth
    }
    if (scrubLongPressTimer.current) clearTimeout(scrubLongPressTimer.current)
    scrubLongPressTimer.current = setTimeout(() => {
      setScrubbing({ page: pdfPage })
      scrubLastHapticPage.current = pdfPage
      buzz('medium')
    }, 250)
  }

  const handleIndicatorPointerMove = (e) => {
    if (!scrubbing) return
    const x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0
    const dx = x - scrubFromX.current.startX
    const range = 150
    const delta = Math.round((dx / scrubFromX.current.width) * range)
    let newPage = scrubFromX.current.startPage + delta
    newPage = Math.max(1, Math.min(totalPages, newPage))
    if (newPage !== scrubbing.page) {
      setScrubbing({ page: newPage })
      if (Math.abs(newPage - (scrubLastHapticPage.current || 0)) >= 5) {
        buzz('light')
        scrubLastHapticPage.current = newPage
      }
    }
  }

  const handleIndicatorPointerUp = () => {
    if (scrubLongPressTimer.current) {
      clearTimeout(scrubLongPressTimer.current)
      scrubLongPressTimer.current = null
    }
    if (scrubbing) {
      onPageChange(scrubbing.page)
      buzz('medium')
      setScrubbing(null)
    } else {
      setShowJump(true)
    }
  }

  const handleIndicatorPointerCancel = () => {
    if (scrubLongPressTimer.current) {
      clearTimeout(scrubLongPressTimer.current)
      scrubLongPressTimer.current = null
    }
    setScrubbing(null)
  }

  const scrubSurah = useMemo(() => {
    if (!scrubbing) return null
    let s = null
    for (const surah of surahs) {
      if (surah.page_pdf <= scrubbing.page) s = surah
      else break
    }
    return s
  }, [scrubbing])

  const printedPage = surah
    ? (pdfPage - (pdfPage > 362 ? 362 : pdfPage > 242 ? 242 : pdfPage > 114 ? 114 : 2))
    : pdfPage
  const rubNumber = pdfPage > 362 ? 4 : pdfPage > 242 ? 3 : pdfPage > 114 ? 2 : 1

  return (
    <div className={`reader ${zoomed ? 'zoomed' : ''}`}>
      {/* Barre supérieure */}
      <header className={`reader-header ${showControls ? 'visible' : 'hidden'}`}>
        <button className="btn-icon" onClick={() => { onOpenIndex(); buzz('light') }} aria-label="Sommaire">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="reader-title" onClick={() => { setShowJump(true); buzz('light') }}>
          {surah && (
            <>
              <div className="surah-name-ar arabic">{surah.name_ar}</div>
              <div className="surah-meta">
                {surah.num}. {surah.name_tr} · {surah.ayat} versets
              </div>
            </>
          )}
        </div>

        <div className="header-actions">
          <button
            className={`btn-icon ${zoomed ? 'active' : ''}`}
            onClick={() => {
              onToggleZoom()
              buzz('medium')
              showToast(zoomed ? 'Zoom désactivé' : 'Zoom activé')
            }}
            aria-label="Zoom"
          >
            {zoomed ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            )}
          </button>
          <button className="btn-icon" onClick={() => { onOpenSettings(); buzz('light') }} aria-label="Réglages">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button className="btn-icon" onClick={() => { onOpenBookmarks(); buzz('light') }} aria-label="Marque-pages">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Barre de progression dans la sourate (sens RTL) */}
      {surahProgress && (
        <div className={`surah-progress ${showControls ? 'visible' : 'hidden'}`}>
          <div className="surah-progress-track">
            <div
              className="surah-progress-fill"
              style={{ width: `${surahProgress.percent}%` }}
            />
          </div>
          <div className="surah-progress-label">
            {surahProgress.current} / {surahProgress.total}
          </div>
        </div>
      )}

      {/* Page centrale */}
      <div
        ref={pageStageRef}
        className="page-stage"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          key={pdfPage}
          className="page-image page-transition"
          src={pageUrl(pdfPage)}
          alt={`Page ${pdfPage}`}
          draggable={false}
        />
      </div>

      {/* Badges notes (gauche) */}
      {hasNote && showControls && (
        <div className="notes-indicators">
          {notesForPage.map((note, i) => (
            <button
              key={note.id}
              className="note-indicator"
              onClick={() => openExistingNote(note)}
              aria-label={`Note ${i + 1}`}
              style={{ top: `calc(var(--sat) + ${100 + i * 44}px)` }}
            >
              <span className="note-indicator-num">{i + 1}</span>
            </button>
          ))}
        </div>
      )}

      {/* Scrub preview */}
      {scrubbing && scrubSurah && (
        <div className="scrub-preview">
          <div className="scrub-page-num">{scrubbing.page}</div>
          <div className="arabic scrub-surah-ar">{scrubSurah.name_ar}</div>
          <div className="scrub-surah-tr">{scrubSurah.num}. {scrubSurah.name_tr}</div>
          <div className="scrub-hint">Relâcher pour aller à cette page</div>
        </div>
      )}

      {/* Barre inférieure */}
      <footer className={`reader-footer ${showControls ? 'visible' : 'hidden'}`}>
        <button className="btn-nav" onClick={goPrev} disabled={pdfPage === 1} aria-label="Page précédente">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          ref={indicatorRef}
          className={`page-indicator ${scrubbing ? 'scrubbing' : ''}`}
          onPointerDown={handleIndicatorPointerDown}
          onPointerMove={handleIndicatorPointerMove}
          onPointerUp={handleIndicatorPointerUp}
          onPointerCancel={handleIndicatorPointerCancel}
          onPointerLeave={handleIndicatorPointerCancel}
        >
          <div className="page-num">{scrubbing ? scrubbing.page : pdfPage}</div>
          <div className="page-total">sur {totalPages}</div>
          <div className="page-printed">Rub` {rubNumber} · page {printedPage}</div>
        </button>

        <button
          className={`btn-note ${hasNote ? 'active' : ''}`}
          onClick={openNewNote}
          aria-label="Ajouter une note"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </button>

        <button
          className={`btn-bookmark ${isBookmarked ? 'active' : ''}`}
          onClick={doToggleBookmark}
          aria-label={isBookmarked ? 'Retirer le marque-page' : 'Ajouter un marque-page'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        <button className="btn-nav" onClick={goNext} disabled={pdfPage === totalPages} aria-label="Page suivante">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </footer>

      {/* Modal saut direct */}
      {showJump && (
        <div className="modal-backdrop" onClick={() => setShowJump(false)}>
          <form className="jump-modal" onClick={e => e.stopPropagation()} onSubmit={handleJump}>
            <h3>Aller à la page</h3>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpInput}
              onChange={e => setJumpInput(e.target.value)}
              placeholder={`1 – ${totalPages}`}
              autoFocus
              inputMode="numeric"
            />
            <div className="jump-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowJump(false)}>
                Annuler
              </button>
              <button type="submit" className="btn-primary">Y aller</button>
            </div>
            <p className="jump-tip">Astuce : appuyez longuement sur l'indicateur de page pour faire défiler les pages rapidement</p>
          </form>
        </div>
      )}

      {/* Note editor (nouveau) */}
      {showNoteEditor && (
        <NoteEditor
          existingNote={editingNote}
          defaultSurah={surah?.num || 1}
          allNotes={allNotes}
          surahs={surahs}
          warshReady={warshReady}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
          onClose={() => setShowNoteEditor(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
