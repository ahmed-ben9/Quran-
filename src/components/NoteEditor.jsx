import { useState, useEffect, useMemo } from 'react'
import { getVerse, isWarshAvailable } from '../quranText.js'

/**
 * Éditeur de note.
 * Props:
 *  - existingNote: { id, surah, verse, text, ... } ou null pour nouvelle note
 *  - defaultSurah: numéro de sourate par défaut (sourate de la page courante)
 *  - allNotes: dict de toutes les notes pour détecter les doublons
 *  - surahs: liste des sourates [{num, name_ar, name_tr, ayat, ...}]
 *  - warshReady: bool, est-ce que le texte Warsh est dispo
 *  - onSave: ({surah, verse, text}) => void
 *  - onDelete: (noteId) => void
 *  - onClose: () => void
 */
export default function NoteEditor({
  existingNote,
  defaultSurah = 1,
  allNotes = {},
  surahs,
  warshReady,
  onSave,
  onDelete,
  onClose
}) {
  const [surahNum, setSurahNum] = useState(existingNote?.surah || defaultSurah)
  const [verseNum, setVerseNum] = useState(existingNote?.verse || 1)
  const [text, setText] = useState(existingNote?.text || '')

  const currentSurah = useMemo(
    () => surahs.find(s => s.num === surahNum),
    [surahs, surahNum]
  )

  // Texte du verset
  const verseText = useMemo(() => {
    if (!warshReady && !isWarshAvailable()) return null
    return getVerse(surahNum, verseNum)
  }, [surahNum, verseNum, warshReady])

  // Détection conflit : note existante pour ce couple (sourate, verset) qu'on n'est pas en train d'éditer
  const conflict = useMemo(() => {
    const conflictNote = Object.values(allNotes).find(n =>
      n.surah === surahNum &&
      n.verse === verseNum &&
      (!existingNote || n.id !== existingNote.id)
    )
    return conflictNote || null
  }, [allNotes, surahNum, verseNum, existingNote])

  // Quand on change de sourate, ramener le verset dans la fourchette
  useEffect(() => {
    if (!currentSurah) return
    if (verseNum > currentSurah.ayat) setVerseNum(1)
    if (verseNum < 1) setVerseNum(1)
  }, [currentSurah, verseNum])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!surahNum || !verseNum) return
    onSave({
      surah: surahNum,
      verse: verseNum,
      text: text.trim()
    })
  }

  const handleDelete = () => {
    if (!existingNote) return
    if (window.confirm('Supprimer cette note ?')) {
      onDelete(existingNote.id)
    }
  }

  const overwriteAndSave = () => {
    // Sauvegarder en remplaçant la note en conflit
    onSave({
      surah: surahNum,
      verse: verseNum,
      text: text.trim()
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="note-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="note-editor-header">
          <h3>{existingNote ? 'Modifier la note' : 'Nouvelle note'}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {existingNote?.legacy && (
            <div className="legacy-warning">
              ⚠️ Note migrée depuis l'ancienne version. Vérifiez le verset.
            </div>
          )}

          <div className="note-editor-row">
            <label className="note-editor-label">
              <span>Sourate</span>
              <select
                className="surah-select"
                value={surahNum}
                onChange={e => setSurahNum(parseInt(e.target.value, 10))}
              >
                {surahs.map(s => (
                  <option key={s.num} value={s.num}>
                    {s.num}. {s.name_tr} ({s.ayat} v.)
                  </option>
                ))}
              </select>
            </label>

            <label className="note-editor-label verse-label">
              <span>Verset</span>
              <input
                className="verse-input"
                type="number"
                min="1"
                max={currentSurah?.ayat || 286}
                value={verseNum}
                onChange={e => setVerseNum(parseInt(e.target.value, 10) || 1)}
                inputMode="numeric"
              />
            </label>
          </div>

          {currentSurah && (
            <div className="surah-name-display arabic">
              {currentSurah.name_ar} · {surahNum}:{verseNum}
            </div>
          )}

          {/* Affichage du verset Warsh */}
          <div className="verse-display">
            {verseText ? (
              <div className="verse-text arabic">{verseText}</div>
            ) : !warshReady && !isWarshAvailable() ? (
              <div className="verse-unavailable">
                Texte coranique non disponible (téléchargez-le dans les Réglages pour voir les versets)
              </div>
            ) : (
              <div className="verse-unavailable">Verset introuvable</div>
            )}
          </div>

          {conflict && (
            <div className="conflict-warning">
              Une note existe déjà pour {currentSurah?.name_tr} {surahNum}:{verseNum}.
              <br />
              <span className="conflict-text">« {conflict.text.slice(0, 80)}{conflict.text.length > 80 ? '…' : ''} »</span>
            </div>
          )}

          <textarea
            className="note-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Votre note…"
            rows={5}
            autoFocus={!existingNote}
          />

          <div className="note-editor-actions">
            {existingNote && (
              <button type="button" className="btn-danger" onClick={handleDelete}>
                Supprimer
              </button>
            )}
            <div className="note-editor-spacer" />
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            {conflict ? (
              <button type="button" className="btn-primary" onClick={overwriteAndSave}>
                Remplacer
              </button>
            ) : (
              <button type="submit" className="btn-primary" disabled={!text.trim()}>
                Enregistrer
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
