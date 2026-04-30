import { useState, useMemo } from 'react'
import NoteEditor from './NoteEditor.jsx'
import { getVerse, isWarshAvailable } from '../quranText.js'

/**
 * Liste des notes, groupées par sourate.
 * Props:
 *  - notes: dict {id -> note}
 *  - surahs: liste de sourates
 *  - warshReady: bool
 *  - onSelect: (page) => void  (aller à la page de la note)
 *  - onDelete: (noteId) => void
 *  - onSaveNote: (noteData) => void
 *  - onClose: () => void
 */
export default function Notes({ notes, surahs, warshReady, onSelect, onDelete, onSaveNote, onClose }) {
  const [editingNote, setEditingNote] = useState(null)

  // Grouper notes par sourate
  const grouped = useMemo(() => {
    const list = Object.values(notes)
    list.sort((a, b) => {
      // Tri par sourate ASC, puis verset ASC
      const sa = a.surah || 999
      const sb = b.surah || 999
      if (sa !== sb) return sa - sb
      return (a.verse || 0) - (b.verse || 0)
    })
    const groups = new Map()
    for (const note of list) {
      const key = note.surah || 0
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(note)
    }
    return groups
  }, [notes])

  const total = Object.keys(notes).length

  const handleSaveFromList = (noteData) => {
    onSaveNote({
      ...noteData,
      page: editingNote?.page,
      existingId: editingNote?.id
    })
    setEditingNote(null)
  }

  const handleDeleteFromList = (noteId) => {
    onDelete(noteId)
    setEditingNote(null)
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <button className="btn-icon" onClick={onClose} aria-label="Fermer">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h2>Notes</h2>
        <div className="screen-counter">{total}</div>
      </header>

      <div className="screen-body">
        {total === 0 && (
          <div className="empty-state">
            <p>Aucune note pour le moment.</p>
            <p className="empty-hint">Touchez l'icône note dans la barre inférieure pour en créer une.</p>
          </div>
        )}

        {Array.from(grouped.entries()).map(([surahNum, list]) => {
          const surah = surahs.find(s => s.num === surahNum)
          return (
            <div key={surahNum} className="notes-group">
              <div className="notes-group-header">
                {surah ? (
                  <>
                    <span className="arabic notes-group-ar">{surah.name_ar}</span>
                    <span className="notes-group-tr">{surah.num}. {surah.name_tr}</span>
                  </>
                ) : (
                  <span className="notes-group-tr">Sourate inconnue</span>
                )}
                <span className="notes-group-count">{list.length}</span>
              </div>

              {list.map(note => {
                const verseTxt = (warshReady || isWarshAvailable()) ? getVerse(note.surah, note.verse) : null
                return (
                  <div key={note.id} className="note-item">
                    <div className="note-item-meta">
                      <span className="note-verse-tag">
                        {note.surah}:{note.verse}{note.legacy && ' ⚠️'}
                      </span>
                      <span className="note-page-tag">page {note.page}</span>
                      <span className="note-date">{formatDate(note.updatedAt)}</span>
                    </div>

                    {verseTxt && (
                      <div className="arabic note-verse-text">{verseTxt}</div>
                    )}

                    <div className="note-item-text">{note.text}</div>

                    <div className="note-item-actions">
                      <button
                        className="btn-tertiary"
                        onClick={() => onSelect(note.page)}
                      >
                        Voir page
                      </button>
                      <button
                        className="btn-tertiary"
                        onClick={() => setEditingNote(note)}
                      >
                        Modifier
                      </button>
                      <button
                        className="btn-tertiary danger"
                        onClick={() => {
                          if (window.confirm('Supprimer cette note ?')) onDelete(note.id)
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {editingNote && (
        <NoteEditor
          existingNote={editingNote}
          defaultSurah={editingNote.surah || 1}
          allNotes={notes}
          surahs={surahs}
          warshReady={warshReady}
          onSave={handleSaveFromList}
          onDelete={handleDeleteFromList}
          onClose={() => setEditingNote(null)}
        />
      )}
    </div>
  )
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
