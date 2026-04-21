import { useState } from 'react'
import surahs from '../data/surahs.json'

function findSurah(num) {
  return surahs.find(s => s.num === num)
}

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Bookmarks({ bookmarks, onSelect, onRemove, onClose }) {
  const [confirmId, setConfirmId] = useState(null)

  return (
    <div className="bookmarks-view page-transition">
      <header className="index-header">
        <button className="btn-icon" onClick={onClose} aria-label="Retour">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="index-title">Marque-pages</h1>
        <div style={{ width: 44 }} />
      </header>

      {bookmarks.length === 0 ? (
        <div className="empty-bookmarks">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <p>Aucun marque-page pour le moment.</p>
          <p className="hint">Touchez l'icône <span className="inline-icon">🔖</span> en lecture pour marquer une page.</p>
        </div>
      ) : (
        <div className="bookmark-list">
          {bookmarks.map(bm => {
            const surah = bm.surah ? findSurah(bm.surah) : null
            return (
              <div key={bm.id} className="bookmark-item">
                <button className="bookmark-main" onClick={() => onSelect(bm.page)}>
                  <div className="bookmark-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="bookmark-info">
                    <div className="bookmark-label">{bm.label}</div>
                    <div className="bookmark-details">
                      {surah && <span className="arabic bm-ar">{surah.name_ar}</span>}
                      <span>Page {bm.page}</span>
                      <span className="bm-date">{formatDate(bm.createdAt)}</span>
                    </div>
                  </div>
                </button>
                {confirmId === bm.id ? (
                  <div className="confirm-delete">
                    <button className="btn-confirm" onClick={() => { onRemove(bm.id); setConfirmId(null) }}>
                      Supprimer
                    </button>
                    <button className="btn-cancel" onClick={() => setConfirmId(null)}>
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-delete"
                    onClick={() => setConfirmId(bm.id)}
                    aria-label="Supprimer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
