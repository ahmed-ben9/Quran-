import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Format du numéro de page pour le nom de fichier (001.webp .. 532.webp)
 */
const pageUrl = (n) => `/pages/${String(n).padStart(3, '0')}.webp`

export default function Reader({
  pdfPage, totalPages, surah,
  onPageChange, onOpenIndex, onOpenBookmarks, onAddBookmark, bookmarks
}) {
  const [showControls, setShowControls] = useState(true)
  const [jumpInput, setJumpInput] = useState('')
  const [showJump, setShowJump] = useState(false)
  const [toast, setToast] = useState(null)
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const touchStart = useRef(null)

  // Précharger les pages adjacentes
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

  const goPrev = useCallback(() => {
    if (pdfPage > 1) onPageChange(pdfPage - 1)
  }, [pdfPage, onPageChange])

  // En arabe, la lecture va de droite à gauche. Donc swiper vers la gauche = page suivante
  // Mais pour garder l'UX cohérente avec la lecture d'un livre arabe physique (on tourne vers la gauche pour avancer),
  // swipe gauche = avance, swipe droite = recule
  const goNext = useCallback(() => {
    if (pdfPage < totalPages) onPageChange(pdfPage + 1)
  }, [pdfPage, totalPages, onPageChange])

  // Gestion swipe horizontal
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

    // Swipe valide: horizontal dominant, suffisant, rapide
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
      if (dx < 0) goNext()      // swipe vers la gauche -> page suivante
      else goPrev()             // swipe vers la droite -> page précédente
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 300) {
      // Tap simple -> toggle controls
      setShowControls(s => !s)
    }
  }

  // Navigation clavier (desktop)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goNext()       // Flèche gauche = suivant (cohérent avec la direction arabe)
      else if (e.key === 'ArrowRight') goPrev()
      else if (e.key === 'Escape') setShowJump(false)
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
    setToast('Marque-page ajouté')
    setTimeout(() => setToast(null), 1800)
  }

  const printedPage = surah ? (pdfPage - (pdfPage > 362 ? 362 : pdfPage > 242 ? 242 : pdfPage > 114 ? 114 : 2)) : null
  const rubNumber = pdfPage > 362 ? 4 : pdfPage > 242 ? 3 : pdfPage > 114 ? 2 : 1
  const isBookmarked = bookmarks.some(b => b.page === pdfPage)

  return (
    <div
      ref={containerRef}
      className="reader"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
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

        <div className="reader-title">
          {surah && (
            <>
              <div className="surah-name-ar arabic">{surah.name_ar}</div>
              <div className="surah-meta">
                {surah.num}. {surah.name_tr} · {surah.ayat} versets
              </div>
            </>
          )}
        </div>

        <button className="btn-icon" onClick={onOpenBookmarks} aria-label="Marque-pages">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </header>

      {/* Page centrale */}
      <div className="page-stage">
        <img
          ref={imgRef}
          key={pdfPage}
          className="page-image page-transition"
          src={pageUrl(pdfPage)}
          alt={`Page ${pdfPage}`}
          draggable={false}
        />
      </div>

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
          {printedPage !== null && (
            <div className="page-printed">Rub` {rubNumber} · page {printedPage}</div>
          )}
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

      {/* Modal saut direct à une page */}
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

      {/* Toast de confirmation */}
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}
