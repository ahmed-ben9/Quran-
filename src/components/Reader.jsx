import { useState, useEffect, useRef, useCallback } from 'react'

const pageUrl = (n) => `/pages/${String(n).padStart(3, '0')}.webp`

export default function Reader({
  pdfPage, totalPages, surah,
  onPageChange, onOpenIndex, onOpenBookmarks, onOpenSettings,
  onAddBookmark, bookmarks, notes, onSaveNote,
  zoomed, onToggleZoom, autoHide
}) {
  const [showControls, setShowControls] = useState(true)
  const [jumpInput, setJumpInput] = useState('')
  const [showJump, setShowJump] = useState(false)
  const [toast, setToast] = useState(null)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [noteText, setNoteText] = useState('')
  const pageStageRef = useRef(null)
  const touchStart = useRef(null)
  const lastTapRef = useRef(0)
  const autoHideTimer = useRef(null)
  const toastTimer = useRef(null)

  // Préchargement pages voisines
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

  // Masquage auto
  const scheduleAutoHide = useCallback(() => {
    if (autoHideTimer.current) clearTimeout(autoHideTimer.current)
    if (!autoHide) return
    autoHideTimer.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }, [autoHide])

  useEffect(() => {
    if (showControls) scheduleAutoHide()
    return () => {
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current)
    }
  }, [showControls, scheduleAutoHide])

  // À chaque changement de page, remontrer les contrôles
  useEffect(() => {
    setShowControls(true)
  }, [pdfPage])

  const goPrev = useCallback(() => {
    if (pdfPage > 1) onPageChange(pdfPage - 1)
  }, [pdfPage, onPageChange])

  const goNext = useCallback(() => {
    if (pdfPage < totalPages) onPageChange(pdfPage + 1)
  }, [pdfPage, totalPages, onPageChange])

  const showToast = useCallback((msg) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1500)
  }, [])

  // Touch handlers sur la page : swipe, tap, double-tap
  const onTouchStart = (e) => {
    if (e.touches.length > 1) { touchStart.current = null; return }
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() }
  }

  const onTouchEnd = (e) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    const dt = Date.now() - touchStart.current.time
    touchStart.current = null

    // Swipe horizontal clair
    // Sens arabe : swipe vers la droite = page suivante, swipe vers la gauche = page précédente
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
        // DOUBLE TAP → toggle zoom
        lastTapRef.current = 0
        onToggleZoom()
        showToast(zoomed ? 'Zoom désactivé' : 'Zoom activé')
        // Garder les contrôles visibles pendant 3s après un double-tap
        setShowControls(true)
      } else {
        // Premier tap → mémoriser, et préparer single-tap avec léger délai
        lastTapRef.current = now
        // Single tap = toggle des barres, mais on attend 350ms pour voir si c'est un double-tap
        setTimeout(() => {
          if (lastTapRef.current === now) {
            // Toujours le même tap, pas de second → c'était un single tap
            setShowControls(s => !s)
            lastTapRef.current = 0
          }
        }, 350)
      }
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      // Sens arabe : flèche droite = suivant, flèche gauche = précédent
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
    }
  }

  const doAddBookmark = () => {
    onAddBookmark()
    showToast('Marque-page ajouté')
  }

  const openNoteEditor = () => {
    const existing = notes[pdfPage]
    setNoteText(existing?.text || '')
    setShowNoteEditor(true)
  }

  const saveNote = () => {
    onSaveNote(pdfPage, noteText)
    setShowNoteEditor(false)
    showToast(noteText.trim() ? 'Note enregistrée' : 'Note supprimée')
  }

  const deleteCurrentNote = () => {
    onSaveNote(pdfPage, '')
    setShowNoteEditor(false)
    showToast('Note supprimée')
  }

  // Parité de la page : imprimée (PDF - offset selon rub)
  // Mais pour l'effet visuel de pair/impair, utilisons la page imprimée
  const printedPage = surah
    ? (pdfPage - (pdfPage > 362 ? 362 : pdfPage > 242 ? 242 : pdfPage > 114 ? 114 : 2))
    : pdfPage
  const rubNumber = pdfPage > 362 ? 4 : pdfPage > 242 ? 3 : pdfPage > 114 ? 2 : 1

  // Dans le Mushaf : page impaire = page de droite (texte décalé vers la gauche de la page)
  //                  page paire = page de gauche (texte décalé vers la droite de la page)
  // Pour un zoom qui recentre le texte :
  //   - Page impaire → translateX positif (vers la droite) pour recadrer le texte au centre de l'écran
  //   - Page paire → translateX négatif
  const isOddPrinted = printedPage % 2 === 1
  const pageParity = isOddPrinted ? 'odd' : 'even'

  const isBookmarked = bookmarks.some(b => b.page === pdfPage)
  const hasNote = !!notes[pdfPage]

  return (
    <div
      className={`reader ${zoomed ? 'zoomed' : ''}`}
      data-parity={pageParity}
    >
      {/* Barre supérieure */}
      <header className={`reader-header ${showControls ? 'visible' : 'hidden'}`}>
        <button className="btn-icon" onClick={onOpenIndex} aria-label="Sommaire">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="reader-title" onClick={() => setShowJump(true)}>
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
              showToast(zoomed ? '🔍 Zoom désactivé' : '🔍 Zoom activé')
            }}
            aria-label="Zoom"
            style={zoomed ? { background: '#c89b3c', color: '#faf6eb' } : {}}
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
          <button className="btn-icon" onClick={onOpenSettings} aria-label="Réglages">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button className="btn-icon" onClick={onOpenBookmarks} aria-label="Marque-pages">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Page centrale */}
      <div
        ref={pageStageRef}
        className="page-stage"
        onTouchStart={onTouchStart}
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

      {/* Badge note */}
      {hasNote && (
        <button
          className={`note-indicator ${showControls ? 'visible' : 'hidden'}`}
          onClick={openNoteEditor}
          aria-label="Note"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" fill="var(--paper-cream)" />
            <line x1="8" y1="13" x2="16" y2="13" stroke="var(--paper-cream)" />
            <line x1="8" y1="17" x2="13" y2="17" stroke="var(--paper-cream)" />
          </svg>
        </button>
      )}

      {/* Barre inférieure */}
      <footer className={`reader-footer ${showControls ? 'visible' : 'hidden'}`}>
        <button className="btn-nav" onClick={goPrev} disabled={pdfPage === 1} aria-label="Page précédente">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button className="page-indicator" onClick={() => setShowJump(true)}>
          <div className="page-num">{pdfPage}</div>
          <div className="page-total">sur {totalPages}</div>
          <div className="page-printed">Rub` {rubNumber} · page {printedPage}</div>
        </button>

        <button
          className={`btn-note ${hasNote ? 'active' : ''}`}
          onClick={openNoteEditor}
          aria-label="Note"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={hasNote ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" fill="none" stroke={hasNote ? 'var(--paper-cream)' : 'currentColor'} />
            <line x1="8" y1="13" x2="16" y2="13" stroke={hasNote ? 'var(--paper-cream)' : 'currentColor'} />
            <line x1="8" y1="17" x2="13" y2="17" stroke={hasNote ? 'var(--paper-cream)' : 'currentColor'} />
          </svg>
        </button>

        <button
          className={`btn-bookmark ${isBookmarked ? 'active' : ''}`}
          onClick={doAddBookmark}
          aria-label="Ajouter un marque-page"
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
              <button type="submit" className="btn-primary">
                Y aller
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal éditeur de note */}
      {showNoteEditor && (
        <div className="modal-backdrop" onClick={() => setShowNoteEditor(false)}>
          <div className="note-modal" onClick={e => e.stopPropagation()}>
            <header className="note-modal-header">
              <div>
                <h3>Note</h3>
                <div className="note-modal-meta">
                  {surah && <span className="arabic">{surah.name_ar}</span>}
                  <span>Page {pdfPage}</span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowNoteEditor(false)} aria-label="Fermer">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>
            <textarea
              className="note-textarea"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Vos réflexions, questions, mémorisation…"
              autoFocus
              rows={8}
            />
            <div className="note-actions">
              {hasNote && (
                <button className="btn-danger" onClick={deleteCurrentNote}>
                  Supprimer
                </button>
              )}
              <button className="btn-secondary" onClick={() => setShowNoteEditor(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={saveNote}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
