import { useState } from 'react'

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Notes({ notes, surahs, onSelect, onDelete, onClose }) {
  const [confirmPage, setConfirmPage] = useState(null)

  // Convertir en tableau trié par date (plus récent en premier)
  const entries = Object.entries(notes)
    .map(([page, data]) => ({
      page: parseInt(page, 10),
      ...data
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt)

  const findSurah = (num) => surahs.find(s => s.num === num)

  return (
    <div className="notes-view page-transition">
      <header className="index-header">
        <button className="btn-icon" onClick={onClose} aria-label="Retour">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="index-title">Mes notes</h1>
        <div style={{ width: 44 }} />
      </header>

      {entries.length === 0 ? (
        <div className="empty-bookmarks">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="13" y2="17" />
          </svg>
          <p>Aucune note pour le moment.</p>
          <p className="hint">
            Touchez l'icône note en bas de l'écran pendant votre lecture.
          </p>
        </div>
      ) : (
        <div className="note-list">
          {entries.map(entry => {
            const surah = entry.surah ? findSurah(entry.surah) : null
            return (
              <div key={entry.page} className="note-entry">
                <button
                  className="note-entry-main"
                  onClick={() => onSelect(entry.page)}
                >
                  <div className="note-entry-header">
                    {surah && (
                      <span className="arabic note-entry-ar">{surah.name_ar}</span>
                    )}
                    <span className="note-entry-page">Page {entry.page}</span>
                    <span className="note-entry-date">{formatDate(entry.updatedAt)}</span>
                  </div>
                  <div className="note-entry-text">{entry.text}</div>
                </button>
                {confirmPage === entry.page ? (
                  <div className="note-confirm">
                    <button
                      className="btn-confirm"
                      onClick={() => { onDelete(entry.page); setConfirmPage(null) }}
                    >
                      Supprimer
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => setConfirmPage(null)}
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-delete-note"
                    onClick={() => setConfirmPage(entry.page)}
                    aria-label="Supprimer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
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
